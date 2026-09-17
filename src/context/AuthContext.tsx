import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Session, User } from '@supabase/supabase-js';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase } from '../services/supabaseClient';
import { store } from '../store';
import { resetFinanceState } from '../store/slices/financeSlice';
import {
  getStoredProfileImage,
  setStoredEmail,
  setStoredProfileImage,
} from '../services/storage';

WebBrowser.maybeCompleteAuthSession();

const OAUTH_CALLBACK_PATH = 'auth/callback';

// En Expo Go el callback es exp://<host>/--/auth/callback; GoTrue rechaza IPs privadas,
// así que la sesión de Google exige `expo start --tunnel`. En un dev build queda
// controldegastos://auth/callback y funciona por LAN.
function getOAuthRedirectUri(): string {
  return makeRedirectUri({
    scheme: 'controldegastos',
    path: OAUTH_CALLBACK_PATH,
  });
}

function isOAuthCallbackUrl(url: string): boolean {
  if (!url) return false;
  const hasTokens = url.includes('access_token=') || url.includes('refresh_token=');
  const hasTokenHash = url.includes('token_hash=') || url.includes('token=');
  const hasCode = /[?&#]code=/.test(url);
  const hasAuthError = url.includes('error_description=') || url.includes('error=');
  const isAppCallback =
    url.includes(OAUTH_CALLBACK_PATH) ||
    url.startsWith('controldegastos://') ||
    url.includes('--/auth/callback');

  return hasTokens || hasTokenHash || hasAuthError || hasCode || isAppCallback;
}

const oauthUrlJobs = new Map<string, Promise<{ error: string | null; sessionSet: boolean }>>();

type SignUpOptions = {
  fullName: string;
  phoneNumber: string;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  profileImageUri: string | null;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    options: SignUpOptions
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signInWithGoogle: () => Promise<{ error: string | null; success: boolean }>;
  signOut: () => Promise<{ error: string | null }>;
  saveProfileImage: (uri: string) => Promise<void>;
  clearProfileImage: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function extractToken(url: string, key: string): string | null {
  const matches = url.match(new RegExp(`[?&#]${key}=([^&#]*)`));
  return matches ? decodeURIComponent(matches[1]) : null;
}

async function createSessionFromUrl(url: string): Promise<{ error: string | null; sessionSet: boolean }> {
  const existing = oauthUrlJobs.get(url);
  if (existing) {
    return existing;
  }

  const job = (async () => {
    try {
      const urlToParse = url.replace('#', '?');
      const { params, errorCode } = QueryParams.getQueryParams(urlToParse);

      if (errorCode) {
        return { error: errorCode, sessionSet: false };
      }

      const errorDescription = params.error_description || extractToken(url, 'error_description');
      const errorMsg = params.error || extractToken(url, 'error');
      if (errorDescription || errorMsg) {
        return { error: errorDescription || errorMsg, sessionSet: false };
      }

      // 1. Tokens directos (flujo implicit / enlaces OAuth o hash)
      const accessToken = params.access_token || extractToken(url, 'access_token');
      const refreshToken = params.refresh_token || extractToken(url, 'refresh_token');

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        return { error: error?.message ?? null, sessionSet: !error };
      }

      // 2. Token hash para confirmación de email / magic link
      const tokenHash = params.token_hash || extractToken(url, 'token_hash');
      const type = (params.type || extractToken(url, 'type')) as any;

      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type,
        });

        return { error: error?.message ?? null, sessionSet: !error };
      }

      // 3. Código de intercambio (si viene con flow code)
      const code = params.code || extractToken(url, 'code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        return { error: error?.message ?? null, sessionSet: !error };
      }

      return { error: null, sessionSet: false };
    } catch (err: any) {
      return { error: err?.message || 'Error al procesar enlace de autenticación', sessionSet: false };
    }
  })();

  oauthUrlJobs.set(url, job);

  try {
    const result = await job;
    if (!result.sessionSet) {
      oauthUrlJobs.delete(url);
    }
    return result;
  } catch (error) {
    oauthUrlJobs.delete(url);
    throw error;
  }
}

type Props = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const ignoreAuthEventsRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
      Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          setTimeout(() => reject(new Error('Auth init timeout')), ms);
        }),
      ]);

    const initializeAuth = async () => {
      try {
        const [{ data }, storedProfileImage] = await withTimeout(
          Promise.all([supabase.auth.getSession(), getStoredProfileImage()]),
          8000
        );

        if (!isMounted) {
          return;
        }

        setSession(data.session);
        setUser(data.session?.user ?? null);
        setProfileImageUri(storedProfileImage);
      } catch {
        if (!isMounted) {
          return;
        }
        setSession(null);
        setUser(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void initializeAuth();

    const {
      data: { subscription },
    } =       supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (ignoreAuthEventsRef.current) {
        return;
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user?.email) {
        void setStoredEmail(nextSession.user.email);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handledUrls = new Set<string>();

    const handleUrl = async (url: string | null) => {
      if (!url || !isOAuthCallbackUrl(url) || handledUrls.has(url)) {
        return;
      }

      handledUrls.add(url);
      const { error } = await createSessionFromUrl(url);

      if (error) {
        handledUrls.delete(url);
      }
    };

    void Linking.getInitialURL().then((url) => {
      void handleUrl(url);
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user?.email) {
      await setStoredEmail(data.user.email);
    }

    setProfileImageUri(null);
    await setStoredProfileImage('');

    return { error: null };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, options: SignUpOptions) => {
      ignoreAuthEventsRef.current = true;

      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              full_name: options.fullName.trim(),
              phone_number: options.phoneNumber.trim(),
            },
          },
        });

        if (error) {
          return { error: error.message, needsEmailConfirmation: false };
        }

        if (data.session) {
          await supabase.auth.signOut();
        }

        setSession(null);
        setUser(null);

        return {
          error: null,
          needsEmailConfirmation: !data.session,
        };
      } finally {
        ignoreAuthEventsRef.current = false;
      }
    },
    []
  );

  const signInWithGoogle = useCallback(async () => {
    try {
      const redirectTo = getOAuthRedirectUri();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        return { error: error.message, success: false };
      }

      if (!data?.url) {
        return { error: 'No se pudo iniciar la sesión con Google.', success: false };
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success' && result.url) {
        const { error: sessionError, sessionSet } = await createSessionFromUrl(result.url);

        if (sessionError) {
          return { error: sessionError, success: false };
        }

        if (!sessionSet) {
          return { error: 'No se pudieron recuperar los tokens de inicio de sesión.', success: false };
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const { data: sessionData } = await supabase.auth.getSession();

        if (!sessionData.session) {
          return { error: null, success: false };
        }
      }

      const { data: sessionData } = await supabase.auth.getSession();

      if (sessionData.session?.user.email) {
        await setStoredEmail(sessionData.session.user.email);
      }

      setProfileImageUri(null);
      await setStoredProfileImage('');

      return { error: null, success: true };
    } catch {
      return { error: 'Ocurrió un error inesperado al conectar con Google.', success: false };
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error: error.message };
    }

    setProfileImageUri(null);
    await Promise.all([setStoredEmail(''), setStoredProfileImage('')]);
    store.dispatch(resetFinanceState());

    return { error: null };
  }, []);

  const saveProfileImage = useCallback(async (uri: string) => {
    setProfileImageUri(uri);
    await setStoredProfileImage(uri);
  }, []);

  const clearProfileImage = useCallback(async () => {
    setProfileImageUri(null);
    await setStoredProfileImage('');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isLoading,
      isAuthenticated: Boolean(session),
      profileImageUri,
      signInWithPassword,
      signUp,
      signInWithGoogle,
      signOut,
      saveProfileImage,
      clearProfileImage,
    }),
    [
      user,
      session,
      isLoading,
      profileImageUri,
      signInWithPassword,
      signUp,
      signInWithGoogle,
      signOut,
      saveProfileImage,
      clearProfileImage,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}

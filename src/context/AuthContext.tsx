import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
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
  const matches = url.match(new RegExp(`${key}=([^&]*)`));
  return matches ? matches[1] : null;
}

type Props = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
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

      return {
        error: null,
        needsEmailConfirmation: !data.session,
      };
    },
    []
  );

  const signInWithGoogle = useCallback(async () => {
    try {

      const redirectTo = makeRedirectUri({
        scheme: 'controldegastos',
        preferLocalhost: false,
      });

      console.log('REDIRECT_URL_EXPO:', redirectTo)

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

      if (result.type !== 'success' || !result.url) {
        return { error: null, success: false };
      }

      const urlToParse = result.url.replace('#', '?');
      const { params, errorCode } = QueryParams.getQueryParams(urlToParse);

      const accessToken = params.access_token || extractToken(result.url, 'access_token');
      const refreshToken = params.refresh_token || extractToken(result.url, 'refresh_token');

      if (errorCode || !accessToken || !refreshToken) {
        return { error: 'No se pudieron recuperar los tokens de inicio de sesión.', success: false };
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        return { error: sessionError.message, success: false };
      }

      if (sessionData.session) {
        setSession(sessionData.session);
        setUser(sessionData.session.user);

        if (sessionData.session.user.email) {
          await setStoredEmail(sessionData.session.user.email);
        }
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

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

import { supabase } from '../services/supabaseClient';
import { store } from '../store';
import { resetFinanceState } from '../store/slices/financeSlice';
import {
  getStoredProfileImage,
  setStoredEmail,
  setStoredProfileImage,
} from '../services/storage';

WebBrowser.maybeCompleteAuthSession();

const OAUTH_REDIRECT_URL = 'controldegastos://auth/v1/callback';

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

    const initializeAuth = async () => {
      try {
        const [{ data }, storedProfileImage] = await Promise.all([
          supabase.auth.getSession(),
          getStoredProfileImage(),
        ]);

        if (!isMounted) {
          return;
        }

        setSession(data.session);
        setUser(data.session?.user ?? null);
        setProfileImageUri(storedProfileImage);
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
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: OAUTH_REDIRECT_URL,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        return { error: error.message, success: false };
      }

      if (!data?.url) {
        return { error: 'No se pudo iniciar la sesión con Google.', success: false };
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, OAUTH_REDIRECT_URL);

      if (result.type !== 'success' || !result.url) {
        return { error: null, success: false };
      }

      const accessToken = extractToken(result.url, 'access_token');
      const refreshToken = extractToken(result.url, 'refresh_token');

      if (!accessToken || !refreshToken) {
        return { error: 'No se pudieron recuperar los tokens de inicio de sesión.', success: false };
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        return { error: sessionError.message, success: false };
      }

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (currentUser?.email) {
        await setStoredEmail(currentUser.email);
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

import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useTelegram } from '@/hooks/useTelegram';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authError: string | null;
  retryAuth: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,
  authError: null,
  retryAuth: () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const hasAttemptedTelegramLogin = useRef(false);
  const { initData, isReady, isTelegram, hapticFeedback } = useTelegram();
  const queryClient = useQueryClient();

  // Setup auth state listener first
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        
        if (event === 'SIGNED_IN') {
          queryClient.invalidateQueries();
          setAuthError(null);
        } else if (event === 'SIGNED_OUT') {
          queryClient.clear();
        }
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.id || 'none');
      setSession(session);
      if (session) {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const attemptTelegramLogin = useCallback(async () => {
    // Wait for Telegram to be ready
    if (!isReady) {
      console.log('Telegram not ready yet');
      return;
    }
    
    // If already have session, we're done
    if (session) {
      console.log('Already have session');
      setIsLoading(false);
      return;
    }
    
    // Skip if not in Telegram or no initData
    if (!initData || !initData.trim()) {
      console.log('No initData, not in Telegram WebApp');
      setIsLoading(false);
      return;
    }

    console.log('Attempting Telegram auto-login with initData length:', initData.length);
    setAuthError(null);

    // Add timeout to prevent infinite loading
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-auth`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ initData }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      const result = await response.json();
      console.log('Telegram auth response:', response.status, result);

      if (!response.ok) {
        console.error('Telegram auth failed:', result.error);
        setAuthError(result.error || 'Authentication failed');
        setIsLoading(false);
        return;
      }

      // If we got a session token, sign in
      if (result.access_token && result.refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: result.access_token,
          refresh_token: result.refresh_token,
        });
        
        if (error) {
          console.error('Failed to set session:', error);
          setAuthError('Session error. Please restart the app.');
        } else {
          hapticFeedback('success');
        }
      } else {
        setAuthError('Invalid auth response');
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error('Telegram auth timeout');
        setAuthError('Connection timeout. Check your internet.');
      } else {
        console.error('Telegram auth error:', error);
        setAuthError('Connection error. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isReady, initData, session, hapticFeedback]);

  // Auto-login with Telegram when in Telegram WebApp
  useEffect(() => {
    if (hasAttemptedTelegramLogin.current) return;
    
    if (isReady && !session) {
      hasAttemptedTelegramLogin.current = true;
      attemptTelegramLogin();
    }
  }, [isReady, session, attemptTelegramLogin]);

  const retryAuth = useCallback(() => {
    hasAttemptedTelegramLogin.current = false;
    setAuthError(null);
    setIsLoading(true);
    attemptTelegramLogin();
  }, [attemptTelegramLogin]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    hasAttemptedTelegramLogin.current = false;
    queryClient.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isLoading,
        isAuthenticated: !!session?.user,
        authError,
        retryAuth,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
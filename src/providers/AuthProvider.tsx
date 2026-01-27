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

// Maximum number of retry attempts
const MAX_RETRY_ATTEMPTS = 3;
// Timeout for auth request (30 seconds)
const AUTH_TIMEOUT = 30000;

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const retryCount = useRef(0);
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

    // If we have a session but it's expired, try to refresh it
    if (session && session.expires_at && session.expires_at * 1000 < Date.now()) {
      console.log('Session expired, attempting refresh...');
      const { error } = await supabase.auth.refreshSession();
      if (!error) {
        console.log('Session refreshed successfully');
        setIsLoading(false);
        return;
      }
      console.error('Failed to refresh session:', error);
      // Fall through to attempt Telegram login
    }
    
    // Skip if not in Telegram or no initData
    if (!initData || !initData.trim()) {
      console.log('No initData, not in Telegram WebApp. Setting loading to false.');
      setIsLoading(false);
      return;
    }

    console.log('Attempting Telegram auto-login with initData length:', initData.length);
    setAuthError(null);

    // Get the Supabase function URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('VITE_SUPABASE_URL is not configured');
      setAuthError('Server configuration error. Please contact support.');
      setIsLoading(false);
      return;
    }

    const functionUrl = `${supabaseUrl}/functions/v1/telegram-auth`;
    console.log('Calling Telegram auth function:', functionUrl);

    // Add timeout to prevent infinite loading
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AUTH_TIMEOUT);

    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ initData }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('Failed to parse auth response:', parseError);
        throw new Error('Invalid response from server');
      }
      
      console.log('Telegram auth response:', response.status, result);

      if (!response.ok) {
        console.error('Telegram auth failed:', result.error);
        
        // Handle specific error cases
        if (response.status === 401) {
          setAuthError('Telegram authentication failed. Please try again.');
        } else if (response.status === 500) {
          setAuthError('Server error. Please try again later.');
        } else {
          setAuthError(result.error || 'Authentication failed');
        }
        
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
          console.log('Session set successfully');
          hapticFeedback('success');
          retryCount.current = 0; // Reset retry count on success
        }
      } else {
        setAuthError('Invalid auth response from server');
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error('Telegram auth timeout');
        
        // Retry logic for timeout
        if (retryCount.current < MAX_RETRY_ATTEMPTS) {
          retryCount.current++;
          console.log(`Retrying auth attempt ${retryCount.current}/${MAX_RETRY_ATTEMPTS}...`);
          setTimeout(() => attemptTelegramLogin(), 2000 * retryCount.current);
          return;
        }
        
        setAuthError('Connection timeout. Please check your internet and try again.');
      } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
        console.error('Network error:', error);
        
        // Retry logic for network errors
        if (retryCount.current < MAX_RETRY_ATTEMPTS) {
          retryCount.current++;
          console.log(`Retrying auth attempt ${retryCount.current}/${MAX_RETRY_ATTEMPTS}...`);
          setTimeout(() => attemptTelegramLogin(), 2000 * retryCount.current);
          return;
        }
        
        setAuthError('Network error. Please check your internet connection.');
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
    retryCount.current = 0;
    setAuthError(null);
    setIsLoading(true);
    attemptTelegramLogin();
  }, [attemptTelegramLogin]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    hasAttemptedTelegramLogin.current = false;
    retryCount.current = 0;
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

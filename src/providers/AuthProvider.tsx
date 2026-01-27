import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useTelegram } from '@/hooks/useTelegram';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
  const isAuthInProgress = useRef(false);
  const { initData, isReady, isTelegram, hapticFeedback } = useTelegram();
  const queryClient = useQueryClient();

  // Handle Auth State Changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth state changed:', event, currentSession?.user?.id);
        setSession(currentSession);
        
        if (event === 'SIGNED_IN') {
          queryClient.invalidateQueries();
          setAuthError(null);
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          queryClient.clear();
          setIsLoading(false);
        }
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession) {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const attemptTelegramLogin = useCallback(async () => {
    // Prevent multiple concurrent attempts or attempts if already logged in
    if (!isReady || session || isAuthInProgress.current) return;
    
    // Official Flow: Must have initData
    if (!initData || !initData.trim()) {
      console.log('No Telegram data available. Auto-login skipped.');
      setIsLoading(false);
      return;
    }

    console.log('Official Flow: Starting Telegram auto-login...');
    isAuthInProgress.current = true;
    setAuthError(null);
    setIsLoading(true);

    try {
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-auth`;
      console.log('Calling edge function:', functionUrl);
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ initData }),
      });

      const result = await response.json();
      console.log('Edge function response:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        throw new Error(result.error || `Authentication failed (${response.status})`);
      }

      // If we got session tokens back
      if (result.access_token && result.refresh_token) {
        console.log('Setting session from tokens...');
        const { error } = await supabase.auth.setSession({
          access_token: result.access_token,
          refresh_token: result.refresh_token,
        });
        
        if (error) throw error;
        
        hapticFeedback('success');
        toast.success('Successfully logged in via Telegram!');
      } else if (result.session?.access_token && result.session?.refresh_token) {
        console.log('Setting session from session object...');
        const { error } = await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        });
        if (error) throw error;
        hapticFeedback('success');
      } else {
        console.error('Invalid response structure:', Object.keys(result));
        throw new Error('Invalid authentication response from server');
      }
    } catch (error: any) {
      console.error('Telegram auth error:', error.message);
      setAuthError(error.message);
      // Only show toast if it's not an abort/cancellation
      if (error.message !== 'Authentication failed') {
        toast.error(`Auth Error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
      isAuthInProgress.current = false;
    }
  }, [isReady, initData, session, hapticFeedback]);

  // Auto-trigger login when Telegram is ready
  useEffect(() => {
    // Only attempt if we are in Telegram, ready, and NOT already logged in
    if (isReady && isTelegram && !session && !isAuthInProgress.current) {
      attemptTelegramLogin();
    } else if (isReady && !isTelegram && !session) {
      setIsLoading(false);
    }
  }, [isReady, isTelegram, session, attemptTelegramLogin]);

  // Safety timeout - if loading for more than 10 seconds, stop loading
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        if (isLoading && !session) {
          console.log('Auth loading timeout - forcing loading to false');
          setIsLoading(false);
          if (!authError) {
            setAuthError('Authentication timed out. Please try again.');
          }
        }
      }, 10000);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, session, authError]);

  const retryAuth = useCallback(() => {
    isAuthInProgress.current = false;
    attemptTelegramLogin();
  }, [attemptTelegramLogin]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    isAuthInProgress.current = false;
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

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

// Global auth state
let globalAuthAttempted = false;
let globalSession: Session | null = null;

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(globalSession);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [initComplete, setInitComplete] = useState(false);

  const isAuthInProgress = useRef(false);
  const { initData, isReady, isTelegram } = useTelegram();
  const queryClient = useQueryClient();

  // Handle Auth State Changes
  useEffect(() => {
    console.log('[AuthProvider] Setting up auth listener');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('[AuthProvider] Auth event:', event);
        
        globalSession = currentSession;
        setSession(currentSession);

        if (event === 'SIGNED_IN') {
          queryClient.invalidateQueries();
          setAuthError(null);
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          globalSession = null;
          globalAuthAttempted = false;
          queryClient.clear();
          setIsLoading(false);
        } else if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          setIsLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log('[AuthProvider] Initial session:', currentSession?.user?.id?.slice(0, 8) || 'none');
      globalSession = currentSession;
      setSession(currentSession);
      setInitComplete(true);
      if (currentSession) {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const attemptTelegramLogin = useCallback(async () => {
    if (!isReady || session || isAuthInProgress.current || globalAuthAttempted) {
      console.log('[AuthProvider] Skipping auth attempt');
      return;
    }

    if (!isTelegram) {
      console.log('[AuthProvider] Not in Telegram');
      return;
    }

    if (!initData || initData.length < 10) {
      console.log('[AuthProvider] No initData');
      setAuthError('Please open this app from the Telegram bot.');
      globalAuthAttempted = true;
      return;
    }

    console.log('[AuthProvider] Starting Telegram login...');
    isAuthInProgress.current = true;
    globalAuthAttempted = true;
    setAuthError(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl || !publishableKey) {
        throw new Error('Missing Supabase environment variables');
      }

      const functionUrl = `${supabaseUrl}/functions/v1/telegram-auth`;
      console.log('[AuthProvider] Calling edge function');

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publishableKey}`,
        },
        body: JSON.stringify({ initData }),
      });

      console.log('[AuthProvider] Response:', response.status);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Auth failed (${response.status})`);
      }

      const accessToken = result.access_token || result.session?.access_token;
      const refreshToken = result.refresh_token || result.session?.refresh_token;

      if (accessToken && refreshToken) {
        console.log('[AuthProvider] Setting session...');
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) throw error;
        toast.success('Logged in!');
      } else {
        throw new Error('Invalid response: missing tokens');
      }
    } catch (error: any) {
      console.error('[AuthProvider] Auth error:', error.message);
      setAuthError(error.message);
      toast.error(`Auth Error: ${error.message}`);
    } finally {
      isAuthInProgress.current = false;
    }
  }, [isReady, initData, session, isTelegram]);

  // Main effect to handle loading state
  useEffect(() => {
    console.log('[AuthProvider] Main effect:', { 
      isReady, 
      isTelegram, 
      hasSession: !!session, 
      attempted: globalAuthAttempted,
      initComplete 
    });

    // If not ready yet, keep loading
    if (!isReady) {
      console.log('[AuthProvider] Waiting for Telegram...');
      return;
    }

    // If we have a session, we're done
    if (session) {
      console.log('[AuthProvider] Have session, done');
      setIsLoading(false);
      return;
    }

    // If not in Telegram and init complete, show Telegram prompt
    if (!isTelegram && initComplete) {
      console.log('[AuthProvider] Not in Telegram, showing prompt');
      setIsLoading(false);
      return;
    }

    // In Telegram but no initData
    if (isTelegram && (!initData || initData.length < 10)) {
      console.log('[AuthProvider] In Telegram but no initData');
      setAuthError('Please open this app from the Telegram bot menu button.');
      setIsLoading(false);
      return;
    }

    // In Telegram with initData - try auth
    if (isTelegram && initData && !globalAuthAttempted) {
      console.log('[AuthProvider] Attempting Telegram auth...');
      attemptTelegramLogin();
      return;
    }

    // Already attempted auth
    if (globalAuthAttempted) {
      console.log('[AuthProvider] Auth already attempted');
      if (!session && !authError) {
        setAuthError('Authentication failed. Please try again.');
      }
      setIsLoading(false);
      return;
    }

    // Default: stop loading
    console.log('[AuthProvider] Default case - stopping loading');
    setIsLoading(false);

  }, [isReady, isTelegram, session, authError, initComplete, initData, attemptTelegramLogin]);

  // Safety timeout - force stop loading after 8 seconds
  useEffect(() => {
    if (!isLoading) return;
    
    const timeout = setTimeout(() => {
      console.log('[AuthProvider] Safety timeout - forcing loading false');
      setIsLoading(false);
      if (!authError && !session) {
        setAuthError('Loading timed out. Please refresh and try again.');
      }
    }, 8000);
    
    return () => clearTimeout(timeout);
  }, [isLoading, session, authError]);

  const retryAuth = useCallback(() => {
    console.log('[AuthProvider] Retrying...');
    isAuthInProgress.current = false;
    globalAuthAttempted = false;
    setAuthError(null);
    setIsLoading(true);
    attemptTelegramLogin();
  }, [attemptTelegramLogin]);

  const signOut = async () => {
    await supabase.auth.signOut();
    globalSession = null;
    globalAuthAttempted = false;
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

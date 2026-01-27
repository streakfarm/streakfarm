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

// Use sessionStorage to persist auth attempted state across React re-renders
// but reset on page refresh (new session)
const getAuthAttempted = () => {
  try {
    return sessionStorage.getItem('streakfarm_auth_attempted') === 'true';
  } catch {
    return false;
  }
};

const setAuthAttempted = (value: boolean) => {
  try {
    sessionStorage.setItem('streakfarm_auth_attempted', value ? 'true' : 'false');
  } catch {
    // Ignore
  }
};

const clearAuthAttempted = () => {
  try {
    sessionStorage.removeItem('streakfarm_auth_attempted');
  } catch {
    // Ignore
  }
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
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
        console.log('[AuthProvider] Auth event:', event, 'hasSession:', !!currentSession);
        
        setSession(currentSession);

        if (event === 'SIGNED_IN') {
          queryClient.invalidateQueries();
          setAuthError(null);
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          clearAuthAttempted();
          queryClient.clear();
          setIsLoading(false);
        } else if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          setIsLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log('[AuthProvider] Initial session check:', currentSession?.user?.id?.slice(0, 8) || 'none');
      setSession(currentSession);
      setInitComplete(true);
      if (currentSession) {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const attemptTelegramLogin = useCallback(async () => {
    // Check all conditions before attempting
    if (!isReady) {
      console.log('[AuthProvider] Not ready yet, skipping auth');
      return;
    }

    if (session) {
      console.log('[AuthProvider] Already have session, skipping auth');
      return;
    }

    if (isAuthInProgress.current) {
      console.log('[AuthProvider] Auth already in progress, skipping');
      return;
    }

    if (getAuthAttempted()) {
      console.log('[AuthProvider] Auth already attempted this session, skipping');
      return;
    }

    if (!isTelegram) {
      console.log('[AuthProvider] Not in Telegram, skipping');
      return;
    }

    if (!initData || initData.length < 10) {
      console.log('[AuthProvider] No initData available');
      setAuthError('Please open this app from the Telegram bot menu button.');
      setAuthAttempted(true);
      setIsLoading(false);
      return;
    }

    console.log('[AuthProvider] Starting Telegram login...');
    isAuthInProgress.current = true;
    setAuthAttempted(true);
    setAuthError(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl || !publishableKey) {
        throw new Error('Missing Supabase environment variables');
      }

      const functionUrl = `${supabaseUrl}/functions/v1/telegram-auth`;
      console.log('[AuthProvider] Calling edge function:', functionUrl);

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publishableKey}`,
        },
        body: JSON.stringify({ initData }),
      });

      console.log('[AuthProvider] Response status:', response.status);
      
      const result = await response.json();
      console.log('[AuthProvider] Response result:', { 
        hasError: !!result.error, 
        hasSession: !!result.session,
        hasAccessToken: !!result.session?.access_token 
      });

      if (!response.ok) {
        throw new Error(result.error || `Auth failed (${response.status})`);
      }

      const accessToken = result.session?.access_token;
      const refreshToken = result.session?.refresh_token;

      if (accessToken && refreshToken) {
        console.log('[AuthProvider] Setting session with tokens...');
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('[AuthProvider] setSession error:', error);
          throw error;
        }
        
        console.log('[AuthProvider] Session set successfully');
        toast.success('Welcome to StreakFarm!');
      } else {
        throw new Error('Invalid response: missing tokens');
      }
    } catch (error: any) {
      console.error('[AuthProvider] Auth error:', error.message);
      setAuthError(error.message);
      toast.error(`Login failed: ${error.message}`);
      setIsLoading(false);
    } finally {
      isAuthInProgress.current = false;
    }
  }, [isReady, initData, session, isTelegram]);

  // Main effect to handle auth flow
  useEffect(() => {
    console.log('[AuthProvider] Main effect:', { 
      isReady, 
      isTelegram, 
      hasSession: !!session, 
      authAttempted: getAuthAttempted(),
      initComplete,
      initDataLength: initData?.length || 0
    });

    // If not ready yet, keep loading
    if (!isReady) {
      console.log('[AuthProvider] Waiting for Telegram initialization...');
      return;
    }

    // If we have a session, we're done
    if (session) {
      console.log('[AuthProvider] Session exists, loading complete');
      setIsLoading(false);
      return;
    }

    // If not in Telegram and init complete, show Telegram prompt
    if (!isTelegram && initComplete) {
      console.log('[AuthProvider] Not in Telegram environment');
      setIsLoading(false);
      return;
    }

    // In Telegram with initData - try auth
    if (isTelegram && initData && initData.length >= 10 && !getAuthAttempted() && !isAuthInProgress.current) {
      console.log('[AuthProvider] Conditions met, attempting Telegram auth...');
      attemptTelegramLogin();
      return;
    }

    // In Telegram but no initData
    if (isTelegram && (!initData || initData.length < 10) && initComplete) {
      console.log('[AuthProvider] In Telegram but no initData');
      setAuthError('Unable to get Telegram authentication data. Please reopen from the bot menu button.');
      setIsLoading(false);
      return;
    }

    // Already attempted auth and failed
    if (getAuthAttempted() && !session && !authError) {
      console.log('[AuthProvider] Auth was attempted but no session');
      setAuthError('Authentication failed. Please try again.');
      setIsLoading(false);
      return;
    }

    // Default: if init complete, stop loading
    if (initComplete) {
      console.log('[AuthProvider] Init complete, stopping loading');
      setIsLoading(false);
    }

  }, [isReady, isTelegram, session, authError, initComplete, initData, attemptTelegramLogin]);

  // Safety timeout - force stop loading after 10 seconds
  useEffect(() => {
    if (!isLoading) return;
    
    const timeout = setTimeout(() => {
      console.log('[AuthProvider] Safety timeout - forcing loading false');
      setIsLoading(false);
      if (!authError && !session) {
        setAuthError('Loading timed out. Please refresh and try again.');
      }
    }, 10000);
    
    return () => clearTimeout(timeout);
  }, [isLoading, session, authError]);

  const retryAuth = useCallback(() => {
    console.log('[AuthProvider] Retrying auth...');
    isAuthInProgress.current = false;
    clearAuthAttempted();
    setAuthError(null);
    setIsLoading(true);
    // Small delay to let state update
    setTimeout(() => {
      attemptTelegramLogin();
    }, 100);
  }, [attemptTelegramLogin]);

  const signOut = async () => {
    await supabase.auth.signOut();
    clearAuthAttempted();
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

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

// Safe localStorage access
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  },
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authAttempted, setAuthAttempted] = useState(false);

  const isAuthInProgress = useRef(false);
  const { initData, isReady, isTelegram, hapticFeedback } = useTelegram();
  const queryClient = useQueryClient();

  // Handle Auth State Changes
  useEffect(() => {
    console.log('[AuthProvider] Setting up auth state listener');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('[AuthProvider] Auth state changed:', event, currentSession?.user?.id);
        setSession(currentSession);

        if (event === 'SIGNED_IN') {
          queryClient.invalidateQueries();
          setAuthError(null);
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          queryClient.clear();
          setIsLoading(false);
        } else if (event === 'TOKEN_REFRESHED') {
          // Token refreshed, session is still valid
          setIsLoading(false);
        }
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log('[AuthProvider] Initial session check:', currentSession?.user?.id || 'No session');
      setSession(currentSession);
      if (currentSession) {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const attemptTelegramLogin = useCallback(async () => {
    // Prevent multiple concurrent attempts or attempts if already logged in
    if (!isReady) {
      console.log('[AuthProvider] Skipping auth: Telegram not ready');
      return;
    }

    if (session) {
      console.log('[AuthProvider] Skipping auth: Already have session');
      return;
    }

    if (isAuthInProgress.current) {
      console.log('[AuthProvider] Skipping auth: Auth already in progress');
      return;
    }

    // If not in Telegram and no session, don't try Telegram auth
    if (!isTelegram) {
      console.log('[AuthProvider] Not in Telegram, skipping Telegram auth');
      setIsLoading(false);
      return;
    }

    // Official Flow: Must have initData for Telegram auth
    if (!initData || !initData.trim()) {
      console.log('[AuthProvider] No Telegram initData available. Cannot auto-login.');
      setAuthError('No Telegram authentication data available. Please open this app from the Telegram bot.');
      setIsLoading(false);
      setAuthAttempted(true);
      return;
    }

    console.log('[AuthProvider] Official Flow: Starting Telegram auto-login...');
    console.log('[AuthProvider] initData length:', initData.length);
    console.log('[AuthProvider] initData preview:', initData.substring(0, 100));

    isAuthInProgress.current = true;
    setAuthError(null);
    setIsLoading(true);
    setAuthAttempted(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      console.log('[AuthProvider] Environment check:', {
        hasSupabaseUrl: !!supabaseUrl,
        hasPublishableKey: !!publishableKey,
      });

      if (!supabaseUrl || !publishableKey) {
        throw new Error('Missing Supabase environment variables. Please check your .env file.');
      }

      const functionUrl = `${supabaseUrl}/functions/v1/telegram-auth`;
      console.log('[AuthProvider] Calling edge function:', functionUrl);

      let response;
      try {
        response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publishableKey}`,
          },
          body: JSON.stringify({ initData }),
        });
      } catch (fetchError: any) {
        console.error('[AuthProvider] Fetch error:', fetchError);
        throw new Error(`Network error: ${fetchError.message}. Check if edge function is deployed and CORS is configured.`);
      }

      console.log('[AuthProvider] Response received:', { status: response.status, statusText: response.statusText });

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('[AuthProvider] Failed to parse response:', parseError);
        const text = await response.text();
        console.error('[AuthProvider] Raw response:', text);
        throw new Error(`Invalid response from server: ${text.substring(0, 200)}`);
      }

      console.log('[AuthProvider] Edge function response:', {
        status: response.status,
        ok: response.ok,
        resultKeys: Object.keys(result),
        hasError: !!result.error,
      });

      if (!response.ok) {
        throw new Error(result.error || `Authentication failed (${response.status})`);
      }

      // If we got session tokens back
      if (result.access_token && result.refresh_token) {
        console.log('[AuthProvider] Setting session from tokens...');
        const { error } = await supabase.auth.setSession({
          access_token: result.access_token,
          refresh_token: result.refresh_token,
        });

        if (error) throw error;

        hapticFeedback('success');
        toast.success('Successfully logged in via Telegram!');
      } else if (result.session?.access_token && result.session?.refresh_token) {
        console.log('[AuthProvider] Setting session from session object...');
        const { error } = await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        });
        if (error) throw error;
        hapticFeedback('success');
        toast.success('Successfully logged in via Telegram!');
      } else {
        console.error('[AuthProvider] Invalid response structure:', Object.keys(result));
        throw new Error('Invalid authentication response from server: missing session tokens');
      }
    } catch (error: any) {
      console.error('[AuthProvider] Telegram auth error:', error.message);
      setAuthError(error.message);
      setIsLoading(false);

      // Show toast for errors except abort/cancellation
      if (error.name !== 'AbortError') {
        toast.error(`Auth Error: ${error.message}`);
      }
    } finally {
      isAuthInProgress.current = false;
    }
  }, [isReady, initData, session, hapticFeedback, isTelegram]);

  // Auto-trigger login when Telegram is ready
  useEffect(() => {
    console.log('[AuthProvider] Auth effect triggered:', {
      isReady,
      isTelegram,
      hasSession: !!session,
      authAttempted,
      initDataLength: initData?.length || 0,
    });

    // Only attempt if we are in Telegram, ready, and NOT already logged in
    if (isReady && isTelegram && !session && !authAttempted) {
      console.log('[AuthProvider] Conditions met, attempting Telegram login');
      attemptTelegramLogin();
    } else if (isReady && !isTelegram && !session) {
      // Not in Telegram and no session - show the "Open in Telegram" prompt
      console.log('[AuthProvider] Not in Telegram, no session - showing Telegram prompt');
      setIsLoading(false);
    } else if (isReady && isTelegram && !session && authAttempted && authError) {
      // In Telegram but auth failed - stop loading to show error
      console.log('[AuthProvider] Auth failed, stopping loading');
      setIsLoading(false);
    } else if (isReady && session) {
      // Already have session
      console.log('[AuthProvider] Already authenticated');
      setIsLoading(false);
    }
  }, [isReady, isTelegram, session, authError, authAttempted, attemptTelegramLogin, initData]);

  // Safety timeout - if loading for more than 15 seconds, stop loading
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        if (isLoading && !session) {
          console.log('[AuthProvider] Auth loading timeout - forcing loading to false');
          setIsLoading(false);
          if (!authError) {
            setAuthError('Authentication timed out. Please try again.');
          }
        }
      }, 15000);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, session, authError]);

  const retryAuth = useCallback(() => {
    console.log('[AuthProvider] Retrying auth...');
    isAuthInProgress.current = false;
    setAuthAttempted(false);
    setAuthError(null);
    attemptTelegramLogin();
  }, [attemptTelegramLogin]);

  const signOut = async () => {
    console.log('[AuthProvider] Signing out...');
    await supabase.auth.signOut();
    setSession(null);
    isAuthInProgress.current = false;
    setAuthAttempted(false);
    queryClient.clear();
    safeStorage.removeItem('streakfarm_ref_code');
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

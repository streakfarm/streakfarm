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

// Global auth state to prevent double initialization
let globalAuthAttempted = false;
let globalSession: Session | null = null;

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(globalSession);
  const [isLoading, setIsLoading] = useState(!globalSession);
  const [authError, setAuthError] = useState<string | null>(null);

  const isAuthInProgress = useRef(false);
  const { initData, isReady, isTelegram } = useTelegram();
  const queryClient = useQueryClient();

  // Handle Auth State Changes
  useEffect(() => {
    console.log('[AuthProvider] Setting up auth listener');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('[AuthProvider] Auth event:', event, 'User:', currentSession?.user?.id?.slice(0, 8));
        
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
        } else if (event === 'TOKEN_REFRESHED') {
          setIsLoading(false);
        } else if (event === 'INITIAL_SESSION') {
          // Initial session check complete
          setIsLoading(false);
        }
      }
    );

    // Check for existing session immediately
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log('[AuthProvider] Initial session:', currentSession?.user?.id?.slice(0, 8) || 'none');
      if (currentSession) {
        globalSession = currentSession;
        setSession(currentSession);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const attemptTelegramLogin = useCallback(async () => {
    // Prevent multiple attempts
    if (!isReady || session || isAuthInProgress.current || globalAuthAttempted) {
      console.log('[AuthProvider] Skipping auth:', { isReady, hasSession: !!session, inProgress: isAuthInProgress.current, globalAttempted: globalAuthAttempted });
      return;
    }

    // Skip if not in Telegram
    if (!isTelegram) {
      console.log('[AuthProvider] Not in Telegram, skipping');
      setIsLoading(false);
      return;
    }

    // Must have initData
    if (!initData || initData.length < 10) {
      console.log('[AuthProvider] No initData available');
      setAuthError('Please open this app from the Telegram bot.');
      setIsLoading(false);
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
      console.log('[AuthProvider] Calling:', functionUrl);

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

      // Set session
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
      setIsLoading(false);
      toast.error(`Auth Error: ${error.message}`);
    } finally {
      isAuthInProgress.current = false;
    }
  }, [isReady, initData, session, isTelegram]);

  // Auto-trigger login
  useEffect(() => {
    console.log('[AuthProvider] Effect:', { isReady, isTelegram, hasSession: !!session, attempted: globalAuthAttempted });

    if (isReady && isTelegram && !session && !globalAuthAttempted) {
      attemptTelegramLogin();
    } else if (isReady && !session && globalAuthAttempted && !authError) {
      // Already attempted, no session, no error - show Telegram prompt
      setIsLoading(false);
    } else if (isReady && session) {
      // Have session
      setIsLoading(false);
    } else if (isReady && !isTelegram && !session) {
      // Not in Telegram
      setIsLoading(false);
    }
  }, [isReady, isTelegram, session, authError, attemptTelegramLogin]);

  // Safety timeout
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        if (isLoading && !session) {
          console.log('[AuthProvider] Timeout - forcing loading false');
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

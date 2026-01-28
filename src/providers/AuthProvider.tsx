import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useTelegram } from '@/hooks/useTelegram';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authError: string | null;
  retryAuth: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  isAuthenticated: false,
  authError: null,
  retryAuth: () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// Track auth attempt in sessionStorage (resets on page refresh)
const wasAuthAttempted = () => {
  try {
    return sessionStorage.getItem('sf_auth_attempted') === 'true';
  } catch {
    return false;
  }
};

const markAuthAttempted = () => {
  try {
    sessionStorage.setItem('sf_auth_attempted', 'true');
  } catch {}
};

const clearAuthAttempted = () => {
  try {
    sessionStorage.removeItem('sf_auth_attempted');
  } catch {}
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  
  const { initData, isReady, isTelegram } = useTelegram();
  const queryClient = useQueryClient();
  const authInProgress = useRef(false);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('[Auth] Event:', event, 'Session:', !!currentSession);
        
        if (currentSession) {
          setSession(currentSession);
          setIsLoading(false);
          setAuthError(null);
        } else {
          setSession(null);
          if (event === 'SIGNED_OUT') {
            clearAuthAttempted();
            setIsLoading(false);
          }
        }
      }
    );

    // Check existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      console.log('[Auth] Existing session check:', !!existingSession);
      if (existingSession) {
        setSession(existingSession);
        setIsLoading(false);
      }
      setHasCheckedSession(true);
    }).catch(err => {
      console.error('[Auth] Session check error:', err);
      setHasCheckedSession(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Attempt Telegram login
  const attemptTelegramLogin = useCallback(async () => {
    // Multiple guards to prevent concurrent or redundant attempts
    if (authInProgress.current) return;
    if (wasAuthAttempted()) return;
    if (!isReady || !isTelegram || !initData) return;
    if (session) return;

    authInProgress.current = true;
    markAuthAttempted();
    setAuthError(null);
    setIsLoading(true);

    try {
      console.log('[Auth] Attempting Telegram login...');
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl || !publishableKey) {
        throw new Error('Missing Supabase configuration');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/telegram-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publishableKey}`,
        },
        body: JSON.stringify({ initData }),
      });

      let result;
      const text = await response.text();
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error('[Auth] Failed to parse response:', text);
        throw new Error('Invalid server response');
      }

      console.log('[Auth] Response:', response.status, result.error || 'success');

      if (!response.ok) {
        throw new Error(result.error || `Auth failed: ${response.status}`);
      }

      const { access_token, refresh_token } = result.session || {};

      if (!access_token || !refresh_token) {
        throw new Error('Invalid response: no tokens');
      }

      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (error) throw error;
      
      toast.success('Welcome to StreakFarm!');
      
    } catch (err: any) {
      console.error('[Auth] Login error:', err.message);
      setAuthError(err.message);
      setIsLoading(false);
    } finally {
      authInProgress.current = false;
    }
  }, [isReady, isTelegram, initData, session]);

  // Handle auth flow
  useEffect(() => {
    // Only proceed once we've checked for an existing Supabase session
    if (!hasCheckedSession) return;
    
    // If already authenticated, we're done
    if (session) {
      setIsLoading(false);
      return;
    }
    
    // Wait for Telegram initialization
    if (!isReady) return;

    // Not in Telegram - stop loading and allow manual interaction if needed
    if (!isTelegram) {
      setIsLoading(false);
      return;
    }

    // In Telegram but no initData
    if (!initData) {
      setAuthError('Please open from bot menu button');
      setIsLoading(false);
      return;
    }

    // Try login if not already attempted
    if (!wasAuthAttempted() && !authInProgress.current) {
      attemptTelegramLogin();
    } else if (!authInProgress.current) {
      // Already attempted and failed, or in progress
      setIsLoading(false);
    }
  }, [hasCheckedSession, session, isReady, isTelegram, initData, attemptTelegramLogin]);

  // Safety timeout - stop loading after 15s to prevent permanent hang
  useEffect(() => {
    if (!isLoading) return;
    const timeout = setTimeout(() => {
      console.log('[Auth] Safety timeout reached');
      setIsLoading(false);
    }, 15000);
    return () => clearTimeout(timeout);
  }, [isLoading]);

  const retryAuth = useCallback(() => {
    clearAuthAttempted();
    setAuthError(null);
    setIsLoading(true);
    attemptTelegramLogin();
  }, [attemptTelegramLogin]);

  const signOut = async () => {
    await supabase.auth.signOut();
    clearAuthAttempted();
    setSession(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{
      session,
      isLoading,
      isAuthenticated: !!session?.user,
      authError,
      retryAuth,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

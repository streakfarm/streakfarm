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
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,
  authError: null,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const { initData, isReady, isTelegram, hapticFeedback } = useTelegram();
  const queryClient = useQueryClient();
  
  // Use a ref to ensure we only attempt login ONCE per session/mount
  const loginAttempted = useRef(false);

  // 1. Listen for Auth State Changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log('Auth event:', event);
      setSession(currentSession);
      if (currentSession) {
        setIsLoading(false);
      }
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession) {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. The Official Auto-Login Flow
  const performAutoLogin = useCallback(async () => {
    if (loginAttempted.current || session) return;
    
    if (!isTelegram || !initData) {
      console.log("Not in Telegram environment. Skipping auto-login.");
      setIsLoading(false);
      return;
    }

    loginAttempted.current = true;
    setIsLoading(true);
    console.log("Starting Official Telegram Auto-Login...");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-auth`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ initData }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Authentication failed');
      }

      if (result.session || (result.access_token && result.refresh_token)) {
        const sessionToSet = result.session || {
          access_token: result.access_token,
          refresh_token: result.refresh_token,
        };

        const { error } = await supabase.auth.setSession(sessionToSet);
        if (error) throw error;
        
        console.log("Auto-login successful!");
        hapticFeedback('success');
      } else {
        throw new Error("Invalid response from auth server");
      }
    } catch (err: any) {
      console.error("Auto-login failed:", err.message);
      setAuthError(err.message);
      toast.error("Login failed. Please reload the app.");
    } finally {
      setIsLoading(false);
    }
  }, [isTelegram, initData, session, isReady, hapticFeedback]);

  // Trigger login when Telegram is ready
  useEffect(() => {
    if (isReady) {
      if (isTelegram && !session) {
        performAutoLogin();
      } else {
        setIsLoading(false);
      }
    }
  }, [isReady, isTelegram, session, performAutoLogin]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isLoading,
        isAuthenticated: !!session,
        authError,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

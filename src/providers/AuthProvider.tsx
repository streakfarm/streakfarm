import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,
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
  const { user: telegramUser, initData, isReady, isTelegram, hapticFeedback } = useTelegram();
  const queryClient = useQueryClient();

  // Setup auth state listener first
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        
        if (event === 'SIGNED_IN') {
          queryClient.invalidateQueries();
        } else if (event === 'SIGNED_OUT') {
          queryClient.clear();
        }
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  // Auto-login with Telegram when in Telegram WebApp
  useEffect(() => {
    const autoLoginWithTelegram = async () => {
      // Only try Telegram auth if:
      // 1. Telegram is ready
      // 2. We have initData
      // 3. We don't already have a session
      // 4. We're done with initial loading
      if (!isReady || !initData || session || isLoading) return;
      
      // Skip if initData is empty (not in Telegram)
      if (!initData.trim()) {
        console.log('Not in Telegram WebApp, skipping auto-login');
        return;
      }

      console.log('Attempting Telegram auto-login...');
      setIsLoading(true);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-auth`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ initData }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          console.error('Telegram auth failed:', result.error);
          return;
        }

        console.log('Telegram auth successful:', result);

        // If we got a session token, sign in
        if (result.access_token && result.refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token: result.access_token,
            refresh_token: result.refresh_token,
          });
          
          if (error) {
            console.error('Failed to set session:', error);
          } else {
            // Silent success - just haptic feedback, no toast
            hapticFeedback('success');
          }
        }
      } catch (error) {
        console.error('Telegram auth error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    autoLoginWithTelegram();
  }, [isReady, initData, session, isLoading, hapticFeedback]);

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
        isAuthenticated: !!session?.user,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

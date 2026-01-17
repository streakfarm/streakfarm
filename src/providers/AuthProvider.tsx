import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useTelegram } from './TelegramProvider';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { user: telegramUser, isReady } = useTelegram();

  useEffect(() => {
    if (!isReady) return;

    // Auto sign-in with Telegram user
    const initAuth = async () => {
      try {
        if (telegramUser) {
          // Check if user exists in Supabase
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('telegram_id', telegramUser.id)
            .single();

          if (!existingUser) {
            // Create new user
            await supabase.from('users').insert({
              telegram_id: telegramUser.id,
              username: telegramUser.username || `user_${telegramUser.id}`,
              first_name: telegramUser.first_name,
              last_name: telegramUser.last_name,
            });
          }

          // Set authenticated user
          setUser({ id: telegramUser.id.toString() } as User);
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [telegramUser, isReady]);

  const signIn = async () => {
    // Telegram auto-authentication
    console.log('User already authenticated via Telegram');
  };

  const signOut = async () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

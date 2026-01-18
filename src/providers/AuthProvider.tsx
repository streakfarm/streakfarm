import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useTelegram } from './TelegramProvider';

interface AuthUser {
  id: string;
  telegram_id: number;
  username: string;
  first_name: string;
  last_name?: string;
  photo_url?: string;
  created_at?: string;
  streak_count?: number;
  total_points?: number;
  wallet_address?: string;
  referral_code?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { user: telegramUser, isReady, isTelegram } = useTelegram();

  const signIn = async () => {
    if (!telegramUser) {
      setLoading(false);
      return;
    }

    try {
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramUser.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Database error:', fetchError.message);
        setLoading(false);
        return;
      }

      if (existingUser) {
        const { data: updatedUser } = await supabase
          .from('users')
          .update({
            username: telegramUser.username || existingUser.username,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name,
            photo_url: telegramUser.photo_url,
            last_login: new Date().toISOString(),
          })
          .eq('telegram_id', telegramUser.id)
          .select()
          .single();

        setUser(updatedUser || existingUser);
      } else {
        const { data: newUser } = await supabase
          .from('users')
          .insert({
            telegram_id: telegramUser.id,
            username: telegramUser.username || `user_${telegramUser.id}`,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name,
            photo_url: telegramUser.photo_url,
            streak_count: 0,
            total_points: 0,
          })
          .select()
          .single();

        if (newUser) setUser(newUser);
      }

      setLoading(false);
    } catch (err) {
      console.error('Authentication error:', err);
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!telegramUser) return;

    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramUser.id)
      .single();

    if (data) setUser(data);
  };

  const signOut = async () => {
    setUser(null);
  };

  useEffect(() => {
    if (isReady && telegramUser && !user) {
      signIn();
    } else if (isReady && (!telegramUser || !isTelegram)) {
      setLoading(false);
    }
  }, [isReady, telegramUser]);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, refreshUser }}>
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

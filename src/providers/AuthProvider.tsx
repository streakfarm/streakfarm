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
      console.error('❌ No Telegram user found');
      setLoading(false);
      return;
    }

    try {
      console.log('🔐 Authenticating user:', telegramUser.id);

      // Check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramUser.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ Fetch error:', fetchError);
        throw fetchError;
      }

      if (existingUser) {
        // Update existing user
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            username: telegramUser.username || `user_${telegramUser.id}`,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name,
            photo_url: telegramUser.photo_url,
            last_login: new Date().toISOString(),
          })
          .eq('telegram_id', telegramUser.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Update error:', updateError);
          throw updateError;
        }

        console.log('✅ User updated:', updatedUser);
        setUser(updatedUser);
      } else {
        // Create new user
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            telegram_id: telegramUser.id,
            username: telegramUser.username || `user_${telegramUser.id}`,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name,
            photo_url: telegramUser.photo_url,
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Insert error:', insertError);
          throw insertError;
        }

        console.log('✅ New user created:', newUser);
        setUser(newUser);
      }

      setLoading(false);
    } catch (error) {
      console.error('❌ Auth error:', error);
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!telegramUser) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramUser.id)
        .single();

      if (error) throw error;
      setUser(data);
    } catch (error) {
      console.error('❌ Refresh error:', error);
    }
  };

  const signOut = async () => {
    setUser(null);
    console.log('🔓 User signed out');
  };

  // Auto sign-in when Telegram user is ready
  useEffect(() => {
    if (isReady && telegramUser && !user) {
      signIn();
    } else if (isReady && !telegramUser && !isTelegram) {
      // Not in Telegram - set loading to false
      setLoading(false);
      console.log('⚠️ Not in Telegram environment');
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

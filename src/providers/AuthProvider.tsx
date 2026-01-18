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
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signIn: async () => {},
  signOut: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: telegramUser, isReady, isTelegram } = useTelegram();

  const signIn = async () => {
    if (!telegramUser) {
      console.error('❌ No Telegram user found');
      setError('No Telegram user found');
      setLoading(false);
      return;
    }

    try {
      console.log('🔐 Starting authentication for:', telegramUser.id);
      setError(null);

      // Check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramUser.id)
        .maybeSingle();

      if (fetchError) {
        console.error('❌ Fetch error:', fetchError);
        setError(`Database error: ${fetchError.message}`);
        setLoading(false);
        return;
      }

      if (existingUser) {
        console.log('✅ Existing user found, updating...');
        
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
          setError(`Update error: ${updateError.message}`);
          setLoading(false);
          return;
        }

        console.log('✅ User updated successfully:', updatedUser);
        setUser(updatedUser);
      } else {
        console.log('✅ New user, creating...');
        
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
            streak_count: 0,
            total_points: 0,
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Insert error:', insertError);
          setError(`Create error: ${insertError.message}`);
          setLoading(false);
          return;
        }

        console.log('✅ New user created successfully:', newUser);
        setUser(newUser);
      }

      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Auth error:', errorMessage);
      setError(errorMessage);
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!telegramUser) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramUser.id)
        .single();

      if (fetchError) {
        console.error('❌ Refresh error:', fetchError);
        return;
      }
      
      setUser(data);
      console.log('✅ User refreshed');
    } catch (err) {
      console.error('❌ Refresh error:', err);
    }
  };

  const signOut = async () => {
    setUser(null);
    setError(null);
    console.log('🔓 User signed out');
  };

  // Auto sign-in when Telegram user is ready
  useEffect(() => {
    console.log('🔄 Auth effect triggered:', { isReady, telegramUser: !!telegramUser, user: !!user });
    
    if (isReady && telegramUser && !user) {
      console.log('▶️ Starting auto sign-in...');
      signIn();
    } else if (isReady && !telegramUser && !isTelegram) {
      console.log('⚠️ Not in Telegram environment, skipping auth');
      setLoading(false);
    } else if (isReady && !telegramUser && isTelegram) {
      console.log('⚠️ In Telegram but no user data');
      setError('Telegram user data not available');
      setLoading(false);
    }
  }, [isReady, telegramUser]);

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signOut, refreshUser }}>
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

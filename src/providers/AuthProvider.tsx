import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useTelegram } from './TelegramProvider';
import { toast } from 'sonner';

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
      setError('No Telegram user');
      setLoading(false);
      return;
    }

    try {
      console.log('========================================');
      console.log('🔐 AUTHENTICATION STARTING');
      console.log('Telegram User ID:', telegramUser.id);
      console.log('Telegram Username:', telegramUser.username);
      console.log('Telegram Name:', telegramUser.first_name);
      console.log('========================================');
      
      setError(null);

      // Step 1: Check if user exists
      console.log('📊 Step 1: Checking if user exists...');
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramUser.id)
        .maybeSingle();

      if (fetchError) {
        console.error('❌ Fetch error:', fetchError);
        console.error('Error code:', fetchError.code);
        console.error('Error message:', fetchError.message);
        console.error('Error details:', fetchError.details);
        setError(`Database error: ${fetchError.message}`);
        toast.error(`DB Error: ${fetchError.message}`);
        setLoading(false);
        return;
      }

      if (existingUser) {
        console.log('✅ Existing user found!');
        console.log('User data:', existingUser);
        
        // Update last login
        console.log('📝 Updating last login...');
        const { data: updatedUser, error: updateError } = await supabase
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

        if (updateError) {
          console.error('❌ Update error:', updateError);
          // Still set existing user even if update fails
          setUser(existingUser);
          toast.warning('Logged in (update failed)');
        } else {
          console.log('✅ User updated successfully!');
          setUser(updatedUser);
          toast.success(`Welcome back, ${updatedUser.first_name}!`);
        }
      } else {
        console.log('➕ New user - creating account...');
        
        const newUserData = {
          telegram_id: telegramUser.id,
          username: telegramUser.username || `user_${telegramUser.id}`,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name || null,
          photo_url: telegramUser.photo_url || null,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          streak_count: 0,
          total_points: 0,
        };

        console.log('📝 Inserting new user:', newUserData);

        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert(newUserData)
          .select()
          .single();

        if (insertError) {
          console.error('❌ Insert error:', insertError);
          console.error('Error code:', insertError.code);
          console.error('Error message:', insertError.message);
          console.error('Error details:', insertError.details);
          setError(`Create error: ${insertError.message}`);
          toast.error(`Failed to create account: ${insertError.message}`);
          setLoading(false);
          return;
        }

        console.log('✅ New user created successfully!');
        console.log('New user data:', newUser);
        setUser(newUser);
        toast.success(`Welcome, ${newUser.first_name}! 🎉`);
      }

      console.log('========================================');
      console.log('✅ AUTHENTICATION COMPLETE');
      console.log('========================================');
      setLoading(false);
      
    } catch (err) {
      console.error('========================================');
      console.error('❌ UNEXPECTED ERROR');
      console.error('Error:', err);
      console.error('========================================');
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast.error(`Auth failed: ${errorMessage}`);
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
    toast.success('Signed out');
    console.log('🔓 User signed out');
  };

  useEffect(() => {
    console.log('🔄 Auth effect:', { 
      isReady, 
      hasTelegramUser: !!telegramUser, 
      hasAuthUser: !!user,
      isTelegram 
    });
    
    if (isReady && telegramUser && !user) {
      console.log('▶️ Auto sign-in triggered');
      signIn();
    } else if (isReady && !telegramUser && !isTelegram) {
      console.log('⚠️ Not in Telegram environment');
      setError('Not in Telegram');
      setLoading(false);
    } else if (isReady && !telegramUser && isTelegram) {
      console.log('⚠️ In Telegram but no user data');
      setError('No Telegram user data');
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

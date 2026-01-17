import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saveUserToSupabase = async (telegramUser: any) => {
      try {
        console.log('💾 Saving to Supabase:', telegramUser);

        const referralCode = `SF${telegramUser.id.toString(36).toUpperCase()}`;
        
        const userData = {
          telegram_id: telegramUser.id,
          username: telegramUser.username || `user${telegramUser.id}`,
          first_name: telegramUser.first_name || 'User',
          last_name: telegramUser.last_name || '',
          photo_url: telegramUser.photo_url || null,
          referral_code: referralCode,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        console.log('📝 User data to insert:', userData);

        // Try to insert
        const { data, error } = await supabase
          .from('profiles')
          .upsert(userData, {
            onConflict: 'telegram_id',
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Supabase error:', error);
          alert(`Database Error: ${error.message}`);
          return userData; // Return local data
        }

        console.log('✅ Saved to Supabase:', data);
        alert('✅ User saved to database!');
        return data;

      } catch (err) {
        console.error('💥 Exception:', err);
        alert(`Exception: ${err}`);
        return null;
      }
    };

    const initAuth = async () => {
      console.log('🚀 Auth starting...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const tg = window.Telegram?.WebApp;

      if (!tg) {
        console.log('⚠️ Not in Telegram');
        alert('⚠️ Please open from Telegram bot');
        setIsLoading(false);
        return;
      }

      tg.ready();
      tg.expand();

      const tgUser = tg.initDataUnsafe?.user;

      if (!tgUser) {
        console.log('❌ No Telegram user data');
        alert('❌ No user data from Telegram');
        setIsLoading(false);
        return;
      }

      console.log('📱 Telegram user:', tgUser);
      alert(`📱 Telegram ID: ${tgUser.id}`);

      const savedUser = await saveUserToSupabase(tgUser);

      if (savedUser) {
        setUser(savedUser);
        setIsAuthenticated(true);
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

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

declare global {
  interface Window {
    Telegram?: any;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        const tg = window.Telegram?.WebApp;
        
        if (!tg) {
          console.log('Not in Telegram');
          setIsLoading(false);
          return;
        }

        tg.ready();
        tg.expand();
        
        const tgUser = tg.initDataUnsafe?.user;
        
        if (!tgUser) {
          console.log('No Telegram user');
          setIsLoading(false);
          return;
        }

        console.log('📱 Telegram User:', tgUser);

        // Generate referral code
        const referralCode = `SF${tgUser.id.toString(36).toUpperCase()}`;
        const now = new Date().toISOString();

        // Check if user exists
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('*')
          .eq('telegram_id', tgUser.id)
          .single();

        let userData;

        if (existingUser) {
          // Update existing user
          const { data, error } = await supabase
            .from('profiles')
            .update({
              username: tgUser.username || null,
              first_name: tgUser.first_name || '',
              last_name: tgUser.last_name || null,
              photo_url: tgUser.photo_url || null,
              updated_at: now,
            })
            .eq('telegram_id', tgUser.id)
            .select()
            .single();

          if (error) {
            console.error('Update error:', error);
            userData = existingUser;
          } else {
            userData = data;
            console.log('✅ User updated in Supabase');
          }
        } else {
          // Insert new user
          const { data, error } = await supabase
            .from('profiles')
            .insert({
              telegram_id: tgUser.id,
              username: tgUser.username || null,
              first_name: tgUser.first_name || '',
              last_name: tgUser.last_name || null,
              photo_url: tgUser.photo_url || null,
              referral_code: referralCode,
              created_at: now,
              updated_at: now,
            })
            .select()
            .single();

          if (error) {
            console.error('Insert error:', error);
            // Create local user object if DB insert fails
            userData = {
              id: `local_${tgUser.id}`,
              telegram_id: tgUser.id,
              username: tgUser.username,
              first_name: tgUser.first_name,
              last_name: tgUser.last_name,
              photo_url: tgUser.photo_url,
              referral_code: referralCode,
            };
          } else {
            userData = data;
            console.log('✅ New user created in Supabase');
          }
        }

        setUser(userData);
        setIsAuthenticated(true);
        console.log('✅ Authentication complete:', userData);

      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setIsLoading(false);
      }
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

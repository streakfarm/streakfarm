import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTelegram } from '@/hooks/useTelegram';

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
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isTelegram, isReady } = useTelegram();

  useEffect(() => {
    const authenticateUser = async () => {
      if (!isReady) {
        return;
      }

      if (!isTelegram) {
        setIsLoading(false);
        return;
      }

      // Get Telegram WebApp initData
      const initData = window.Telegram?.WebApp?.initData;
      
      if (!initData) {
        console.log('No Telegram initData available');
        setIsLoading(false);
        return;
      }

      try {
        // Call Edge Function for authentication
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

        const data = await response.json();

        if (data.success && data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
          console.log('Authentication successful:', data.user);
        } else {
          console.error('Authentication failed:', data.error);
        }
      } catch (error) {
        console.error('Authentication error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    authenticateUser();
  }, [isTelegram, isReady]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

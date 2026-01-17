import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
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
  const { isTelegram } = useTelegram();

  useEffect(() => {
    const authenticateUser = async () => {
      // Wait for Telegram WebApp to initialize
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if running in Telegram
      if (!window.Telegram?.WebApp) {
        console.log('Not in Telegram environment');
        setIsLoading(false);
        return;
      }

      const initData = window.Telegram.WebApp.initData;
      
      if (!initData) {
        console.log('No initData available');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-auth-streakfarm`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData }),
          }
        );

        const data = await response.json();

        if (data.success && data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    authenticateUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

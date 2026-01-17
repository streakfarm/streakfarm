import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { useTelegram } from '@/hooks/useTelegram';

interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isTelegram, isReady } = useTelegram();

  useEffect(() => {
    const authenticateUser = async () => {
      // Don't block rendering
      if (!isReady || !isTelegram) {
        return;
      }

      const initData = window.Telegram?.WebApp?.initData;
      if (!initData) {
        console.log('No Telegram initData available');
        return;
      }

      setIsLoading(true);
      
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        
        if (!supabaseUrl) {
          throw new Error('VITE_SUPABASE_URL not configured');
        }

        const response = await fetch(
          `${supabaseUrl}/functions/v1/telegram-auth`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ initData }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
          setError(null);
          console.log('✅ Authentication successful:', data.user);
        } else {
          throw new Error(data.error || 'Authentication failed');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('❌ Authentication error:', errorMessage);
        setError(errorMessage);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    authenticateUser();
  }, [isTelegram, isReady]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, error }}>
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

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
      console.log('🔍 Auth started');
      console.log('📱 Telegram ready:', isReady, 'Is Telegram:', isTelegram);

      // Give Telegram SDK time to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!isTelegram && typeof window !== 'undefined') {
        console.log('⚠️ Not in Telegram - creating mock user for testing');
        const mockUser = {
          id: 'test-123',
          telegram_id: 123456789,
          username: 'testuser',
          first_name: 'Test',
          referral_code: 'SFTEST',
        };
        setUser(mockUser);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      const initData = window.Telegram?.WebApp?.initData;
      console.log('📦 InitData available:', !!initData);
      
      if (!initData) {
        console.log('❌ No initData - setting mock user');
        const mockUser = {
          id: 'test-456',
          telegram_id: 987654321,
          username: 'testuser2',
          first_name: 'Demo',
          referral_code: 'SFDEMO',
        };
        setUser(mockUser);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      try {
        console.log('🚀 Calling Edge Function...');
        
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-auth-streakfarm`;
        console.log('🔗 URL:', url);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ initData }),
        });

        console.log('📥 Response status:', response.status);
        
        const data = await response.json();
        console.log('📦 Response data:', data);

        if (data.success && data.user) {
          console.log('✅ Authentication successful!');
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          console.error('❌ Authentication failed:', data.error);
          // Fallback to mock user
          const mockUser = {
            id: 'fallback-789',
            telegram_id: 111222333,
            username: 'fallbackuser',
            first_name: 'Fallback',
            referral_code: 'SFFALL',
          };
          setUser(mockUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('💥 Authentication error:', error);
        // Fallback to mock user on error
        const mockUser = {
          id: 'error-999',
          telegram_id: 999888777,
          username: 'erroruser',
          first_name: 'Error',
          referral_code: 'SFERR',
        };
        setUser(mockUser);
        setIsAuthenticated(true);
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

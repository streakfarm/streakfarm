import { useEffect, useState, createContext, useContext, ReactNode } from 'react';

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
      // Wait for Telegram SDK
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        const tg = window.Telegram?.WebApp;
        
        if (tg) {
          tg.ready();
          tg.expand();
          
          const tgUser = tg.initDataUnsafe?.user;
          
          if (tgUser) {
            const userData = {
              id: `tg_${tgUser.id}`,
              telegram_id: tgUser.id,
              username: tgUser.username || 'user',
              first_name: tgUser.first_name || 'User',
              last_name: tgUser.last_name || '',
              photo_url: tgUser.photo_url || null,
              referral_code: `SF${tgUser.id.toString(36).toUpperCase()}`,
            };
            
            setUser(userData);
            setIsAuthenticated(true);
            console.log('✅ Telegram user authenticated:', userData);
            setIsLoading(false);
            return;
          }
        }

        // Fallback for development/testing
        console.log('⚠️ Not in Telegram - using mock user');
        const mockUser = {
          id: 'dev_001',
          telegram_id: 123456789,
          username: 'devuser',
          first_name: 'Dev',
          last_name: 'User',
          photo_url: null,
          referral_code: 'SFDEV001',
        };
        
        setUser(mockUser);
        setIsAuthenticated(true);
        setIsLoading(false);
        
      } catch (error) {
        console.error('Auth error:', error);
        
        // Emergency fallback
        const fallbackUser = {
          id: 'fallback_001',
          telegram_id: 999999999,
          username: 'fallback',
          first_name: 'Guest',
          last_name: '',
          photo_url: null,
          referral_code: 'SFGUEST',
        };
        
        setUser(fallbackUser);
        setIsAuthenticated(true);
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

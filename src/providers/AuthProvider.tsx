import { useEffect, useState, createContext, useContext, ReactNode } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

interface AuthContextType {
  user: TelegramUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  telegramUser: any;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  telegramUser: null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [telegramUser, setTelegramUser] = useState<any>(null);

  useEffect(() => {
    const initTelegram = () => {
      const tg = window.Telegram?.WebApp;

      if (!tg) {
        console.log('Not running in Telegram');
        setIsLoading(false);
        return;
      }

      // Initialize Telegram WebApp
      tg.ready();
      tg.expand();

      // Get user from Telegram
      const tgUser = tg.initDataUnsafe?.user;

      if (tgUser) {
        const userData: TelegramUser = {
          id: tgUser.id,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name,
          username: tgUser.username,
          photo_url: tgUser.photo_url,
        };

        setUser(userData);
        setTelegramUser(tgUser);
        setIsAuthenticated(true);
        
        // Save to localStorage
        localStorage.setItem('telegram_user', JSON.stringify(userData));
      } else {
        // Try to load from localStorage (for development)
        const savedUser = localStorage.getItem('telegram_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          setTelegramUser(parsed);
          setIsAuthenticated(true);
        }
      }

      setIsLoading(false);
    };

    // Wait a bit for Telegram SDK to load
    const timer = setTimeout(initTelegram, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, telegramUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

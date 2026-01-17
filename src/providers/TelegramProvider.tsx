import { createContext, useContext, ReactNode, useEffect, useState } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface TelegramContextType {
  user: TelegramUser | null;
  isTelegram: boolean;
  isReady: boolean;
  expandViewport: () => void;
  hapticFeedback: (type: 'impact' | 'notification' | 'selection') => void;
}

const TelegramContext = createContext<TelegramContextType>({
  user: null,
  isTelegram: false,
  isReady: false,
  expandViewport: () => {},
  hapticFeedback: () => {},
});

export const TelegramProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const isTelegram = typeof window !== 'undefined' && !!window.Telegram?.WebApp;

  useEffect(() => {
    if (!isTelegram) {
      setIsReady(true);
      return;
    }

    const tg = window.Telegram.WebApp;

    // Initialize Telegram WebApp
    try {
      tg.ready();
      tg.expand();
      
      // Get user data
      const initDataUnsafe = tg.initDataUnsafe;
      if (initDataUnsafe?.user) {
        setUser(initDataUnsafe.user as TelegramUser);
      }

      setIsReady(true);
      console.log('✅ Telegram WebApp initialized');
    } catch (error) {
      console.error('❌ Telegram init error:', error);
      setIsReady(true);
    }
  }, [isTelegram]);

  const expandViewport = () => {
    try {
      if (isTelegram && window.Telegram?.WebApp) {
        window.Telegram.WebApp.expand();
      }
    } catch (error) {
      console.error('Expand viewport error:', error);
    }
  };

  const hapticFeedback = (type: 'impact' | 'notification' | 'selection' = 'impact') => {
    try {
      if (isTelegram && window.Telegram?.WebApp?.HapticFeedback) {
        const feedback = window.Telegram.WebApp.HapticFeedback;
        
        switch (type) {
          case 'impact':
            feedback.impactOccurred('medium');
            break;
          case 'notification':
            feedback.notificationOccurred('success');
            break;
          case 'selection':
            feedback.selectionChanged();
            break;
        }
      }
    } catch (error) {
      console.error('Haptic feedback error:', error);
    }
  };

  return (
    <TelegramContext.Provider
      value={{
        user,
        isTelegram,
        isReady,
        expandViewport,
        hapticFeedback,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
};

export const useTelegram = () => {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used within TelegramProvider');
  }
  return context;
};

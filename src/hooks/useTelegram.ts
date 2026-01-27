import { useEffect, useState, useCallback } from "react";

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    start_param?: string;
    auth_date?: number;
    hash?: string;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  HapticFeedback?: {
    impactOccurred: (style: "light" | "medium" | "heavy") => void;
    notificationOccurred: (type: "success" | "error" | "warning") => void;
    selectionChanged: () => void;
  };
  openTelegramLink: (url: string) => void;
  onEvent: (eventType: string, callback: () => void) => void;
  offEvent: (eventType: string, callback: () => void) => void;
  version: string;
  platform: string;
  colorScheme: string;
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
}

// Declare global window type
declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function useTelegram() {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isTelegram, setIsTelegram] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [initData, setInitData] = useState("");
  const [startParam, setStartParam] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let checkInterval: ReturnType<typeof setInterval> | null = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    
    const initializeTelegram = () => {
      try {
        const tg = window.Telegram?.WebApp;

        if (!tg) {
          // Browser / preview mode
          console.log('Telegram WebApp not detected - running in browser mode');
          if (isMounted) {
            setIsTelegram(false);
            setIsReady(true);
          }
          return;
        }

        console.log('Telegram WebApp detected:', {
          version: tg.version,
          platform: tg.platform,
          initDataLength: tg.initData?.length || 0,
          hasUser: !!tg.initDataUnsafe?.user,
        });

        // Call ready and expand
        try {
          tg.ready();
          tg.expand();
          console.log('Telegram WebApp ready() and expand() called successfully');
        } catch (e) {
          console.warn('Error calling Telegram ready/expand:', e);
        }

        // Extract user data and init data
        const userData = tg.initDataUnsafe?.user ?? null;
        const rawInitData = tg.initData || "";
        const startParamData = tg.initDataUnsafe?.start_param;

        console.log('Telegram user data:', userData ? JSON.stringify({
          id: userData.id,
          username: userData.username,
          first_name: userData.first_name,
        }) : 'No user data in initDataUnsafe');
        
        console.log('initData value:', rawInitData ? `Length: ${rawInitData.length}, First 100 chars: ${rawInitData.substring(0, 100)}` : 'EMPTY - initData is empty!');

        if (isMounted) {
          setUser(userData);
          setInitData(rawInitData);
          setStartParam(startParamData);
          setIsTelegram(true);
          setIsReady(true);
          setError(null);
        }
      } catch (err: any) {
        console.error('Error initializing Telegram WebApp:', err);
        if (isMounted) {
          setError('Failed to initialize Telegram WebApp: ' + err.message);
          setIsTelegram(false);
          setIsReady(true);
        }
      }
    };

    // Check if Telegram WebApp is already available
    if (window.Telegram?.WebApp) {
      initializeTelegram();
    } else {
      // Wait a bit for Telegram to load
      checkInterval = setInterval(() => {
        if (window.Telegram?.WebApp) {
          if (checkInterval) clearInterval(checkInterval);
          initializeTelegram();
        }
      }, 100);

      // Timeout after 3 seconds
      timeout = setTimeout(() => {
        if (checkInterval) clearInterval(checkInterval);
        if (!window.Telegram?.WebApp && isMounted) {
          console.log('Telegram WebApp not loaded within timeout - assuming browser mode');
          setIsTelegram(false);
          setIsReady(true);
        }
      }, 3000);
    }

    return () => {
      isMounted = false;
      if (checkInterval) clearInterval(checkInterval);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  const hapticFeedback = useCallback(
    (
      type:
        | "light"
        | "medium"
        | "heavy"
        | "success"
        | "error"
        | "warning"
    ) => {
      try {
        const tg = window.Telegram?.WebApp;
        if (!tg?.HapticFeedback) {
          console.log('Haptic feedback not available');
          return;
        }

        if (type === "success" || type === "error" || type === "warning") {
          tg.HapticFeedback.notificationOccurred(type);
        } else {
          tg.HapticFeedback.impactOccurred(type);
        }
      } catch (e) {
        console.warn('Haptic feedback error:', e);
      }
    },
    []
  );

  const shareRef = useCallback((refCode: string) => {
    try {
      const tg = window.Telegram?.WebApp;
      if (!tg) {
        console.log('Telegram not available for sharing');
        // Fallback: copy to clipboard or show message
        return;
      }

      const url = `https://t.me/StreakFarmBot?start=${refCode}`;
      tg.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(url)}`
      );
    } catch (e) {
      console.error('Error sharing referral:', e);
    }
  }, []);

  const openTelegramLink = useCallback((url: string) => {
    try {
      const tg = window.Telegram?.WebApp;
      if (!tg) {
        console.log('Telegram not available, opening in new tab');
        window.open(url, '_blank');
        return;
      }

      tg.openTelegramLink(url);
    } catch (e) {
      console.error('Error opening Telegram link:', e);
      window.open(url, '_blank');
    }
  }, []);

  const closeWebApp = useCallback(() => {
    try {
      const tg = window.Telegram?.WebApp;
      if (tg) {
        tg.close();
      }
    } catch (e) {
      console.error('Error closing WebApp:', e);
    }
  }, []);

  return {
    user,
    isTelegram,
    isReady,
    initData,
    startParam,
    error,
    hapticFeedback,
    shareRef,
    openTelegramLink,
    closeWebApp,
  };
}

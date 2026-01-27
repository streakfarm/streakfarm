import { useEffect, useState, useCallback } from "react";

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
  allows_write_to_pm?: boolean;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    start_param?: string;
    auth_date?: number;
    hash?: string;
    query_id?: string;
    chat_type?: string;
    chat_instance?: string;
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
  headerColor: string;
  backgroundColor: string;
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive: boolean) => void;
    hideProgress: () => void;
    setParams: (params: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }) => void;
  };
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  isVersionAtLeast: (version: string) => boolean;
}

// Declare global window type
declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

// Safe localStorage access
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  },
};

// Singleton state to prevent double initialization across React remounts
let globalTelegramState: {
  user: TelegramUser | null;
  isTelegram: boolean;
  isReady: boolean;
  initData: string;
  startParam: string | undefined;
  error: string | null;
} | null = null;

export function useTelegram() {
  const [state, setState] = useState(() => {
    // Use global state if already initialized
    if (globalTelegramState) {
      console.log('[useTelegram] Using cached global state');
      return globalTelegramState;
    }
    return {
      user: null as TelegramUser | null,
      isTelegram: false,
      isReady: false,
      initData: "",
      startParam: undefined as string | undefined,
      error: null as string | null,
    };
  });

  useEffect(() => {
    // If already initialized globally, don't re-initialize
    if (globalTelegramState) {
      console.log('[useTelegram] Already initialized globally, skipping');
      return;
    }

    const initializeTelegram = () => {
      try {
        const tg = window.Telegram?.WebApp;

        if (!tg) {
          console.log('[useTelegram] Telegram WebApp not detected - running in browser mode');
          const browserState = {
            user: null,
            isTelegram: false,
            isReady: true,
            initData: "",
            startParam: undefined,
            error: null,
          };
          globalTelegramState = browserState;
          setState(browserState);
          return;
        }

        // Call ready() immediately as per Telegram docs
        tg.ready();
        
        // Expand to full height
        try {
          tg.expand();
        } catch (e) {
          console.log('[useTelegram] expand() not available or failed');
        }

        console.log('[useTelegram] Telegram WebApp detected:', {
          version: tg.version,
          platform: tg.platform,
          initDataLength: tg.initData?.length || 0,
          hasUser: !!tg.initDataUnsafe?.user,
          hasHash: !!tg.initDataUnsafe?.hash,
          authDate: tg.initDataUnsafe?.auth_date,
        });

        // Get initData - this is the raw string that needs to be validated
        // It's already URL-encoded and contains all parameters including hash
        let rawInitData = tg.initData || "";
        
        // If initData is empty but we have initDataUnsafe with hash, construct initData
        // This shouldn't normally happen, but it's a fallback
        if (!rawInitData && tg.initDataUnsafe?.hash) {
          console.log('[useTelegram] initData empty but initDataUnsafe has hash, constructing initData');
          const params = new URLSearchParams();
          
          if (tg.initDataUnsafe.query_id) {
            params.set('query_id', tg.initDataUnsafe.query_id);
          }
          if (tg.initDataUnsafe.user) {
            params.set('user', JSON.stringify(tg.initDataUnsafe.user));
          }
          if (tg.initDataUnsafe.auth_date) {
            params.set('auth_date', String(tg.initDataUnsafe.auth_date));
          }
          if (tg.initDataUnsafe.hash) {
            params.set('hash', tg.initDataUnsafe.hash);
          }
          if (tg.initDataUnsafe.chat_type) {
            params.set('chat_type', tg.initDataUnsafe.chat_type);
          }
          if (tg.initDataUnsafe.chat_instance) {
            params.set('chat_instance', tg.initDataUnsafe.chat_instance);
          }
          if (tg.initDataUnsafe.start_param) {
            params.set('start_param', tg.initDataUnsafe.start_param);
          }
          
          rawInitData = params.toString();
        }
        
        const userData = tg.initDataUnsafe?.user ?? null;
        const startParamData = tg.initDataUnsafe?.start_param;

        console.log('[useTelegram] Extracted data:', {
          initDataLength: rawInitData.length,
          hasUser: !!userData,
          userId: userData?.id,
          username: userData?.username,
          startParam: startParamData,
        });

        const newState = {
          user: userData,
          isTelegram: true,
          isReady: true,
          initData: rawInitData,
          startParam: startParamData,
          error: null,
        };

        // Store globally to prevent re-initialization
        globalTelegramState = newState;
        setState(newState);

        // Store referral code in localStorage
        if (startParamData) {
          safeStorage.setItem('streakfarm_ref_code', startParamData);
        }

      } catch (err: any) {
        console.error('[useTelegram] Initialization error:', err);
        const errorState = {
          user: null,
          isTelegram: false,
          isReady: true,
          initData: "",
          startParam: undefined,
          error: err.message,
        };
        globalTelegramState = errorState;
        setState(errorState);
      }
    };

    // Check if Telegram WebApp is available
    if (window.Telegram?.WebApp) {
      initializeTelegram();
    } else {
      // Wait for Telegram WebApp with timeout
      console.log('[useTelegram] Waiting for Telegram WebApp...');
      let checkCount = 0;
      const maxChecks = 50; // 5 seconds total (50 * 100ms)

      const checkInterval = setInterval(() => {
        checkCount++;
        if (window.Telegram?.WebApp) {
          clearInterval(checkInterval);
          console.log('[useTelegram] Telegram WebApp found after', checkCount, 'checks');
          initializeTelegram();
        } else if (checkCount >= maxChecks) {
          clearInterval(checkInterval);
          console.log('[useTelegram] Timeout - assuming browser mode');
          const browserState = {
            user: null,
            isTelegram: false,
            isReady: true,
            initData: "",
            startParam: undefined,
            error: null,
          };
          globalTelegramState = browserState;
          setState(browserState);
        }
      }, 100);

      return () => clearInterval(checkInterval);
    }
  }, []);

  const hapticFeedback = useCallback(
    (type: "light" | "medium" | "heavy" | "success" | "error" | "warning") => {
      try {
        const tg = window.Telegram?.WebApp;
        if (!tg?.HapticFeedback) return;

        if (type === "success" || type === "error" || type === "warning") {
          tg.HapticFeedback.notificationOccurred(type);
        } else {
          tg.HapticFeedback.impactOccurred(type);
        }
      } catch (e) {
        // Ignore
      }
    },
    []
  );

  const shareRef = useCallback((refCode: string) => {
    try {
      const tg = window.Telegram?.WebApp;
      if (!tg) {
        navigator.clipboard.writeText(`https://t.me/StreakFarmBot?start=${refCode}`);
        return;
      }
      const url = `https://t.me/StreakFarmBot?start=${refCode}`;
      tg.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent('Join me on StreakFarm! 🔥')}`
      );
    } catch (e) {
      console.error('[useTelegram] Share error:', e);
    }
  }, []);

  const openTelegramLink = useCallback((url: string) => {
    try {
      const tg = window.Telegram?.WebApp;
      if (!tg) {
        window.open(url, '_blank');
        return;
      }
      tg.openTelegramLink(url);
    } catch (e) {
      window.open(url, '_blank');
    }
  }, []);

  const closeWebApp = useCallback(() => {
    try {
      window.Telegram?.WebApp?.close();
    } catch (e) {
      // Ignore
    }
  }, []);

  return {
    ...state,
    hapticFeedback,
    shareRef,
    openTelegramLink,
    closeWebApp,
  };
}

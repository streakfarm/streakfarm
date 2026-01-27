import { useEffect, useState, useCallback } from "react";

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    start_param?: string;
    auth_date?: number;
    hash?: string;
    query_id?: string;
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
    TelegramWebAppReady?: boolean;
    TelegramWebAppInitData?: string;
    __TELEGRAM_HOOK_INITIALIZED__?: boolean;
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

    // Mark as initialized to prevent double initialization
    window.__TELEGRAM_HOOK_INITIALIZED__ = true;

    const initializeTelegram = () => {
      try {
        const tg = window.Telegram?.WebApp;

        if (!tg) {
          console.log('[useTelegram] Telegram WebApp not detected - browser mode');
          const newState = {
            user: null,
            isTelegram: false,
            isReady: true,
            initData: "",
            startParam: undefined,
            error: null,
          };
          globalTelegramState = newState;
          setState(newState);
          return;
        }

        console.log('[useTelegram] Telegram WebApp detected:', {
          version: tg.version,
          platform: tg.platform,
          initDataLength: tg.initData?.length || 0,
          hasUser: !!tg.initDataUnsafe?.user,
        });

        // Use pre-initialized data if available, otherwise get fresh from tg
        let rawInitData = window.TelegramWebAppInitData || tg.initData || "";
        
        // If still no initData, try to construct from initDataUnsafe (fallback)
        if (!rawInitData && tg.initDataUnsafe) {
          const params = new URLSearchParams();
          if (tg.initDataUnsafe.auth_date) params.set('auth_date', String(tg.initDataUnsafe.auth_date));
          if (tg.initDataUnsafe.hash) params.set('hash', tg.initDataUnsafe.hash);
          if (tg.initDataUnsafe.query_id) params.set('query_id', tg.initDataUnsafe.query_id);
          if (tg.initDataUnsafe.user) params.set('user', JSON.stringify(tg.initDataUnsafe.user));
          rawInitData = params.toString();
          console.log('[useTelegram] Constructed initData from initDataUnsafe');
        }
        
        const userData = tg.initDataUnsafe?.user ?? null;
        const startParamData = tg.initDataUnsafe?.start_param;

        console.log('[useTelegram] Data extracted:', {
          initDataLength: rawInitData.length,
          hasUser: !!userData,
          userId: userData?.id,
          username: userData?.username,
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

        // Store referral code
        if (startParamData) {
          safeStorage.setItem('streakfarm_ref_code', startParamData);
        }

      } catch (err: any) {
        console.error('[useTelegram] Error:', err);
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

    // Check if already initialized by pre-init script
    if (window.TelegramWebAppReady !== undefined || window.Telegram?.WebApp) {
      initializeTelegram();
    } else {
      // Wait for Telegram with timeout
      let checkCount = 0;
      const maxChecks = 30;

      const checkInterval = setInterval(() => {
        checkCount++;
        if (window.Telegram?.WebApp) {
          clearInterval(checkInterval);
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

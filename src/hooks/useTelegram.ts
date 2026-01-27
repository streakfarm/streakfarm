import { useEffect, useState, useCallback, useRef } from "react";

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

export function useTelegram() {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isTelegram, setIsTelegram] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [initData, setInitData] = useState("");
  const [startParam, setStartParam] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);

  const initAttempted = useRef(false);

  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (initAttempted.current) return;
    initAttempted.current = true;

    const initializeTelegram = () => {
      try {
        const tg = window.Telegram?.WebApp;

        if (!tg) {
          // Browser / preview mode
          console.log('[useTelegram] Telegram WebApp not detected - running in browser mode');
          setIsTelegram(false);
          setIsReady(true);
          return;
        }

        console.log('[useTelegram] Telegram WebApp detected:', {
          version: tg.version,
          platform: tg.platform,
          initDataLength: tg.initData?.length || 0,
          hasUser: !!tg.initDataUnsafe?.user,
          webAppReady: window.TelegramWebAppReady,
        });

        // Store WebApp instance
        setWebApp(tg);

        // Use pre-initialized data if available, otherwise use current
        const rawInitData = window.TelegramWebAppInitData ?? tg.initData ?? "";
        const userData = tg.initDataUnsafe?.user ?? null;
        const startParamData = tg.initDataUnsafe?.start_param;

        console.log('[useTelegram] Extracted data:', {
          initDataLength: rawInitData.length,
          hasUser: !!userData,
          userId: userData?.id,
          username: userData?.username,
          startParam: startParamData,
        });

        // Validate initData - must have content for Telegram auth
        if (!rawInitData || rawInitData.length < 10) {
          console.warn('[useTelegram] Warning: initData seems too short or empty');
        }

        setUser(userData);
        setInitData(rawInitData);
        setStartParam(startParamData);
        setIsTelegram(true);
        setIsReady(true);
        setError(null);

        // Store referral code if present
        if (startParamData) {
          safeStorage.setItem('streakfarm_ref_code', startParamData);
          console.log('[useTelegram] Stored referral code:', startParamData);
        }

      } catch (err: any) {
        console.error('[useTelegram] Error initializing Telegram WebApp:', err);
        setError('Failed to initialize Telegram WebApp: ' + err.message);
        setIsTelegram(false);
        setIsReady(true);
      }
    };

    // Check if already initialized by pre-init script
    if (window.TelegramWebAppReady !== undefined) {
      console.log('[useTelegram] Using pre-initialized WebApp state');
      initializeTelegram();
    } else if (window.Telegram?.WebApp) {
      console.log('[useTelegram] WebApp available, initializing immediately');
      initializeTelegram();
    } else {
      // Wait for Telegram to load with timeout
      console.log('[useTelegram] Waiting for Telegram WebApp to load...');
      let checkCount = 0;
      const maxChecks = 50; // 5 seconds total (100ms * 50)

      const checkInterval = setInterval(() => {
        checkCount++;
        if (window.Telegram?.WebApp) {
          clearInterval(checkInterval);
          console.log('[useTelegram] WebApp found after', checkCount, 'checks');
          initializeTelegram();
        } else if (checkCount >= maxChecks) {
          clearInterval(checkInterval);
          console.log('[useTelegram] WebApp not loaded within timeout - assuming browser mode');
          setIsTelegram(false);
          setIsReady(true);
        }
      }, 100);
    }
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
          console.log('[useTelegram] Haptic feedback not available');
          return;
        }

        if (type === "success" || type === "error" || type === "warning") {
          tg.HapticFeedback.notificationOccurred(type);
        } else {
          tg.HapticFeedback.impactOccurred(type);
        }
      } catch (e) {
        console.warn('[useTelegram] Haptic feedback error:', e);
      }
    },
    []
  );

  const showMainButton = useCallback((text: string, onClick: () => void, color?: string) => {
    try {
      const tg = window.Telegram?.WebApp;
      if (!tg?.MainButton) return;

      tg.MainButton.setText(text);
      if (color) {
        tg.MainButton.setParams({ color });
      }
      tg.MainButton.onClick(onClick);
      tg.MainButton.show();
    } catch (e) {
      console.warn('[useTelegram] MainButton error:', e);
    }
  }, []);

  const hideMainButton = useCallback(() => {
    try {
      const tg = window.Telegram?.WebApp;
      if (!tg?.MainButton) return;
      tg.MainButton.hide();
    } catch (e) {
      console.warn('[useTelegram] Hide MainButton error:', e);
    }
  }, []);

  const setMainButtonLoading = useCallback((loading: boolean) => {
    try {
      const tg = window.Telegram?.WebApp;
      if (!tg?.MainButton) return;

      if (loading) {
        tg.MainButton.showProgress(true);
        tg.MainButton.disable();
      } else {
        tg.MainButton.hideProgress();
        tg.MainButton.enable();
      }
    } catch (e) {
      console.warn('[useTelegram] MainButton loading error:', e);
    }
  }, []);

  const shareRef = useCallback((refCode: string) => {
    try {
      const tg = window.Telegram?.WebApp;
      if (!tg) {
        console.log('[useTelegram] Telegram not available for sharing');
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(`https://t.me/StreakFarmBot?start=${refCode}`);
        return;
      }

      const url = `https://t.me/StreakFarmBot?start=${refCode}`;
      tg.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent('Join me on StreakFarm and earn rewards! 🔥')}`
      );
    } catch (e) {
      console.error('[useTelegram] Error sharing referral:', e);
    }
  }, []);

  const openTelegramLink = useCallback((url: string) => {
    try {
      const tg = window.Telegram?.WebApp;
      if (!tg) {
        console.log('[useTelegram] Telegram not available, opening in new tab');
        window.open(url, '_blank');
        return;
      }

      tg.openTelegramLink(url);
    } catch (e) {
      console.error('[useTelegram] Error opening Telegram link:', e);
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
      console.error('[useTelegram] Error closing WebApp:', e);
    }
  }, []);

  const showBackButton = useCallback((onClick: () => void) => {
    try {
      const tg = window.Telegram?.WebApp;
      if (!tg?.BackButton) return;

      tg.BackButton.onClick(onClick);
      tg.BackButton.show();
    } catch (e) {
      console.warn('[useTelegram] BackButton error:', e);
    }
  }, []);

  const hideBackButton = useCallback(() => {
    try {
      const tg = window.Telegram?.WebApp;
      if (!tg?.BackButton) return;
      tg.BackButton.hide();
    } catch (e) {
      console.warn('[useTelegram] Hide BackButton error:', e);
    }
  }, []);

  return {
    user,
    isTelegram,
    isReady,
    initData,
    startParam,
    error,
    webApp,
    hapticFeedback,
    shareRef,
    openTelegramLink,
    closeWebApp,
    showMainButton,
    hideMainButton,
    setMainButtonLoading,
    showBackButton,
    hideBackButton,
  };
}

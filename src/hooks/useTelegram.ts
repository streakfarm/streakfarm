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
    query_id?: string;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  openTelegramLink: (url: string) => void;
  version: string;
  platform: string;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export function useTelegram() {
  const [state, setState] = useState({
    user: null as TelegramUser | null,
    isTelegram: false,
    isReady: false,
    initData: "",
    startParam: undefined as string | undefined,
  });

  useEffect(() => {
    const init = () => {
      const tg = window.Telegram?.WebApp;

      if (!tg) {
        console.log('[Telegram] Not in Telegram');
        setState({
          user: null,
          isTelegram: false,
          isReady: true,
          initData: "",
          startParam: undefined,
        });
        return;
      }

      // Call ready() as per Telegram docs
      tg.ready();
      tg.expand?.();

      const initData = tg.initData || "";
      const user = tg.initDataUnsafe?.user || null;
      const startParam = tg.initDataUnsafe?.start_param;

      console.log('[Telegram] Initialized:', {
        version: tg.version,
        hasInitData: !!initData,
        hasUser: !!user,
      });

      setState({
        user,
        isTelegram: true,
        isReady: true,
        initData,
        startParam,
      });

      // Save ref code
      if (startParam) {
        try {
          localStorage.setItem('sf_ref', startParam);
        } catch {}
      }
    };

    if (window.Telegram?.WebApp) {
      init();
    } else {
      // Wait for Telegram
      let checks = 0;
      const interval = setInterval(() => {
        checks++;
        if (window.Telegram?.WebApp) {
          clearInterval(interval);
          init();
        } else if (checks > 30) {
          clearInterval(interval);
          console.log('[Telegram] Timeout');
          setState(s => ({ ...s, isReady: true }));
        }
      }, 100);
    }
  }, []);

  const hapticFeedback = useCallback((type: string) => {
    try {
      const haptic = window.Telegram?.WebApp?.HapticFeedback;
      if (!haptic) return;
      if (['success', 'error', 'warning'].includes(type)) {
        haptic.notificationOccurred(type as any);
      } else {
        haptic.impactOccurred(type as any);
      }
    } catch {}
  }, []);

  const shareRef = useCallback((code: string) => {
    const tg = window.Telegram?.WebApp;
    const url = `https://t.me/StreakFarmBot?start=${code}`;
    if (tg) {
      tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}`);
    } else {
      navigator.clipboard.writeText(url);
    }
  }, []);

  return { ...state, hapticFeedback, shareRef };
}

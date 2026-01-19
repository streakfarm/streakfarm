import { useEffect, useState, useCallback } from "react";

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    start_param?: string;
    auth_date?: number;
    hash?: string;
  };
  version: string;
  platform: string;
  colorScheme: "light" | "dark";
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  MainButton: {
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  BackButton: {
    show: () => void;
    hide: () => void;
  };
  HapticFeedback: {
    impactOccurred: (style: "light" | "medium" | "heavy") => void;
    notificationOccurred: (type: "success" | "error" | "warning") => void;
    selectionChanged: () => void;
  };
  openLink: (url: string) => void;
  openTelegramLink: (url: string) => void;
  showAlert: (message: string) => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
}

export function useTelegram() {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isTelegram, setIsTelegram] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (!tg) {
      // ❌ Telegram nahi hai (browser / dev mode)
      setIsTelegram(false);
      setIsReady(true);
      return;
    }

    // ✅ Telegram WebApp detected
    tg.ready();
    tg.expand();

    setWebApp(tg);
    setUser(tg.initDataUnsafe?.user ?? null);
    setIsTelegram(true);
    setIsReady(true);

    // Optional theme (safe)
    try {
      const v = parseFloat(tg.version || "6.0");
      if (v >= 6.1 && tg.setHeaderColor && tg.setBackgroundColor) {
        tg.setHeaderColor("#0a0a0f");
        tg.setBackgroundColor("#0a0a0f");
      }
    } catch {}
  }, []);

  const hapticFeedback = useCallback(
    (type: "light" | "medium" | "heavy" | "success" | "error" | "warning" | "selection") => {
      if (!webApp?.HapticFeedback) return;

      if (type === "selection") {
        webApp.HapticFeedback.selectionChanged();
      } else if (type === "success" || type === "error" || type === "warning") {
        webApp.HapticFeedback.notificationOccurred(type);
      } else {
        webApp.HapticFeedback.impactOccurred(type);
      }
    },
    [webApp],
  );

  const showMainButton = useCallback(
    (text: string, onClick: () => void) => {
      if (!webApp?.MainButton) return;
      webApp.MainButton.setText(text);
      webApp.MainButton.onClick(onClick);
      webApp.MainButton.show();
    },
    [webApp],
  );

  const hideMainButton = useCallback(() => {
    webApp?.MainButton?.hide();
  }, [webApp]);

  const openLink = useCallback(
    (url: string) => {
      webApp ? webApp.openLink(url) : window.open(url, "_blank");
    },
    [webApp],
  );

  const shareRef = useCallback(
    (refCode: string) => {
      const url = `https://t.me/StreakFarmBot?start=${refCode}`;
      const text = "🔥 Join StreakFarm and earn points!";
      if (webApp) {
        webApp.openTelegramLink(
          `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
        );
      } else {
        navigator.clipboard.writeText(`${text}\n${url}`);
      }
    },
    [webApp],
  );

  return {
    webApp,
    user,
    isReady,
    isTelegram,
    initData: webApp?.initData ?? "",
    startParam: webApp?.initDataUnsafe?.start_param,
    hapticFeedback,
    showMainButton,
    hideMainButton,
    openLink,
    shareRef,
  };
}

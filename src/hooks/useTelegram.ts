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
}

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

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (!tg || !tg.initData) {
      console.log("Telegram WebApp not detected or no initData.");
      setIsTelegram(false);
      setIsReady(true);
      return;
    }

    // Initialize Telegram WebApp
    tg.ready();
    tg.expand();

    // Set state from Telegram SDK
    setUser(tg.initDataUnsafe?.user ?? null);
    setInitData(tg.initData);
    setStartParam(tg.initDataUnsafe?.start_param);
    setIsTelegram(true);
    setIsReady(true);

    console.log("Telegram WebApp Initialized:", {
      id: tg.initDataUnsafe?.user?.id,
      username: tg.initDataUnsafe?.user?.username,
      version: tg.version
    });
  }, []);

  const hapticFeedback = useCallback((type: "light" | "medium" | "heavy" | "success" | "error" | "warning") => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.HapticFeedback) return;

    if (["success", "error", "warning"].includes(type)) {
      tg.HapticFeedback.notificationOccurred(type as "success" | "error" | "warning");
    } else {
      tg.HapticFeedback.impactOccurred(type as "light" | "medium" | "heavy");
    }
  }, []);

  const openTelegramLink = useCallback((url: string) => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.openTelegramLink(url);
    } else {
      window.open(url, "_blank");
    }
  }, []);

  return {
    user,
    isTelegram,
    isReady,
    initData,
    startParam,
    hapticFeedback,
    openTelegramLink,
    tg: window.Telegram?.WebApp,
  };
}

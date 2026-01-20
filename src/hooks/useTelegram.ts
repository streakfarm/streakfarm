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
}

export function useTelegram() {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isTelegram, setIsTelegram] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [initData, setInitData] = useState("");
  const [startParam, setStartParam] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Telegram injects WebApp slightly after load
    const timer = setTimeout(() => {
      const tg = (window as any)?.Telegram?.WebApp as TelegramWebApp | undefined;

      if (!tg || !tg.initData) {
        // Browser / preview mode
        setIsTelegram(false);
        setIsReady(true);
        return;
      }

      tg.ready();
      tg.expand();

      setUser(tg.initDataUnsafe?.user ?? null);
      setInitData(tg.initData);
      setStartParam(tg.initDataUnsafe?.start_param);
      setIsTelegram(true);
      setIsReady(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  const haptic = useCallback(
    (
      type:
        | "light"
        | "medium"
        | "heavy"
        | "success"
        | "error"
        | "warning"
    ) => {
      const tg = (window as any)?.Telegram?.WebApp as TelegramWebApp | undefined;
      if (!tg?.HapticFeedback) return;

      if (type === "success" || type === "error" || type === "warning") {
        tg.HapticFeedback.notificationOccurred(type);
      } else {
        tg.HapticFeedback.impactOccurred(type);
      }
    },
    []
  );

  const shareRef = useCallback((refCode: string) => {
    const tg = (window as any)?.Telegram?.WebApp as TelegramWebApp | undefined;
    if (!tg) return;

    const url = `https://t.me/StreakFarmBot?start=${refCode}`;
    tg.openTelegramLink(
      `https://t.me/share/url?url=${encodeURIComponent(url)}`
    );
  }, []);

  return {
    user,
    isTelegram,
    isReady,
    initData,     // 👉 backend (/api/telegram-login) ko yahi bhejna hai
    startParam,   // 👉 referral / deep-link ke liye
    haptic,
    shareRef,
  };
}

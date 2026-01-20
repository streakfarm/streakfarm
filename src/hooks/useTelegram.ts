import { useEffect, useState, useCallback } from "react";
import WebApp from "@twa-dev/sdk";

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export function useTelegram() {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isTelegram, setIsTelegram] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      // ✅ Telegram WebApp available ONLY inside Telegram
      if (!WebApp || !WebApp.initData) {
        setIsTelegram(false);
        setIsReady(true);
        return;
      }

      WebApp.ready();
      WebApp.expand();

      setUser(WebApp.initDataUnsafe?.user ?? null);
      setIsTelegram(true);
      setIsReady(true);

      // Optional theme (safe)
      try {
        const v = parseFloat(WebApp.version || "6.0");
        if (v >= 6.1 && WebApp.setHeaderColor && WebApp.setBackgroundColor) {
          WebApp.setHeaderColor("#0a0a0f");
          WebApp.setBackgroundColor("#0a0a0f");
        }
      } catch {}
    } catch (e) {
      console.error("Telegram init failed", e);
      setIsTelegram(false);
      setIsReady(true);
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
        | "selection",
    ) => {
      if (!WebApp?.HapticFeedback) return;

      if (type === "selection") {
        WebApp.HapticFeedback.selectionChanged();
      } else if (type === "success" || type === "error" || type === "warning") {
        WebApp.HapticFeedback.notificationOccurred(type);
      } else {
        WebApp.HapticFeedback.impactOccurred(type);
      }
    },
    [],
  );

  const showMainButton = useCallback((text: string, onClick: () => void) => {
    if (!WebApp?.MainButton) return;
    WebApp.MainButton.setText(text);
    WebApp.MainButton.onClick(onClick);
    WebApp.MainButton.show();
  }, []);

  const hideMainButton = useCallback(() => {
    WebApp?.MainButton?.hide();
  }, []);

  const openLink = useCallback((url: string) => {
    WebApp ? WebApp.openLink(url) : window.open(url, "_blank");
  }, []);

  const shareRef = useCallback((refCode: string) => {
    const url = `https://t.me/StreakFarmBot?start=${refCode}`;
    const text = "🔥 Join StreakFarm and earn points!";
    if (WebApp) {
      WebApp.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      );
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
    }
  }, []);

  return {
    webApp: WebApp,
    user,
    isReady,
    isTelegram,
    initData: WebApp?.initData || "",
    startParam: WebApp?.initDataUnsafe?.start_param,
    hapticFeedback,
    showMainButton,
    hideMainButton,
    openLink,
    shareRef,
  };
}

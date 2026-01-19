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
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
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
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
  };
  BackButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  HapticFeedback: {
    impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
    selectionChanged: () => void;
  };
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
}

export function useTelegram() {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg) {
      setWebApp(tg);
      setUser(tg.initDataUnsafe.user || null);
      setIsTelegram(true);

      // Initialize the WebApp
      tg.ready();
      tg.expand();

      // Set theme colors only if supported (version 6.1+)
      try {
        const version = parseFloat(tg.version || "6.0");
        if (version >= 6.1) {
          tg.setHeaderColor("#0a0a0f");
          tg.setBackgroundColor("#0a0a0f");
        }
      } catch (e) {
        console.log("Theme colors not supported");
      }

      setIsReady(true);
    } else {
      // Development mode - mock user
      setUser({
        id: 123456789,
        first_name: "Dev",
        username: "developer",
        language_code: "en",
      });
      setIsReady(true);
    }
  }, []);

  const hapticFeedback = useCallback(
    (type: "light" | "medium" | "heavy" | "success" | "error" | "warning" | "selection") => {
      if (!webApp?.HapticFeedback) return;

      if (type === "selection") {
        webApp.HapticFeedback.selectionChanged();
      } else if (["success", "error", "warning"].includes(type)) {
        webApp.HapticFeedback.notificationOccurred(type as "success" | "error" | "warning");
      } else {
        webApp.HapticFeedback.impactOccurred(type as "light" | "medium" | "heavy");
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
      if (webApp) {
        webApp.openLink(url);
      } else {
        window.open(url, "_blank");
      }
    },
    [webApp],
  );

  const shareRef = useCallback(
    (refCode: string) => {
      const shareUrl = `https://t.me/StreakFarmBot?start=${refCode}`;
      const shareText = "🔥 Join StreakFarm and earn points! Use my referral link:";

      if (webApp) {
        webApp.openTelegramLink(
          `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
        );
      } else {
        navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      }
    },
    [webApp],
  );

  return {
    webApp,
    user,
    isReady,
    isTelegram,
    initData: webApp?.initData || "",
    startParam: webApp?.initDataUnsafe.start_param,
    hapticFeedback,
    showMainButton,
    hideMainButton,
    openLink,
    shareRef,
  };
}

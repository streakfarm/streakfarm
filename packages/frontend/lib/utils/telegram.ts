declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

export function getTelegramWebApp() {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp || null;
}

export function generateReferralLink(userId: string, botUsername: string): string {
  const appUrl = `https://t.me/${botUsername}/app`;
  return `${appUrl}?startapp=ref_${userId}`;
}

export function shareToTelegram(text: string, url: string) {
  const webApp = getTelegramWebApp();
  if (webApp) {
    webApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
  }
}

export function openTelegramLink(url: string) {
  const webApp = getTelegramWebApp();
  if (webApp) {
    webApp.openTelegramLink(url);
  } else {
    window.open(url, '_blank');
  }
}

export function showConfirm(message: string): Promise<boolean> {
  const webApp = getTelegramWebApp();
  if (webApp?.showConfirm) {
    return new Promise((resolve) => {
      webApp.showConfirm(message, resolve);
    });
  }
  return Promise.resolve(window.confirm(message));
}

export function hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'medium') {
  const webApp = getTelegramWebApp();
  if (webApp?.HapticFeedback) {
    if (type === 'success' || type === 'warning' || type === 'error') {
      webApp.HapticFeedback.notificationOccurred(type);
    } else {
      webApp.HapticFeedback.impactOccurred(type);
    }
  }
}

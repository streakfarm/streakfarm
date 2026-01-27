import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { TonWalletProvider } from "@/hooks/useTonWallet";
import { SplashScreen } from "@/components/SplashScreen";
import { useTelegram } from "@/hooks/useTelegram";
import { AnimatedRoutes } from "@/components/layout/AnimatedRoutes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function AppContent() {
  const { isLoading, isAuthenticated, authError, retryAuth } = useAuth();
  const { isTelegram, isReady, error: telegramError, initData } = useTelegram();
  const [showDebug, setShowDebug] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log("[AppContent] State update:", {
      isLoading,
      isAuthenticated,
      isTelegram,
      isReady,
      authError,
      telegramError,
      initDataLength: initData?.length || 0,
    });
  }, [isLoading, isAuthenticated, isTelegram, isReady, authError, telegramError, initData]);

  // Telegram WebApp handshake - ensure ready() is called
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      console.log("[AppContent] Telegram WebApp detected - ensuring ready() and expand()");
      try {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();

        // Set theme colors to match Telegram
        const tg = window.Telegram.WebApp;
        if (tg.themeParams) {
          document.body.style.backgroundColor = tg.themeParams.bg_color || '#000000';
        }
      } catch (e) {
        console.warn("[AppContent] Error calling Telegram WebApp methods:", e);
      }
    } else {
      console.log("[AppContent] Running outside Telegram (browser mode)");
    }
  }, []);

  // Handle double-tap to show debug info
  useEffect(() => {
    let lastTap = 0;
    const handleTap = () => {
      const now = Date.now();
      if (now - lastTap < 300) {
        setShowDebug(prev => !prev);
      }
      lastTap = now;
    };
    document.addEventListener('click', handleTap);
    return () => document.removeEventListener('click', handleTap);
  }, []);

  // Show error state
  if (authError) {
    return (
      <>
        <SplashScreen error={authError} onRetry={retryAuth} />
        {showDebug && (
          <div className="fixed bottom-4 left-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50 max-h-48 overflow-auto">
            <div>Debug Info:</div>
            <div>isTelegram: {isTelegram ? 'true' : 'false'}</div>
            <div>isReady: {isReady ? 'true' : 'false'}</div>
            <div>initData length: {initData?.length || 0}</div>
            <div>authError: {authError}</div>
          </div>
        )}
      </>
    );
  }

  // Show Telegram initialization error
  if (telegramError) {
    return <SplashScreen error={telegramError} onRetry={retryAuth} />;
  }

  // Loading state (auth or Telegram initialization)
  if (isLoading || !isReady) {
    return <SplashScreen />;
  }

  // Not in Telegram and not authenticated - show prompt
  if (!isTelegram && !isAuthenticated) {
    return <SplashScreen showTelegramPrompt />;
  }

  // In Telegram but no initData - show error
  if (isTelegram && !isAuthenticated && (!initData || initData.length < 10)) {
    return (
      <SplashScreen
        error="Unable to get Telegram authentication data. Please try opening the app again from the bot."
        onRetry={retryAuth}
      />
    );
  }

  // All good - show the app
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TonWalletProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </TonWalletProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

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
      staleTime: 5 * 60 * 1000,
    },
  },
});

function AppContent() {
  const { isLoading, isAuthenticated, authError, retryAuth } = useAuth();
  const { isTelegram, isReady, error: telegramError, initData } = useTelegram();
  const [showDebug, setShowDebug] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log("[App] State:", { isLoading, isAuthenticated, isTelegram, isReady, authError, initDataLen: initData?.length });
  }, [isLoading, isAuthenticated, isTelegram, isReady, authError, initData]);

  // Telegram WebApp setup
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      try {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      } catch (e) {
        console.warn("[App] Telegram setup error:", e);
      }
    }
  }, []);

  // Double-tap for debug
  useEffect(() => {
    let lastTap = 0;
    const handleTap = () => {
      const now = Date.now();
      if (now - lastTap < 300) setShowDebug(p => !p);
      lastTap = now;
    };
    document.addEventListener('click', handleTap);
    return () => document.removeEventListener('click', handleTap);
  }, []);

  // Error states
  if (authError) {
    return (
      <>
        <SplashScreen error={authError} onRetry={retryAuth} />
        {showDebug && (
          <div className="fixed bottom-4 left-4 right-4 bg-black/90 text-green-400 p-3 rounded-lg text-xs font-mono z-50">
            <div>Debug: isTelegram={isTelegram ? 'Y' : 'N'} | isReady={isReady ? 'Y' : 'N'} | initData={initData?.length || 0}</div>
          </div>
        )}
      </>
    );
  }

  if (telegramError) {
    return <SplashScreen error={telegramError} onRetry={retryAuth} />;
  }

  // Loading state
  if (isLoading || !isReady) {
    return <SplashScreen />;
  }

  // Not in Telegram, not authenticated
  if (!isTelegram && !isAuthenticated) {
    return <SplashScreen showTelegramPrompt />;
  }

  // In Telegram but no initData and not authenticated
  if (isTelegram && !isAuthenticated && (!initData || initData.length < 10)) {
    return (
      <SplashScreen
        error="Unable to get Telegram auth data. Please reopen from the bot."
        onRetry={retryAuth}
      />
    );
  }

  // SUCCESS - Show the app!
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

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
  const { isLoading, isAuthenticated, authError, retryAuth, session } = useAuth();
  const { isTelegram, isReady, error: telegramError, initData } = useTelegram();
  const [showDebug, setShowDebug] = useState(false);

  // Debug logging on every render
  console.log("[App] Render:", { 
    isLoading, 
    isAuthenticated, 
    isTelegram, 
    isReady, 
    hasAuthError: !!authError, 
    hasTelegramError: !!telegramError,
    initDataLen: initData?.length || 0,
    hasSession: !!session
  });

  // Telegram WebApp setup
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      try {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        console.log('[App] Telegram WebApp ready() called');
      } catch (e) {
        console.warn('[App] Telegram setup error:', e);
      }
    }
  }, []);

  // Triple-tap for debug (easier than double-tap)
  useEffect(() => {
    let tapCount = 0;
    let lastTapTime = 0;
    
    const handleTap = () => {
      const now = Date.now();
      if (now - lastTapTime < 500) {
        tapCount++;
        if (tapCount >= 3) {
          setShowDebug(p => !p);
          tapCount = 0;
        }
      } else {
        tapCount = 1;
      }
      lastTapTime = now;
    };
    
    document.addEventListener('click', handleTap);
    return () => document.removeEventListener('click', handleTap);
  }, []);

  // Show loading state
  if (isLoading || !isReady) {
    return (
      <>
        <SplashScreen />
        {showDebug && (
          <div className="fixed bottom-4 left-4 right-4 bg-black/90 text-green-400 p-3 rounded-lg text-xs font-mono z-50">
            <div>Loading... isReady={isReady ? 'Y' : 'N'} | isLoading={isLoading ? 'Y' : 'N'}</div>
            <div>isTelegram={isTelegram ? 'Y' : 'N'} | initData={initData?.length || 0}</div>
          </div>
        )}
      </>
    );
  }

  // Error states
  if (authError) {
    return (
      <>
        <SplashScreen error={authError} onRetry={retryAuth} />
        {showDebug && (
          <div className="fixed bottom-4 left-4 right-4 bg-black/90 text-green-400 p-3 rounded-lg text-xs font-mono z-50">
            <div>Auth Error | isTelegram={isTelegram ? 'Y' : 'N'}</div>
            <div>initData={initData?.length || 0} | session={session?.user?.id?.slice(0,8) || 'none'}</div>
          </div>
        )}
      </>
    );
  }

  if (telegramError) {
    return <SplashScreen error={telegramError} onRetry={retryAuth} />;
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
  console.log('[App] Showing app - authenticated:', isAuthenticated);
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

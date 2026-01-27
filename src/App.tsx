import { useEffect } from "react";
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
  const { isTelegram, isReady, error: telegramError } = useTelegram();

  // ✅ TELEGRAM WEBAPP HANDSHAKE (MOST IMPORTANT)
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      console.log("Telegram WebApp detected - calling ready() and expand()");
      try {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      } catch (e) {
        console.warn("Error calling Telegram WebApp methods:", e);
      }
    } else {
      console.log("Running outside Telegram (browser mode)");
    }
  }, []);

  console.log("AppContent state:", {
    isLoading,
    isAuthenticated,
    isTelegram,
    isReady,
    authError,
    telegramError,
  });

  // ❌ Auth error
  if (authError) {
    return <SplashScreen error={authError} onRetry={retryAuth} />;
  }

  // ❌ Telegram initialization error
  if (telegramError) {
    return <SplashScreen error={telegramError} onRetry={retryAuth} />;
  }

  // ⏳ Loading (auth or Telegram initialization)
  if (isLoading || !isReady) {
    return <SplashScreen />;
  }

  // ❗ Not in Telegram and not authenticated - show prompt
  if (!isTelegram && !isAuthenticated) {
    return <SplashScreen showTelegramPrompt />;
  }

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

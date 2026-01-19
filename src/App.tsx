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

const queryClient = new QueryClient();

function AppContent() {
  const { isLoading, isAuthenticated, authError, retryAuth } = useAuth();
  const { isTelegram } = useTelegram();

  // ✅ TELEGRAM WEBAPP HANDSHAKE (MOST IMPORTANT)
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      console.log("Telegram WebApp detected");
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    } else {
      console.log("Running outside Telegram");
    }
  }, []);

  console.log("AppContent state:", {
    isLoading,
    isAuthenticated,
    isTelegram,
    authError,
  });

  // ❌ Auth error
  if (authError) {
    return <SplashScreen error={authError} onRetry={retryAuth} />;
  }

  // ⏳ Loading
  if (isLoading) {
    return <SplashScreen />;
  }

  // ❗ Open inside Telegram
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

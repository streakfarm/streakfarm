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

  console.log("AppContent state:", { isLoading, isAuthenticated, isTelegram, authError });

  // Show error screen if auth failed
  if (authError) {
    return <SplashScreen error={authError} onRetry={retryAuth} />;
  }

  // Show splash while loading
  if (isLoading) {
    return <SplashScreen />;
  }

  // If not in Telegram and not authenticated, show Telegram prompt
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

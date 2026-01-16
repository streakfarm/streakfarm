import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { TonWalletProvider } from "@/hooks/useTonWallet";
import { SplashScreen } from "@/components/SplashScreen";
import { useTelegram } from "@/hooks/useTelegram";
import Index from "./pages/Index";
import Boxes from "./pages/Boxes";
import Badges from "./pages/Badges";
import Tasks from "./pages/Tasks";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { isLoading, isAuthenticated } = useAuth();
  const { isTelegram, isReady } = useTelegram();

  // Show splash while loading or waiting for Telegram to be ready
  if (isLoading || !isReady) {
    return <SplashScreen />;
  }

  // If not in Telegram and not authenticated, show Telegram prompt
  if (!isTelegram && !isAuthenticated) {
    return <SplashScreen showTelegramPrompt />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/boxes" element={<Boxes />} />
        <Route path="/badges" element={<Badges />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
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

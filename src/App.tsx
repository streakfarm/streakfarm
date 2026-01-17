import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TelegramProvider } from "@/providers/TelegramProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { TonWalletProvider } from "@/providers/TonWalletProvider";
import Index from "./pages/Index";
import Tasks from "./pages/Tasks";
import Badges from "./pages/Badges";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TelegramProvider>
        <AuthProvider>
          <TonWalletProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/badges" element={<Badges />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin" element={<Admin />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </TonWalletProvider>
        </AuthProvider>
      </TelegramProvider>
    </QueryClientProvider>
  );
};

export default App;

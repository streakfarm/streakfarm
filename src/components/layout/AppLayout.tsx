import { ReactNode, useEffect } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { BottomNav } from '@/components/navigation/BottomNav';
import { TopHeader } from '@/components/layout/TopHeader';
import { FloatingCTA } from '@/components/gamification/FloatingCTA';
import { motion } from 'framer-motion';

interface AppLayoutProps {
  children: ReactNode;
  hideHeader?: boolean;
  hideFloatingCTA?: boolean;
}

export function AppLayout({ children, hideHeader = false, hideFloatingCTA = false }: AppLayoutProps) {
  const { isReady, isTelegram } = useTelegram();

  if (!isReady) {
    return (
      <div className="min-h-screen mobile-vh bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* Flame loader */}
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-6xl"
          >
            🔥
          </motion.div>
          <p className="text-muted-foreground">Loading StreakFarm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mobile-vh bg-background text-foreground flex flex-col overflow-hidden">
      {/* Top Header */}
      {!hideHeader && <TopHeader />}
      
      {/* Main content area */}
      <main className="flex-1 pb-20 overflow-y-auto scrollbar-hide">
        {children}
      </main>
      
      {/* Floating CTA */}
      {!hideFloatingCTA && <FloatingCTA />}
      
      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}

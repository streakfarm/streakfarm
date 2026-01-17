import { ReactNode, useEffect } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { BottomNav } from '@/components/navigation/BottomNav';
import { TopHeader } from '@/components/layout/TopHeader';
import { FloatingCTA } from '@/components/gamification/FloatingCTA';

interface AppLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showNav?: boolean;
  showCTA?: boolean;
  transparent?: boolean;
}

export function AppLayout({ 
  children, 
  showHeader = true, 
  showNav = true, 
  showCTA = true,
  transparent = false 
}: AppLayoutProps) {
  const { expandViewport } = useTelegram();

  useEffect(() => {
    try {
      expandViewport?.();
    } catch (error) {
      console.log('Viewport expand not available');
    }
  }, [expandViewport]);

  return (
    <div className="relative min-h-screen bg-background">
      {showHeader && <TopHeader transparent={transparent} />}
      
      <main className="relative z-0">
        {children}
      </main>

      {showCTA && <FloatingCTA />}
      {showNav && <BottomNav />}
    </div>
  );
}

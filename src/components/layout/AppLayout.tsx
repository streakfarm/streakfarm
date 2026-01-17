import { ReactNode, useEffect } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import BottomNav from '@/components/navigation/BottomNav';
import { TopHeader } from '@/components/layout/TopHeader';
import { FloatingCTA } from '@/components/gamification/FloatingCTA';

interface AppLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showNav?: boolean;
  showCTA?: boolean;
}

export const AppLayout = ({ 
  children, 
  showHeader = true,
  showNav = true,
  showCTA = true
}: AppLayoutProps) => {
  const { webApp } = useTelegram();

  useEffect(() => {
    if (webApp) {
      webApp.ready();
      webApp.expand();
    }
  }, [webApp]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {showHeader && <TopHeader />}
      
      <main className={`${showNav ? 'pb-20' : ''} ${showHeader ? 'pt-14' : ''}`}>
        {children}
      </main>
      
      {showNav && <BottomNav />}
      {showCTA && <FloatingCTA />}
    </div>
  );
};

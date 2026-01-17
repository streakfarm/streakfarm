import { ReactNode, useEffect } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { TopHeader } from '@/components/layout/TopHeader';
import { FloatingCTA } from '@/components/gamification/FloatingCTA';
import { Link, useLocation } from 'react-router-dom';
import { Home, CheckSquare, Trophy, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showNav?: boolean;
  showCTA?: boolean;
  transparent?: boolean;
}

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { path: '/badges', icon: Trophy, label: 'Badges' },
  { path: '/leaderboard', icon: Users, label: 'Ranks' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export function AppLayout({ 
  children, 
  showHeader = true, 
  showNav = true, 
  showCTA = true,
  transparent = false 
}: AppLayoutProps) {
  const { expandViewport } = useTelegram();
  const location = useLocation();

  useEffect(() => {
    expandViewport();
  }, [expandViewport]);

  return (
    <div className="relative min-h-screen bg-background">
      {showHeader && <TopHeader transparent={transparent} />}
      
      <main className="relative z-0">
        {children}
      </main>

      {showCTA && <FloatingCTA />}

      {/* INLINE BOTTOM NAV - NO IMPORT NEEDED */}
      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50">
          <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto">
            {navItems.map(({ path, icon: Icon, label }) => {
              const isActive = location.pathname === path;
              
              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 px-1.5 py-2 rounded-xl transition-all',
                    isActive ? 'text-secondary' : 'text-muted-foreground'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

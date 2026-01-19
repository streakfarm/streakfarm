import { Link, useLocation } from 'react-router-dom';
import { Home, CheckSquare, Trophy, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/hooks/useTelegram';
import { useBoxes } from '@/hooks/useBoxes';
import { motion } from 'framer-motion';
import { useState } from 'react';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { path: '/badges', icon: Trophy, label: 'Badges' },
  { path: '/leaderboard', icon: Users, label: 'Ranks' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const location = useLocation();
  const { hapticFeedback } = useTelegram();
  const { availableCount } = useBoxes();
  const [ripple, setRipple] = useState<{ x: number; y: number; path: string } | null>(null);

  const handleNavClick = (e: React.MouseEvent, path: string) => {
    hapticFeedback('selection');
    
    // Create ripple effect
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipple({ x, y, path });
    setTimeout(() => setRipple(null), 500);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50 safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          
          return (
            <Link
              key={path}
              to={path}
              onClick={(e) => handleNavClick(e, path)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 overflow-hidden',
                isActive 
                  ? 'text-secondary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {/* Ripple effect */}
              {ripple?.path === path && (
                <motion.span
                  initial={{ scale: 0, opacity: 0.5 }}
                  animate={{ scale: 4, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute rounded-full bg-secondary/30"
                  style={{
                    left: ripple.x,
                    top: ripple.y,
                    width: 10,
                    height: 10,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              )}
              
              {/* Active glow background */}
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 bg-secondary/10 rounded-xl"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              <div className="relative z-10">
                <Icon className={cn(
                  'w-5 h-5 transition-all',
                  isActive && 'drop-shadow-[0_0_8px_hsl(var(--secondary))]'
                )} />
                
                {/* Notification badge for tasks */}
                {path === '/' && availableCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] bg-accent text-accent-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                    {availableCount > 99 ? '99+' : availableCount}
                  </span>
                )}
              </div>
              
              <span className={cn(
                'text-[10px] font-medium relative z-10',
                isActive && 'font-semibold'
              )}>
                {label}
              </span>

              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  layoutId="nav-dot"
                  className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-secondary shadow-[0_0_8px_hsl(var(--secondary))]"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

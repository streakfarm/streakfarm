import { Link } from 'react-router-dom';
import { useBoxes } from '@/hooks/useBoxes';
import { Package, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function BoxPreview() {
  const { availableCount, expiredCount, nextBoxTime } = useBoxes();
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const diff = nextBoxTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        setCountdown('Now!');
        return;
      }
      
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextBoxTime]);

  return (
    <Link 
      to="/boxes" 
      className="block"
    >
      <div className={cn(
        'relative overflow-hidden rounded-2xl border p-5 transition-all duration-300',
        'bg-gradient-to-br from-card to-primary/5 border-border',
        'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10',
        'active:scale-[0.98]',
        availableCount > 0 && 'box-shimmer'
      )}>
        {/* Glow effect when boxes available */}
        {availableCount > 0 && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 animate-pulse pointer-events-none" />
        )}

        <div className="relative flex items-center justify-between">
          {/* Box icon and info */}
          <div className="flex items-center gap-4">
            <div className={cn(
              'relative w-14 h-14 rounded-xl flex items-center justify-center',
              availableCount > 0 
                ? 'bg-primary/20 text-primary pulse-glow' 
                : 'bg-muted text-muted-foreground'
            )}>
              <Package className="w-7 h-7" />
              {availableCount > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {availableCount > 99 ? '99+' : availableCount}
                </span>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold text-lg">
                {availableCount > 0 ? 'Open Box' : 'No Boxes'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {availableCount > 0 
                  ? `${availableCount} available` 
                  : 'Check back soon'
                }
                {expiredCount > 0 && (
                  <span className="text-destructive ml-2">
                    • {expiredCount} missed
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Next box countdown */}
          <div className="text-right">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs">Next in</span>
            </div>
            <span className={cn(
              'text-lg font-mono font-bold',
              countdown === 'Now!' ? 'text-accent' : 'text-foreground'
            )}>
              {countdown}
            </span>
          </div>
        </div>

        {/* Teaser text */}
        <div className="mt-4 flex items-center justify-between text-xs">
          {availableCount > 0 ? (
            <div className="flex items-center gap-2 text-amber-400/80">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Boxes expire in 3 hours - don't miss out!</span>
            </div>
          ) : (
            <div className="text-muted-foreground">
              Some users get up to 10,000 points 🎁
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

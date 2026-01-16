import { memo } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { Flame, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const STREAK_TIERS = [
  { days: 7, multiplier: 1.1, label: '7 Days' },
  { days: 14, multiplier: 1.2, label: '14 Days' },
  { days: 30, multiplier: 1.5, label: '30 Days' },
  { days: 60, multiplier: 2.0, label: '60 Days' },
  { days: 90, multiplier: 3.0, label: '90 Days' },
  { days: 180, multiplier: 5.0, label: '180 Days' },
  { days: 365, multiplier: 10.0, label: '1 Year' },
  { days: 730, multiplier: 15.0, label: '2 Years' },
];

export const StreakDisplay = memo(function StreakDisplay() {
  const { profile } = useProfile();

  const currentStreak = profile?.streak_current || 0;
  const bestStreak = profile?.streak_best || 0;
  const lastCheckin = profile?.last_checkin ? new Date(profile.last_checkin) : null;

  // Calculate current multiplier
  const currentTier = STREAK_TIERS.filter(t => currentStreak >= t.days).pop();
  const nextTier = STREAK_TIERS.find(t => currentStreak < t.days);
  const multiplier = currentTier?.multiplier || 1;
  const daysToNext = nextTier ? nextTier.days - currentStreak : 0;

  // Check if streak is at risk (no check-in today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkinDate = lastCheckin ? new Date(lastCheckin) : null;
  if (checkinDate) checkinDate.setHours(0, 0, 0, 0);
  const checkedInToday = checkinDate?.getTime() === today.getTime();
  const streakAtRisk = !checkedInToday && currentStreak > 0;

  const getStreakColor = () => {
    if (currentStreak >= 365) return 'text-rarity-mythic';
    if (currentStreak >= 90) return 'text-rarity-legendary';
    if (currentStreak >= 30) return 'text-rarity-epic';
    if (currentStreak >= 7) return 'text-rarity-rare';
    return 'text-accent';
  };

  const progress = nextTier 
    ? ((currentStreak - (currentTier?.days || 0)) / (nextTier.days - (currentTier?.days || 0))) * 100
    : 100;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border p-4 animate-fade-in',
        streakAtRisk 
          ? 'bg-destructive/10 border-destructive/50' 
          : 'bg-card border-border'
      )}
    >
      {/* Subtle glow for high streaks */}
      {currentStreak >= 7 && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 80% 20%, rgba(255,107,53,0.15) 0%, transparent 50%)',
          }}
        />
      )}

      <div className="relative flex items-center justify-between">
        {/* Streak count */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300',
              currentStreak >= 7 
                ? 'bg-gradient-to-br from-orange-500/20 to-red-500/20 shadow-lg shadow-orange-500/20' 
                : 'bg-muted'
            )}
          >
            <Flame className={cn('w-6 h-6', getStreakColor())} />
          </div>
          
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className={cn('text-2xl font-bold', getStreakColor())}>
                {currentStreak}
              </span>
              <span className="text-sm text-muted-foreground">day streak</span>
            </div>
            
            {streakAtRisk ? (
              <p className="text-xs text-destructive font-medium flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Check in to save streak!
              </p>
            ) : nextTier ? (
              <p className="text-xs text-muted-foreground">
                {daysToNext} days to {nextTier.label}
              </p>
            ) : (
              <p className="text-xs text-rarity-mythic font-medium">
                Maximum streak tier! 🔥
              </p>
            )}
          </div>
        </div>

        {/* Multiplier badge */}
        <div className="flex flex-col items-end gap-1">
          <div
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-300',
              multiplier >= 5 ? 'bg-rarity-legendary/20 text-rarity-legendary shadow-lg shadow-rarity-legendary/20' :
              multiplier >= 2 ? 'bg-rarity-epic/20 text-rarity-epic' :
              multiplier > 1 ? 'bg-rarity-rare/20 text-rarity-rare' :
              'bg-muted text-muted-foreground'
            )}
          >
            {multiplier.toFixed(1)}×
          </div>
          <span className="text-[10px] text-muted-foreground">
            Best: {bestStreak} days
          </span>
        </div>
      </div>

      {/* Progress bar to next tier */}
      {nextTier && (
        <div className="mt-4">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>{currentTier?.label || 'Start'}</span>
            <span>{nextTier.label}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700 ease-out',
                currentStreak >= 30 ? 'bg-gradient-to-r from-accent to-rarity-epic' :
                currentStreak >= 7 ? 'bg-gradient-to-r from-primary to-accent' :
                'bg-primary'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
});

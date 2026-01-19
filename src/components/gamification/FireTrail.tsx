import { memo } from 'react';
import { useProfile } from '@/hooks/useProfile';

interface StreakDayProps {
  day: number;
  isActive: boolean;
  isCurrent: boolean;
}

const StreakDay = memo(function StreakDay({ day, isActive, isCurrent }: StreakDayProps) {
  return (
    <div className="flex flex-col items-center animate-scale-in" style={{ animationDelay: `${day * 50}ms` }}>
      {/* Flame */}
      <div
        className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
          isActive 
            ? 'bg-gradient-to-br from-orange-500 to-red-500' 
            : 'bg-muted'
        } ${isCurrent ? 'ring-2 ring-orange-400 ring-offset-2 ring-offset-background' : ''}`}
      >
        <span className={`text-lg ${isActive ? '' : 'grayscale opacity-50'}`}>
          🔥
        </span>
      </div>
      
      {/* Day label */}
      <span className={`text-xs mt-1 ${isActive ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
        Day {day}
      </span>
    </div>
  );
});

export const FireTrail = memo(function FireTrail() {
  const { profile } = useProfile();
  const currentStreak = profile?.streak_current || 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2 px-2">
        {[1, 2, 3, 4, 5, 6, 7].map(day => (
          <StreakDay
            key={day}
            day={day}
            isActive={day <= currentStreak}
            isCurrent={day === currentStreak}
          />
        ))}
      </div>
      
      {/* Streak bonus indicator */}
      {currentStreak >= 7 && (
        <div className="mt-4 text-center animate-fade-in">
          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 text-sm font-semibold text-primary">
            🎉 7-Day Streak Bonus Active!
          </span>
        </div>
      )}
    </div>
  );
});

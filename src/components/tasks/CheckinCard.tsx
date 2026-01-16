import { useState, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTasks } from '@/hooks/useTasks';
import { useProfile } from '@/hooks/useProfile';
import { useTelegram } from '@/hooks/useTelegram';
import { Flame, Gift, Coins, Loader2, Sparkles, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { celebrateCheckin } from '@/components/animations/ConfettiExplosion';

export const CheckinCard = memo(function CheckinCard() {
  const { profile } = useProfile();
  const { dailyCheckin } = useTasks();
  const { hapticFeedback } = useTelegram();
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<{
    streak: number;
    points: number;
    badges: string[];
  } | null>(null);

  const canCheckin = profile?.last_checkin 
    ? new Date(profile.last_checkin).toDateString() !== new Date().toDateString()
    : true;

  const handleCheckin = async () => {
    if (!canCheckin || isChecking) return;

    setIsChecking(true);
    hapticFeedback('medium');

    try {
      const res = await dailyCheckin.mutateAsync();
      setResult({
        streak: res.checkin.streak_current,
        points: res.checkin.points_awarded,
        badges: res.earned_badges || [],
      });
      hapticFeedback('success');
      celebrateCheckin();
      toast.success(`Day ${res.checkin.streak_current} streak! +${res.checkin.points_awarded} points`);
    } catch (error) {
      hapticFeedback('error');
      toast.error(error instanceof Error ? error.message : 'Check-in failed');
    } finally {
      setIsChecking(false);
    }
  };

  const currentStreak = result?.streak || profile?.streak_current || 0;
  const streakBonus = Math.min(currentStreak * 5, 100);

  return (
    <div className="animate-fade-in">
      <Card className={cn(
        "p-6 relative overflow-hidden transition-all duration-300",
        canCheckin && !result
          ? "bg-gradient-to-br from-orange-500/20 via-red-500/10 to-yellow-500/20 border-orange-500/30"
          : result 
            ? "bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/30"
            : "bg-muted/30 border-border"
      )}>
        {/* Subtle glow for available checkin */}
        {canCheckin && !result && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(255,107,53,0.2) 0%, transparent 70%)',
            }}
          />
        )}

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300",
                  canCheckin && !result 
                    ? "bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/30"
                    : result 
                      ? "bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/30"
                      : "bg-muted"
                )}
              >
                {result ? (
                  <Check className="w-7 h-7 text-white" />
                ) : (
                  <Flame className="w-7 h-7 text-white" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg">Daily Check-in</h3>
                <p className="text-sm text-muted-foreground">
                  {result 
                    ? `Day ${result.streak} completed!`
                    : canCheckin 
                      ? 'Claim your daily reward!' 
                      : 'Come back tomorrow'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-1 text-2xl font-bold">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-gradient-primary">{currentStreak}</span>
              </div>
              <span className="text-xs text-muted-foreground">day streak</span>
            </div>
          </div>

          {/* Rewards Preview */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-background/50 rounded-lg p-3 text-center hover:scale-[1.02] transition-transform">
              <Gift className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
              <div className="font-semibold">50</div>
              <div className="text-xs text-muted-foreground">Base Points</div>
            </div>
            <div className="bg-background/50 rounded-lg p-3 text-center hover:scale-[1.02] transition-transform">
              <Coins className="w-5 h-5 mx-auto mb-1 text-green-500" />
              <div className="font-semibold text-green-500">+{streakBonus}</div>
              <div className="text-xs text-muted-foreground">Streak Bonus</div>
            </div>
          </div>

          {result ? (
            <div className="bg-green-500/20 rounded-lg p-4 text-center animate-scale-in">
              <div className="text-3xl font-bold text-green-500 mb-1">
                +{result.points}
              </div>
              <p className="text-sm text-green-400">Points earned today!</p>
              {result.badges.length > 0 && (
                <div className="mt-2 text-sm text-yellow-500">
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  New badge unlocked!
                </div>
              )}
            </div>
          ) : (
            <Button
              className={cn(
                "w-full h-12 transition-all duration-300",
                canCheckin 
                  ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/30"
                  : "bg-muted text-muted-foreground"
              )}
              disabled={!canCheckin || isChecking}
              onClick={handleCheckin}
            >
              {isChecking ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : canCheckin ? (
                <span className="flex items-center gap-2">
                  <Flame className="w-5 h-5" />
                  Claim Reward
                </span>
              ) : (
                'Already Claimed'
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
});

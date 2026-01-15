'use client';

import { useUserStore } from '@/lib/stores/useUserStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, TrendingUp, Award } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function StreakDisplay() {
  const user = useUserStore((state) => state.user);

  if (!user) return null;

  const nextMilestone = [7, 14, 30, 50, 100, 200, 365].find((m) => m > user.current_streak) || 365;
  const progress = (user.current_streak / nextMilestone) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Your Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Streak */}
        <div className="text-center">
          <p className="text-5xl font-bold text-orange-500">{user.current_streak}</p>
          <p className="text-sm text-muted-foreground mt-1">Days in a row 🔥</p>
        </div>

        {/* Progress to Next Milestone */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Next milestone</span>
            <span className="font-semibold">{nextMilestone} days</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-2xl font-bold">{user.longest_streak}</p>
            </div>
            <p className="text-xs text-muted-foreground">Longest Streak</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Award className="h-4 w-4 text-blue-500" />
              <p className="text-2xl font-bold">{user.total_multiplier.toFixed(1)}×</p>
            </div>
            <p className="text-xs text-muted-foreground">Multiplier</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/lib/stores/useUserStore';
import { useBoxStore } from '@/lib/stores/useBoxStore';
import { StreakDisplay } from '@/components/features/streak/StreakDisplay';
import { DailyCheckin } from '@/components/features/streak/DailyCheckin';
import { BoxOpener } from '@/components/features/box/BoxOpener';
import { BadgeShowcase } from '@/components/features/badge/BadgeShowcase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Users, Flame } from 'lucide-react';
import { formatPoints } from '@streakfarm/shared/utils/formatting';

export default function DashboardPage() {
  const user = useUserStore((state) => state.user);
  const fetchUser = useUserStore((state) => state.fetchUser);
  const fetchAvailableBoxes = useBoxStore((state) => state.fetchAvailableBoxes);

  useEffect(() => {
    fetchUser();
    fetchAvailableBoxes();
  }, []);

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {user.first_name}! 👋
        </h1>
        <p className="text-muted-foreground">
          Keep your streak alive and earn more rewards
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <Trophy className="mx-auto h-8 w-8 text-yellow-500 mb-2" />
            <p className="text-2xl font-bold">{formatPoints(user.total_points)}</p>
            <p className="text-xs text-muted-foreground">Total Points</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <Flame className="mx-auto h-8 w-8 text-orange-500 mb-2" />
            <p className="text-2xl font-bold">{user.current_streak}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="mx-auto h-8 w-8 text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{user.total_referrals}</p>
            <p className="text-xs text-muted-foreground">Referrals</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Checkin */}
      <DailyCheckin />

      {/* Streak Display */}
      <StreakDisplay />

      {/* Box Opener */}
      <BoxOpener />

      {/* Badge Showcase */}
      <BadgeShowcase limit={3} />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <a href="/tasks">
            <Card className="cursor-pointer hover:bg-accent transition-colors">
              <CardContent className="pt-6 text-center">
                <p className="font-semibold">Complete Tasks</p>
                <p className="text-xs text-muted-foreground mt-1">Earn bonus points</p>
              </CardContent>
            </Card>
          </a>
          <a href="/referrals">
            <Card className="cursor-pointer hover:bg-accent transition-colors">
              <CardContent className="pt-6 text-center">
                <p className="font-semibold">Invite Friends</p>
                <p className="text-xs text-muted-foreground mt-1">Get rewards</p>
              </CardContent>
            </Card>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

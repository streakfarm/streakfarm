'use client';

import { LeaderboardData } from '@streakfarm/shared/types/leaderboard';
import { Card, CardContent } from '@/components/ui/card';
import { useUserStore } from '@/lib/stores/useUserStore';
import { formatPoints, formatRank } from '@/lib/utils/format';
import { TrendingUp } from 'lucide-react';

interface UserRankCardProps {
  data: LeaderboardData;
}

export function UserRankCard({ data }: UserRankCardProps) {
  const user = useUserStore((state) => state.user);

  if (!user || !data.user_rank) return null;

  return (
    <Card className="border-primary border-2">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold">{formatRank(data.user_rank)}</div>
            <div>
              <p className="font-semibold">Your Rank</p>
              <p className="text-sm text-muted-foreground">
                Out of {data.total_users.toLocaleString()} players
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold">{formatPoints(user.total_points)}</p>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="h-3 w-3" />
              <span>Keep farming!</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

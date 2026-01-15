'use client';

import { LeaderboardEntry } from '@streakfarm/shared/types/leaderboard';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { formatPoints, formatRank } from '@/lib/utils/format';
import { Flame, TrendingUp, TrendingDown } from 'lucide-react';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <Card key={entry.user_id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Rank */}
                <div className="w-12 text-center">
                  <span className="text-2xl font-bold">
                    {formatRank(entry.rank)}
                  </span>
                </div>

                {/* User Info */}
                <div className="flex items-center gap-3">
                  {entry.photo_url ? (
                    <img
                      src={entry.photo_url}
                      alt={entry.first_name}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {entry.first_name[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">
                      {entry.first_name}
                      {entry.username && (
                        <span className="text-sm text-muted-foreground ml-1">
                          @{entry.username}
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Flame className="h-3 w-3 text-orange-500" />
                      <span>{entry.current_streak} days</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Points */}
              <div className="text-right">
                <p className="text-lg font-bold">{formatPoints(entry.total_points)}</p>
                {entry.rank_change !== null && entry.rank_change !== 0 && (
                  <div
                    className={`flex items-center gap-1 text-xs ${
                      entry.rank_change > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {entry.rank_change > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span>{Math.abs(entry.rank_change)}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

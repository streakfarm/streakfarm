'use client';

import { LeaderboardEntry } from '@streakfarm/shared/types/leaderboard';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Flame } from 'lucide-react';
import { formatPoints } from '@/lib/utils/format';

interface TopThreeShowcaseProps {
  entries: LeaderboardEntry[];
}

export function TopThreeShowcase({ entries }: TopThreeShowcaseProps) {
  if (entries.length < 3) return null;

  const [first, second, third] = entries;

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Second Place */}
      <Card className="mt-8">
        <CardContent className="pt-6 text-center">
          <div className="relative">
            {second.photo_url ? (
              <img
                src={second.photo_url}
                alt={second.first_name}
                className="h-16 w-16 rounded-full mx-auto border-4 border-gray-400"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gray-400 mx-auto flex items-center justify-center text-white text-2xl font-bold">
                {second.first_name[0]}
              </div>
            )}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-4xl">
              🥈
            </div>
          </div>
          <p className="font-semibold mt-4 truncate">{second.first_name}</p>
          <p className="text-lg font-bold text-gray-600 mt-1">
            {formatPoints(second.total_points)}
          </p>
          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mt-1">
            <Flame className="h-3 w-3 text-orange-500" />
            <span>{second.current_streak}</span>
          </div>
        </CardContent>
      </Card>

      {/* First Place */}
      <Card className="border-yellow-500 border-2 shadow-lg">
        <CardContent className="pt-6 text-center">
          <div className="relative">
            {first.photo_url ? (
              <img
                src={first.photo_url}
                alt={first.first_name}
                className="h-20 w-20 rounded-full mx-auto border-4 border-yellow-500"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-yellow-500 mx-auto flex items-center justify-center text-white text-3xl font-bold">
                {first.first_name[0]}
              </div>
            )}
            <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 h-8 w-8 text-yellow-500" />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-4xl">
              🥇
            </div>
          </div>
          <p className="font-bold mt-4 truncate">{first.first_name}</p>
          <p className="text-xl font-bold text-yellow-600 mt-1">
            {formatPoints(first.total_points)}
          </p>
          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mt-1">
            <Flame className="h-3 w-3 text-orange-500" />
            <span>{first.current_streak}</span>
          </div>
        </CardContent>
      </Card>

      {/* Third Place */}
      <Card className="mt-8">
        <CardContent className="pt-6 text-center">
          <div className="relative">
            {third.photo_url ? (
              <img
                src={third.photo_url}
                alt={third.first_name}
                className="h-16 w-16 rounded-full mx-auto border-4 border-orange-600"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-orange-600 mx-auto flex items-center justify-center text-white text-2xl font-bold">
                {third.first_name[0]}
              </div>
            )}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-4xl">
              🥉
            </div>
          </div>
          <p className="font-semibold mt-4 truncate">{third.first_name}</p>
          <p className="text-lg font-bold text-orange-600 mt-1">
            {formatPoints(third.total_points)}
          </p>
          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mt-1">
            <Flame className="h-3 w-3 text-orange-500" />
            <span>{third.current_streak}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

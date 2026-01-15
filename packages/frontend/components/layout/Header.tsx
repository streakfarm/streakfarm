'use client';

import { useUserStore } from '@/lib/stores/useUserStore';
import { formatPoints } from '@/lib/utils/format';
import { Flame, Trophy } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  const user = useUserStore((state) => state.user);

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Flame className="h-6 w-6 text-orange-500" />
          <span className="text-xl font-bold">StreakFarm</span>
        </Link>

        <div className="flex items-center gap-4">
          {/* Streak */}
          <div className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1.5">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-bold">{user.current_streak}</span>
          </div>

          {/* Points */}
          <div className="flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1.5">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-bold">{formatPoints(user.total_points)}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

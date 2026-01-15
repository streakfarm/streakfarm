'use client';

import { useEffect } from 'react';
import { useBadgeStore } from '@/lib/stores/useBadgeStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Lock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface BadgeShowcaseProps {
  limit?: number;
}

export function BadgeShowcase({ limit = 3 }: BadgeShowcaseProps) {
  const badges = useBadgeStore((state) => state.badges);
  const fetchBadges = useBadgeStore((state) => state.fetchBadges);

  useEffect(() => {
    if (badges.length === 0) {
      fetchBadges();
    }
  }, []);

  const displayBadges = badges.slice(0, limit);
  const unlockedCount = badges.filter((b) => b.is_unlocked).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Badges ({unlockedCount}/{badges.length})
          </CardTitle>
          <Link href="/badges">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {displayBadges.map((userBadge) => (
            <div
              key={userBadge.id}
              className={`relative p-3 rounded-lg border-2 text-center ${
                userBadge.is_unlocked
                  ? 'border-yellow-500 bg-yellow-500/10'
                  : 'border-gray-300 bg-gray-100 opacity-50'
              }`}
            >
              {userBadge.is_unlocked ? (
                <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              ) : (
                <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              )}
              <p className="text-xs font-semibold line-clamp-2">
                {userBadge.badge?.name || 'Badge'}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

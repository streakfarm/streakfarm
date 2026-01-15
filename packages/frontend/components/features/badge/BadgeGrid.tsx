'use client';

import { UserBadge } from '@streakfarm/shared/types/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Lock, CheckCircle2 } from 'lucide-react';
import { COLORS } from '@/lib/utils/constants';

interface BadgeGridProps {
  badges: UserBadge[];
}

export function BadgeGrid({ badges }: BadgeGridProps) {
  if (badges.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No badges found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {badges.map((userBadge) => {
        const progress = userBadge.progress_required > 0
          ? (userBadge.progress_current / userBadge.progress_required) * 100
          : 0;

        const rarityColor = userBadge.badge?.rarity 
          ? COLORS.rarity[userBadge.badge.rarity as keyof typeof COLORS.rarity]
          : COLORS.rarity.common;

        return (
          <Card
            key={userBadge.id}
            className={`relative ${
              userBadge.is_unlocked ? 'border-2' : 'opacity-75'
            }`}
            style={userBadge.is_unlocked ? { borderColor: rarityColor } : {}}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${rarityColor}20` }}
                  >
                    {userBadge.is_unlocked ? (
                      <Trophy className="h-6 w-6" style={{ color: rarityColor }} />
                    ) : (
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{userBadge.badge?.name}</CardTitle>
                    <CardDescription>{userBadge.badge?.category}</CardDescription>
                  </div>
                </div>
                {userBadge.is_unlocked && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {userBadge.badge?.description}
              </p>

              {/* Progress */}
              {!userBadge.is_unlocked && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">
                      {userBadge.progress_current} / {userBadge.progress_required}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Rewards */}
              <div className="flex items-center gap-4 pt-2 border-t text-sm">
                <div>
                  <span className="text-muted-foreground">Points:</span>
                  <span className="font-semibold ml-1">
                    +{userBadge.badge?.points_reward}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Multiplier:</span>
                  <span className="font-semibold ml-1">
                    +{userBadge.badge?.multiplier_bonus}×
                  </span>
                </div>
              </div>

              {/* Rarity Badge */}
              <Badge variant="outline" style={{ borderColor: rarityColor, color: rarityColor }}>
                {userBadge.badge?.rarity}
              </Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

'use client';

import { useUserStore } from '@/lib/stores/useUserStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, TrendingUp, Award } from 'lucide-react';
import { formatPoints } from '@/lib/utils/format';

export function BoxStats() {
  const user = useUserStore((state) => state.user);

  if (!user) return null;

  return (
    <div className="grid grid-cols-3 gap-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Total Opened</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-blue-500" />
            <p className="text-2xl font-bold">{user.total_boxes_opened}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <p className="text-2xl font-bold">-</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Avg. Points</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            <p className="text-2xl font-bold">
              {user.total_boxes_opened > 0
                ? formatPoints(Math.floor(user.total_points / user.total_boxes_opened))
                : '0'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

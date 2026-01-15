'use client';

import { useBoxStore } from '@/lib/stores/useBoxStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, Clock } from 'lucide-react';
import { formatPoints, formatTimeAgo } from '@/lib/utils/format';

export function BoxHistory() {
  const boxHistory = useBoxStore((state) => state.boxHistory);

  if (boxHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Box History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No boxes opened yet. Start opening boxes to see your history!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Boxes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {boxHistory.slice(0, 10).map((box) => (
            <div
              key={box.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                  <Gift className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">{box.type.replace('_', ' ')}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(box.opened_at!)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">
                  +{formatPoints(box.points_awarded || 0)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

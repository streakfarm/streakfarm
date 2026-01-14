'use client';

import { useQuery } from '@tanstack/react-query';
import { Box, Clock, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getBoxHistory, getBoxStats } from '@/lib/api/boxes';
import { formatPoints, formatTimeAgo } from '@streakfarm/shared';

export default function BoxesPage() {
  const { data: history = [] } = useQuery({
    queryKey: ['box-history'],
    queryFn: () => getBoxHistory(50),
  });
  
  const { data: stats } = useQuery({
    queryKey: ['box-stats'],
    queryFn: getBoxStats,
  });
  
  const rarityColors = {
    common: 'bg-gray-500',
    rare: 'bg-blue-500',
    legendary: 'bg-yellow-500',
  };
  
  const rarityEmojis = {
    common: '📦',
    rare: '✨',
    legendary: '💎',
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Boxes</h1>
        <p className="text-muted-foreground">
          Track your box opening history
        </p>
      </div>
      
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <Box className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{stats.total_opened}</p>
            <p className="text-xs text-muted-foreground">Opened</p>
          </Card>
          
          <Card className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{formatPoints(stats.average_points)}</p>
            <p className="text-xs text-muted-foreground">Avg Points</p>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="text-2xl mb-2">{rarityEmojis[stats.rarest_opened as keyof typeof rarityEmojis]}</div>
            <p className="text-sm font-bold capitalize">{stats.rarest_opened}</p>
            <p className="text-xs text-muted-foreground">Rarest</p>
          </Card>
        </div>
      )}
      
      {/* History */}
      <div>
        <h3 className="font-semibold mb-4">Recent Boxes</h3>
        
        {history.length === 0 ? (
          <Card className="p-8 text-center">
            <Box className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No boxes opened yet</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((box: any) => (
              <Card key={box.id} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">
                    {rarityEmojis[box.rarity as keyof typeof rarityEmojis]}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`${rarityColors[box.rarity as keyof typeof rarityColors]} text-white text-xs`}>
                        {box.rarity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(new Date(box.opened_at))}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatPoints(box.base_points)} base</span>
                      <span>×</span>
                      <span>{box.multiplier_applied.toFixed(1)}×</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      +{formatPoints(box.final_points)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

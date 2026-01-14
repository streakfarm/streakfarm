'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Medal, Crown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useUserStore } from '@/lib/stores/useUserStore';
import { getLeaderboard, getUserRank } from '@/lib/api/leaderboard';
import { formatPoints } from '@streakfarm/shared';
import type { LeaderboardType, LeaderboardEntry } from '@streakfarm/shared';

export default function LeaderboardPage() {
  const { user } = useUserStore();
  const [selectedType, setSelectedType] = useState<LeaderboardType>('global');
  
  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ['leaderboard', selectedType],
    queryFn: () => getLeaderboard(selectedType, 100),
  });
  
  const { data: rankData } = useQuery({
    queryKey: ['user-rank'],
    queryFn: getUserRank,
    enabled: !!user,
  });
  
  const userRank = rankData?.rank || 0;
  
  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return null;
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Leaderboard</h1>
        <p className="text-muted-foreground">
          Compete with farmers worldwide
        </p>
      </div>
      
      {/* User Rank Card */}
      {user && (
        <Card className="p-4 bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your Rank</p>
                <p className="text-2xl font-bold">#{userRank.toLocaleString()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Points</p>
              <p className="font-semibold">{formatPoints(user.raw_points)}</p>
            </div>
          </div>
        </Card>
      )}
      
      {/* Leaderboard Tabs */}
      <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as LeaderboardType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="global">Global</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="friends">Friends</TabsTrigger>
        </TabsList>
        
        <TabsContent value={selectedType} className="mt-6 space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading...
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No data available
            </div>
          ) : (
            leaderboard.map((entry: LeaderboardEntry) => (
              <LeaderboardCard
                key={entry.id}
                entry={entry}
                isCurrentUser={entry.telegram_id === user?.telegram_id}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LeaderboardCard({ 
  entry, 
  isCurrentUser 
}: { 
  entry: LeaderboardEntry; 
  isCurrentUser: boolean;
}) {
  const displayName = entry.username || entry.first_name || 'Anonymous';
  const initials = displayName.substring(0, 2).toUpperCase();
  
  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return null;
  };
  
  return (
    <Card className={`p-4 ${isCurrentUser ? 'border-primary' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 w-12">
          {getMedalIcon(entry.rank) || (
            <span className="text-lg font-bold text-muted-foreground w-8 text-center">
              {entry.rank}
            </span>
          )}
        </div>
        
        <Avatar className="h-10 w-10">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold truncate">{displayName}</p>
            {isCurrentUser && (
              <Badge variant="secondary" className="text-xs">You</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>🔥 {entry.streak_current}</span>
            {entry.total_referrals > 0 && (
              <span>👥 {entry.total_referrals}</span>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <p className="font-bold">{formatPoints(entry.raw_points)}</p>
        </div>
      </div>
    </Card>
  );
}

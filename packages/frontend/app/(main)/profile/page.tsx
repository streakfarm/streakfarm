'use client';

import { useQuery } from '@tanstack/react-query';
import { Calendar, Trophy, Users, Box, Flame, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useUserStore } from '@/lib/stores/useUserStore';
import { useBadgeStore } from '@/lib/stores/useBadgeStore';
import { useTelegram } from '@/lib/hooks/useTelegram';
import { getUserStats } from '@/lib/api/users';
import { formatPoints, formatMultiplier } from '@streakfarm/shared';
import Link from 'next/link';

export default function ProfilePage() {
  const { user } = useUserStore();
  const { userBadges } = useBadgeStore();
  const { user: telegramUser } = useTelegram();
  
  const { data: stats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: getUserStats,
    enabled: !!user,
  });
  
  if (!user) return null;
  
  const displayName = user.username || user.first_name || 'User';
  const initials = displayName.substring(0, 2).toUpperCase();
  const joinedDate = new Date(user.created_at).toLocaleDateString();
  
  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{displayName}</h2>
            <p className="text-sm text-muted-foreground">
              @{user.username || `user${user.telegram_id}`}
            </p>
            
            {user.wallet_address && (
              <Badge variant="secondary" className="mt-2">
                👛 Wallet Connected
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>Joined {joinedDate}</span>
          </div>
          
          {stats && (
            <span>Rank #{stats.rank.toLocaleString()}</span>
          )}
        </div>
      </Card>
      
      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <Flame className="w-8 h-8 mb-2 text-orange-500" />
            <p className="text-2xl font-bold">{user.streak_current}</p>
            <p className="text-xs text-muted-foreground">
              Current Streak (Best: {user.streak_best})
            </p>
          </Card>
          
          <Card className="p-4">
            <Trophy className="w-8 h-8 mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">{formatPoints(user.raw_points)}</p>
            <p className="text-xs text-muted-foreground">Total Points</p>
          </Card>
          
          <Card className="p-4">
            <Award className="w-8 h-8 mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{userBadges.length}</p>
            <p className="text-xs text-muted-foreground">Badges Earned</p>
          </Card>
          
          <Card className="p-4">
            <Users className="w-8 h-8 mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{user.total_referrals}</p>
            <p className="text-xs text-muted-foreground">Referrals</p>
          </Card>
          
          <Card className="p-4">
            <Box className="w-8 h-8 mb-2 text-green-500" />
            <p className="text-2xl font-bold">{user.total_boxes_opened}</p>
            <p className="text-xs text-muted-foreground">Boxes Opened</p>
          </Card>
          
          <Card className="p-4 bg-primary/5">
            <div className="text-2xl mb-2">✨</div>
            <p className="text-2xl font-bold">{formatMultiplier(user.multiplier_permanent)}</p>
            <p className="text-xs text-muted-foreground">Total Multiplier</p>
          </Card>
        </div>
      )}
      
      {/* Quick Links */}
      <div className="space-y-3">
        <Link href="/boxes">
          <Card className="p-4 flex items-center justify-between hover:bg-accent transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Box className="w-5 h-5 text-primary" />
              <span className="font-semibold">Box History</span>
            </div>
            <span className="text-muted-foreground">→</span>
          </Card>
        </Link>
        
        <Link href="/wallet">
          <Card className="p-4 flex items-center justify-between hover:bg-accent transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="text-xl">👛</div>
              <span className="font-semibold">
                {user.wallet_address ? 'Manage Wallet' : 'Connect Wallet'}
              </span>
            </div>
            <span className="text-muted-foreground">→</span>
          </Card>
        </Link>
        
        <Link href="/settings">
          <Card className="p-4 flex items-center justify-between hover:bg-accent transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="text-xl">⚙️</div>
              <span className="font-semibold">Settings</span>
            </div>
            <span className="text-muted-foreground">→</span>
          </Card>
        </Link>
        
        <Link href="/how-to-play">
          <Card className="p-4 flex items-center justify-between hover:bg-accent transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="text-xl">❓</div>
              <span className="font-semibold">How to Play</span>
            </div>
            <span className="text-muted-foreground">→</span>
          </Card>
        </Link>
      </div>
    </div>
  );
}

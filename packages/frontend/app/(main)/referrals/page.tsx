'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy, Share2, Users, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUserStore } from '@/lib/stores/useUserStore';
import { useUIStore } from '@/lib/stores/useUIStore';
import { useTelegram } from '@/lib/hooks/useTelegram';
import { getReferralStats, getReferralList } from '@/lib/api/referrals';
import { formatPoints, formatTimeAgo } from '@streakfarm/shared';

export default function ReferralsPage() {
  const { user } = useUserStore();
  const { showToast } = useUIStore();
  const { webApp, haptic } = useTelegram();
  
  const { data: stats } = useQuery({
    queryKey: ['referral-stats'],
    queryFn: getReferralStats,
    enabled: !!user,
  });
  
  const { data: referrals = [] } = useQuery({
    queryKey: ['referral-list'],
    queryFn: () => getReferralList(50),
    enabled: !!user,
  });
  
  const referralUrl = `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/app?startapp=${user?.ref_code}`;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      showToast('Link copied!', 'success');
      haptic?.notificationOccurred('success');
    } catch (error) {
      showToast('Failed to copy', 'error');
    }
  };
  
  const handleShare = () => {
    if (!webApp) return;
    
    const text = `🌾 Join me on StreakFarm! Build streaks, earn points, and win rewards!\n\nUse my link and we both get bonuses! 🎁`;
    
    webApp.openTelegramLink(
      `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(text)}`
    );
    
    haptic?.impactOccurred('medium');
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Referrals</h1>
        <p className="text-muted-foreground">
          Earn 10% of your friends' lifetime points
        </p>
      </div>
      
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <Users className="w-8 h-8 mb-2 text-primary" />
            <p className="text-2xl font-bold">{stats.total_referrals}</p>
            <p className="text-xs text-muted-foreground">Total Referrals</p>
          </Card>
          
          <Card className="p-4">
            <TrendingUp className="w-8 h-8 mb-2 text-green-500" />
            <p className="text-2xl font-bold">{formatPoints(stats.total_earned)}</p>
            <p className="text-xs text-muted-foreground">Points Earned</p>
          </Card>
        </div>
      )}
      
      {/* Referral Link */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Your Referral Link</h3>
        
        <div className="bg-muted rounded-lg p-3 mb-4 break-all text-sm font-mono">
          {referralUrl}
        </div>
        
        <div className="flex gap-3">
          <Button onClick={handleCopy} variant="outline" className="flex-1">
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
          <Button onClick={handleShare} className="flex-1">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </Card>
      
      {/* Commission Info */}
      <Card className="p-4 bg-primary/5">
        <h4 className="font-semibold mb-2">How it works</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• You get <strong className="text-foreground">10%</strong> of all points your referral earns</li>
          <li>• Commission rate increases with active referrals</li>
          <li>• Earn bonus points at milestones (10, 50, 100+ referrals)</li>
          <li>• Unlimited referrals allowed</li>
        </ul>
      </Card>
      
      {/* Referral List */}
      {referrals.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Your Referrals ({referrals.length})</h3>
          
          {referrals.map((referral: any) => (
            <Card key={referral.id} className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {(referral.referred_user?.username || 'U').substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {referral.referred_user?.username || referral.referred_user?.first_name || 'Anonymous'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Joined {formatTimeAgo(new Date(referral.created_at))}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold text-sm">
                    {formatPoints(referral.total_earned_by_referrer)}
                  </p>
                  <p className="text-xs text-muted-foreground">earned</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {referrals.length === 0 && (
        <Card className="p-8 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">No referrals yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Share your link to start earning passive points
          </p>
          <Button onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Invite Friends
          </Button>
        </Card>
      )}
    </div>
  );
}

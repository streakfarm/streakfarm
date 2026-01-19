import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLeaderboard, LeaderboardType } from '@/hooks/useLeaderboard';
import { useProfile } from '@/hooks/useProfile';
import { Trophy, Medal, Crown, TrendingUp, Users, Gem, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const rankIcons = [
  <Crown key="1" className="w-5 h-5 text-yellow-500" />,
  <Medal key="2" className="w-5 h-5 text-gray-400" />,
  <Medal key="3" className="w-5 h-5 text-amber-600" />,
];

const tabs: { value: LeaderboardType; label: string; icon: React.ReactNode }[] = [
  { value: 'all_time', label: 'All Time', icon: <Trophy className="w-4 h-4" /> },
  { value: 'weekly', label: 'Weekly', icon: <TrendingUp className="w-4 h-4" /> },
  { value: 'badges', label: 'Badges', icon: <Gem className="w-4 h-4" /> },
  { value: 'referrals', label: 'Referrals', icon: <Users className="w-4 h-4" /> },
];

export function LeaderboardView() {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('all_time');
  const { leaderboard, userRank, isLoading } = useLeaderboard(activeTab, 50);
  const { profile } = useProfile();

  const getDisplayValue = (entry: typeof leaderboard[0]) => {
    switch (activeTab) {
      case 'weekly':
        return entry.points_weekly?.toLocaleString() || '0';
      case 'badges':
        return entry.badge_count?.toString() || '0';
      case 'referrals':
        return entry.referral_count?.toString() || '0';
      default:
        return entry.points_all_time?.toLocaleString() || '0';
    }
  };

  const getValueLabel = () => {
    switch (activeTab) {
      case 'weekly':
        return 'pts this week';
      case 'badges':
        return 'badges';
      case 'referrals':
        return 'referrals';
      default:
        return 'total pts';
    }
  };

  const getUserRankValue = () => {
    if (!userRank) return null;
    switch (activeTab) {
      case 'weekly':
        return userRank.rank_weekly;
      case 'badges':
        return userRank.rank_badges;
      case 'referrals':
        return userRank.rank_referrals;
      default:
        return userRank.rank_all_time;
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LeaderboardType)}>
        <TabsList className="grid grid-cols-4 w-full">
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs px-2">
              <span className="hidden sm:inline-flex items-center gap-1">
                {tab.icon} {tab.label}
              </span>
              <span className="sm:hidden">{tab.icon}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-4">
          {/* User's rank card */}
          {profile && userRank && (
            <Card className="p-4 bg-gradient-to-r from-primary/20 to-accent/20 border-primary/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold">
                    #{getUserRankValue() || '?'}
                  </div>
                  <div>
                    <div className="font-semibold">Your Rank</div>
                    <div className="text-sm text-muted-foreground">
                      {activeTab === 'weekly' ? userRank.points_weekly?.toLocaleString() : 
                       activeTab === 'badges' ? userRank.badge_count : 
                       activeTab === 'referrals' ? userRank.referral_count : 
                       userRank.points_all_time?.toLocaleString()} {getValueLabel()}
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Share
                </Button>
              </div>
            </Card>
          )}

          {/* Top 3 Podium */}
          {!isLoading && leaderboard.length >= 3 && (
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[1, 0, 2].map((podiumIndex) => {
                const entry = leaderboard[podiumIndex];
                if (!entry) return null;
                
                const isFirst = podiumIndex === 0;
                const height = isFirst ? 'h-28' : podiumIndex === 1 ? 'h-24' : 'h-20';
                
                return (
                  <div key={entry.id} className={cn("flex flex-col items-center", isFirst && "order-2")}>
                    <Avatar className={cn(
                      "border-2 mb-2",
                      isFirst ? "w-16 h-16 border-yellow-500" : "w-12 h-12 border-border"
                    )}>
                      <AvatarImage src={entry.profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {(entry.profile?.first_name?.[0] || entry.profile?.username?.[0] || '?').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center mb-2">
                      <div className="font-semibold text-sm truncate max-w-[80px]">
                        {entry.profile?.first_name || entry.profile?.username || 'Anonymous'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getDisplayValue(entry)}
                      </div>
                    </div>
                    <div className={cn(
                      "w-full rounded-t-lg flex items-start justify-center pt-2",
                      height,
                      isFirst 
                        ? "bg-gradient-to-b from-yellow-500/30 to-yellow-500/10" 
                        : podiumIndex === 1
                          ? "bg-gradient-to-b from-gray-400/30 to-gray-400/10"
                          : "bg-gradient-to-b from-amber-600/30 to-amber-600/10"
                    )}>
                      {rankIcons[podiumIndex]}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rest of leaderboard */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.slice(3).map((entry, index) => (
                <Card 
                  key={entry.id} 
                  className={cn(
                    "p-3 flex items-center gap-3 transition-colors",
                    entry.user_id === profile?.id && "bg-primary/10 border-primary/30"
                  )}
                >
                  <div className="w-8 text-center font-semibold text-muted-foreground">
                    {index + 4}
                  </div>
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={entry.profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {(entry.profile?.first_name?.[0] || entry.profile?.username?.[0] || '?').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {entry.profile?.first_name || entry.profile?.username || 'Anonymous'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getDisplayValue(entry)} {getValueLabel()}
                    </div>
                  </div>
                  {entry.user_id === profile?.id && (
                    <div className="text-xs text-primary font-medium">You</div>
                  )}
                </Card>
              ))}

              {leaderboard.length === 0 && (
                <div className="text-center py-12 space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Trophy className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold mb-1">Rankings Update Soon!</p>
                    <p className="text-sm text-muted-foreground">
                      Rankings reset every 24h – start earning now 🔥
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

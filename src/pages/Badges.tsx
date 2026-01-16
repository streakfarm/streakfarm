import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { BadgeCard } from '@/components/badge/BadgeCard';
import { BadgeDetail } from '@/components/badge/BadgeDetail';
import { useBadges, Badge } from '@/hooks/useBadges';
import { useTelegram } from '@/hooks/useTelegram';
import { useTonWalletContext } from '@/hooks/useTonWallet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CATEGORY_CONFIG = {
  all: { label: 'All', emoji: '🏆' },
  streak: { label: 'Streak', emoji: '🔥' },
  achievement: { label: 'Achievement', emoji: '⭐' },
  wallet: { label: 'Wallet', emoji: '👛' },
  special: { label: 'Special', emoji: '✨' },
};

export default function Badges() {
  const { allBadges, ownedBadges, ownedBadgeIds, totalMultiplier, badgeCount, badgesByCategory, isLoading } = useBadges();
  const { hapticFeedback } = useTelegram();
  const { isConnected, connect } = useTonWalletContext();
  const [selectedBadge, setSelectedBadge] = useState<{ badge: Badge; isOwned: boolean; earnedAt?: string } | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const handleBadgeClick = (badge: Badge) => {
    hapticFeedback('selection');
    const owned = ownedBadges.find(b => b.id === badge.id);
    setSelectedBadge({
      badge,
      isOwned: ownedBadgeIds.has(badge.id),
      earnedAt: owned?.earnedAt,
    });
  };

  const getFilteredBadges = () => {
    if (activeTab === 'all') return allBadges;
    return badgesByCategory[activeTab as keyof typeof badgesByCategory] || [];
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-1">🏆 Badge Gallery</h1>
          <p className="text-sm text-muted-foreground">
            Collect badges to increase your multiplier!
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <span className="text-3xl font-bold text-foreground">{badgeCount}</span>
            <p className="text-sm text-muted-foreground">Badges Owned</p>
          </div>
          <div className="bg-primary/10 rounded-xl border border-primary/20 p-4 text-center">
            <span className="text-3xl font-bold text-primary">{totalMultiplier.toFixed(1)}×</span>
            <p className="text-sm text-muted-foreground">Total Multiplier</p>
          </div>
        </div>

        {/* Category tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-5 h-auto">
            {Object.entries(CATEGORY_CONFIG).map(([key, { label, emoji }]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="flex flex-col gap-0.5 py-2 text-xs"
              >
                <span className="text-lg">{emoji}</span>
                <span>{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {/* Owned badges section */}
            {activeTab === 'all' && badgeCount > 0 && (
              <div className="mb-6">
                <h2 className="font-semibold mb-3 flex items-center gap-2">
                  <span>✅ My Badges</span>
                  <span className="text-sm text-muted-foreground">({badgeCount})</span>
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {ownedBadges.map((badge) => (
                    <BadgeCard
                      key={badge.id}
                      badge={badge}
                      isOwned={true}
                      earnedAt={badge.earnedAt}
                      onClick={() => handleBadgeClick(badge)}
                      isWalletConnected={isConnected}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All/Available badges */}
            <div>
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                {activeTab === 'all' ? (
                  <>
                    <span>🔒 Available to Earn</span>
                    <span className="text-sm text-muted-foreground">
                      ({allBadges.length - badgeCount})
                    </span>
                  </>
                ) : (
                  <>
                    <span>{CATEGORY_CONFIG[activeTab as keyof typeof CATEGORY_CONFIG]?.emoji} {CATEGORY_CONFIG[activeTab as keyof typeof CATEGORY_CONFIG]?.label} Badges</span>
                    <span className="text-sm text-muted-foreground">
                      ({getFilteredBadges().length})
                    </span>
                  </>
                )}
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {getFilteredBadges()
                  .filter(badge => activeTab !== 'all' || !ownedBadgeIds.has(badge.id))
                  .map((badge) => (
                    <BadgeCard
                      key={badge.id}
                      badge={badge}
                      isOwned={ownedBadgeIds.has(badge.id)}
                      onClick={() => handleBadgeClick(badge)}
                      isWalletConnected={isConnected}
                    />
                  ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Badge detail modal */}
      {selectedBadge && (
        <BadgeDetail
          badge={selectedBadge.badge}
          isOwned={selectedBadge.isOwned}
          earnedAt={selectedBadge.earnedAt}
          onClose={() => setSelectedBadge(null)}
          isWalletConnected={isConnected}
          onConnectWallet={connect}
        />
      )}
    </AppLayout>
  );
}

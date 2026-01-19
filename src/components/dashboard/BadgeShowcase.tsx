import { Link } from 'react-router-dom';
import { useBadges } from '@/hooks/useBadges';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const RARITY_STYLES = {
  common: 'bg-rarity-common/20 border-rarity-common/50',
  rare: 'bg-rarity-rare/20 border-rarity-rare/50',
  epic: 'bg-rarity-epic/20 border-rarity-epic/50',
  legendary: 'bg-rarity-legendary/20 border-rarity-legendary/50',
  mythic: 'bg-rarity-mythic/20 border-rarity-mythic/50 mythic-glow',
};

export function BadgeShowcase() {
  const { ownedBadges, totalMultiplier, badgeCount } = useBadges();

  // Show up to 5 badges, prioritized by rarity
  const displayBadges = [...ownedBadges]
    .sort((a, b) => {
      const rarityOrder = { mythic: 5, legendary: 4, epic: 3, rare: 2, common: 1 };
      return rarityOrder[b.rarity] - rarityOrder[a.rarity];
    })
    .slice(0, 5);

  return (
    <Link to="/badges" className="block">
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-4 transition-all hover:border-primary/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <span className="font-semibold">My Badges</span>
            <span className="text-sm text-muted-foreground">({badgeCount})</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-primary">
              {totalMultiplier.toFixed(1)}× Total
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {badgeCount > 0 ? (
          <div className="flex items-center gap-2">
            {displayBadges.map((badge) => (
              <div
                key={badge.id}
                className={cn(
                  'w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl transition-transform hover:scale-110',
                  RARITY_STYLES[badge.rarity]
                )}
                title={badge.name}
              >
                {badge.icon_emoji}
              </div>
            ))}
            
            {badgeCount > 5 && (
              <div className="w-12 h-12 rounded-xl bg-muted border-2 border-border flex items-center justify-center text-sm font-medium text-muted-foreground">
                +{badgeCount - 5}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Complete tasks and streaks to earn badges!
          </p>
        )}
      </div>
    </Link>
  );
}

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { BoxCard } from '@/components/box/BoxCard';
import { BoxOpenAnimation } from '@/components/box/BoxOpenAnimation';
import { useBoxes, Box } from '@/hooks/useBoxes';
import { useProfile } from '@/hooks/useProfile';
import { useTelegram } from '@/hooks/useTelegram';
import { Package, Clock, History, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState as useReactState } from 'react';

export default function Boxes() {
  const { boxes, openedBoxes, expiredCount, openBox, availableCount, nextBoxTime, isLoading } = useBoxes();
  const { totalMultiplier } = useProfile();
  const { hapticFeedback } = useTelegram();
  
  const [openingBox, setOpeningBox] = useState<Box | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [openedResult, setOpenedResult] = useState<{ points: number; multiplier: number } | null>(null);
  const [countdown, setCountdown] = useReactState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const diff = nextBoxTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        setCountdown('New box available!');
        return;
      }
      
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextBoxTime]);

  const handleOpenBox = async (box: Box) => {
    hapticFeedback('medium');
    setOpeningBox(box);
    
    try {
      const result = await openBox.mutateAsync(box.id);
      hapticFeedback('success');
      setOpenedResult({
        points: result.final_points || result.base_points,
        multiplier: result.multiplier_applied || 1,
      });
      setShowAnimation(true);
    } catch (error) {
      hapticFeedback('error');
      console.error('Failed to open box:', error);
      setOpeningBox(null);
    }
  };

  const handleAnimationComplete = () => {
    setShowAnimation(false);
    setOpeningBox(null);
    setOpenedResult(null);
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
          <h1 className="text-2xl font-bold mb-1">📦 Mystery Boxes</h1>
          <p className="text-sm text-muted-foreground">
            Open boxes to earn points! New box every hour.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <Package className="w-4 h-4" />
              <span className="text-lg font-bold">{availableCount}</span>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase">Available</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-mono font-bold">{countdown}</span>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase">Next Box</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-destructive mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-lg font-bold">{expiredCount}</span>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase">Missed</p>
          </div>
        </div>

        {/* Multiplier info */}
        <div className="bg-primary/10 rounded-xl border border-primary/20 p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Your current multiplier</p>
          <span className="text-2xl font-bold text-primary">{totalMultiplier.toFixed(1)}×</span>
        </div>

        {/* Available boxes */}
        {boxes.length > 0 ? (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Available Boxes</h2>
            <div className="grid grid-cols-2 gap-4">
              {boxes.map((box) => (
                <BoxCard
                  key={box.id}
                  box={box}
                  onOpen={() => handleOpenBox(box)}
                  isOpening={openingBox?.id === box.id}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Boxes Available</h3>
            <p className="text-sm text-muted-foreground">
              Check back in {countdown} for your next box!
            </p>
          </div>
        )}

        {/* Recent opens */}
        {openedBoxes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold">Recent Opens</h2>
            </div>
            <div className="space-y-2">
              {openedBoxes.slice(0, 5).map((box) => (
                <div
                  key={box.id}
                  className="flex items-center justify-between p-3 bg-card rounded-xl border border-border"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {box.rarity === 'legendary' ? '👑' : box.rarity === 'rare' ? '💎' : '📦'}
                    </span>
                    <div>
                      <p className="text-sm font-medium capitalize">{box.rarity} Box</p>
                      <p className="text-xs text-muted-foreground">
                        {box.opened_at && new Date(box.opened_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    'font-bold',
                    box.rarity === 'legendary' ? 'text-rarity-legendary' :
                    box.rarity === 'rare' ? 'text-rarity-rare' : 'text-foreground'
                  )}>
                    +{(box.final_points || box.base_points).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Open animation overlay */}
      {showAnimation && openingBox && openedResult && (
        <BoxOpenAnimation
          box={openingBox}
          points={openedResult.points}
          multiplier={openedResult.multiplier}
          onComplete={handleAnimationComplete}
        />
      )}
    </AppLayout>
  );
}

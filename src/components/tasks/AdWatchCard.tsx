import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTelegram } from '@/hooks/useTelegram';
import { useProfile } from '@/hooks/useProfile';
import { useTasks } from '@/hooks/useTasks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Play, Coins, Clock, CheckCircle2, Loader2, Tv } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface AdConfig {
  ads_per_day: number;
  points_per_ad: number;
}

export function AdWatchCard() {
  const { hapticFeedback } = useTelegram();
  const { profile, isAuthenticated } = useProfile();
  const { completeTask } = useTasks();
  const queryClient = useQueryClient();
  const [isWatching, setIsWatching] = useState(false);
  const [watchProgress, setWatchProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Get ad config from admin settings (try ad_settings first, then game_config)
  const { data: adConfig } = useQuery({
    queryKey: ['admin-config', 'ad_settings'],
    queryFn: async () => {
      // Try ad_settings first
      const { data: adData } = await supabase
        .from('admin_config')
        .select('value')
        .eq('id', 'ad_settings')
        .single();
      
      if (adData?.value) {
        const value = adData.value as Record<string, unknown>;
        return {
          ads_per_day: (value.ads_per_day as number) || 5,
          points_per_ad: (value.points_per_ad as number) || 50,
        } as AdConfig;
      }

      // Fall back to game_config
      const { data: gameData } = await supabase
        .from('admin_config')
        .select('value')
        .eq('id', 'game_config')
        .single();
      
      if (gameData?.value) {
        const value = gameData.value as Record<string, unknown>;
        return {
          ads_per_day: (value.ads_per_day_limit as number) || 5,
          points_per_ad: (value.ad_points_reward as number) || 50,
        } as AdConfig;
      }

      return { ads_per_day: 5, points_per_ad: 50 } as AdConfig;
    },
  });

  // Get today's ad watch count
  // Get today's ad watch count and last ad time
  const { data: adWatchData } = useQuery({
    queryKey: ['ad-watch-count', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return { count: 0, lastWatchedAt: null };
      
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('task_completions')
        .select('completed_at')
        .eq('user_id', profile.id)
        .eq('task_id', 'watch-ad')
        .gte('completed_at', todayStart.toISOString())
        .order('completed_at', { ascending: false });
      
      if (error) return { count: 0, lastWatchedAt: null };
      return { 
        count: data?.length || 0, 
        lastWatchedAt: data?.[0]?.completed_at || null 
      };
    },
    enabled: !!profile?.id,
  });

  const todayAdCount = adWatchData?.count || 0;
  const lastWatchedAt = adWatchData?.lastWatchedAt;

  // Cooldown calculation (15 minutes between ads)
  const COOLDOWN_MINUTES = 15;
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  useEffect(() => {
    if (!lastWatchedAt) {
      setCooldownRemaining(0);
      return;
    }

    const updateCooldown = () => {
      const lastWatch = new Date(lastWatchedAt);
      const cooldownEnd = new Date(lastWatch.getTime() + COOLDOWN_MINUTES * 60 * 1000);
      const now = new Date();
      const remaining = Math.max(0, cooldownEnd.getTime() - now.getTime());
      setCooldownRemaining(remaining);
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, [lastWatchedAt]);

  const maxAds = adConfig?.ads_per_day || 5;
  const pointsPerAd = adConfig?.points_per_ad || 50;
  const adsRemaining = Math.max(0, maxAds - todayAdCount);
  const isOnCooldown = cooldownRemaining > 0;
  const canWatchAd = adsRemaining > 0 && !isWatching && isAuthenticated && !isOnCooldown;

  const formatCooldown = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Simulate ad watching
  const handleWatchAd = async () => {
    if (!canWatchAd) return;
    
    hapticFeedback('medium');
    setIsWatching(true);
    setWatchProgress(0);
    
    // Simulate ad progress (5 seconds)
    const duration = 5000;
    const interval = 50;
    let elapsed = 0;
    
    const timer = setInterval(() => {
      elapsed += interval;
      setWatchProgress((elapsed / duration) * 100);
      
      if (elapsed >= duration) {
        clearInterval(timer);
        completeAdWatch();
      }
    }, interval);
  };

  const completeAdWatch = async () => {
    setIsLoading(true);
    try {
      await completeTask.mutateAsync({ 
        taskId: 'watch-ad',
        verificationData: { watched_at: new Date().toISOString() }
      });
      
      hapticFeedback('success');
      toast.success(`+${pointsPerAd} points earned!`, {
        icon: '📺',
      });
      
      queryClient.invalidateQueries({ queryKey: ['ad-watch-count'] });
    } catch (error) {
      toast.error('Failed to complete ad reward');
      hapticFeedback('error');
    } finally {
      setIsWatching(false);
      setWatchProgress(0);
      setIsLoading(false);
    }
  };

  const getTimeUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-background border-purple-500/20">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Tv className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Watch Ads</h3>
            <p className="text-sm text-muted-foreground">
              Earn +{pointsPerAd} points per ad
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-1 text-sm">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="font-bold text-yellow-500">
              {pointsPerAd * adsRemaining}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">potential</span>
        </div>
      </div>

      {/* Progress bar showing ads watched today */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Daily Progress</span>
          <span className="font-medium">
            {todayAdCount}/{maxAds} ads watched
          </span>
        </div>
        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(todayAdCount / maxAds) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Ad watching state */}
      <AnimatePresence mode="wait">
        {isWatching ? (
          <motion.div
            key="watching"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-center gap-2 py-4">
              <div className="relative w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Play className="w-8 h-8 text-purple-400 animate-pulse" />
                <svg className="absolute inset-0 w-16 h-16 -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-purple-500/30"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={176}
                    strokeDashoffset={176 - (176 * watchProgress) / 100}
                    className="text-purple-500 transition-all duration-100"
                  />
                </svg>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Watching ad... {Math.round(watchProgress)}%
            </p>
          </motion.div>
        ) : isOnCooldown ? (
          <motion.div
            key="cooldown"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-3"
          >
            <Button
              disabled
              className="w-full bg-muted"
            >
              <Clock className="w-4 h-4 mr-2" />
              Cooldown: {formatCooldown(cooldownRemaining)}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Wait {COOLDOWN_MINUTES} minutes between ads
            </p>
          </motion.div>
        ) : adsRemaining > 0 ? (
          <motion.div
            key="available"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Button
              onClick={handleWatchAd}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Watch Ad ({adsRemaining} remaining)
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="completed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center py-3"
          >
            <div className="flex items-center justify-center gap-2 text-green-500 mb-2">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">All ads watched today!</span>
            </div>
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Resets in {getTimeUntilReset()}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

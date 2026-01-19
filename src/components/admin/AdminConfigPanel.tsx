import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  Loader2,
  PlayCircle,
  Gift,
  Users,
  Wallet,
  Bell
} from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface GameConfig {
  ads_per_day_limit: number;
  ad_points_reward: number;
  referral_bonus_referrer: number;
  referral_bonus_referee: number;
  daily_checkin_base_points: number;
  streak_multiplier_enabled: boolean;
  max_streak_multiplier: number;
  wallet_connect_bonus: number;
  box_cooldown_hours: number;
  maintenance_mode: boolean;
}

const defaultConfig: GameConfig = {
  ads_per_day_limit: 5,
  ad_points_reward: 50,
  referral_bonus_referrer: 500,
  referral_bonus_referee: 100,
  daily_checkin_base_points: 100,
  streak_multiplier_enabled: true,
  max_streak_multiplier: 3.0,
  wallet_connect_bonus: 2000,
  box_cooldown_hours: 4,
  maintenance_mode: false,
};

export function AdminConfigPanel() {
  const { adminConfig, configLoading, updateConfig, getConfig } = useAdmin();
  const [config, setConfig] = useState<GameConfig>(defaultConfig);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const savedConfig = getConfig('game_config');
    if (savedConfig && typeof savedConfig === 'object' && !Array.isArray(savedConfig)) {
      setConfig({ ...defaultConfig, ...(savedConfig as unknown as Partial<GameConfig>) });
    }
  }, [adminConfig, getConfig]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateConfig.mutateAsync({
        id: 'game_config',
        value: config as unknown as import('@/integrations/supabase/types').Json,
      });
      toast.success('Configuration saved successfully');
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Game Configuration</h2>
          <p className="text-sm text-muted-foreground">Manage game settings and limits</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-4">
        {/* Ads Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <PlayCircle className="w-5 h-5 text-primary" />
                Ads Configuration
              </CardTitle>
              <CardDescription>Configure daily ad limits and rewards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ads Per Day Limit</Label>
                  <Input 
                    type="number"
                    value={config.ads_per_day_limit}
                    onChange={(e) => setConfig(prev => ({ ...prev, ads_per_day_limit: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Max ads a user can watch daily</p>
                </div>
                <div>
                  <Label>Points Per Ad</Label>
                  <Input 
                    type="number"
                    value={config.ad_points_reward}
                    onChange={(e) => setConfig(prev => ({ ...prev, ad_points_reward: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Points earned per ad watched</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Referral Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-purple-500" />
                Referral Bonuses
              </CardTitle>
              <CardDescription>Configure referral rewards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Referrer Bonus</Label>
                  <Input 
                    type="number"
                    value={config.referral_bonus_referrer}
                    onChange={(e) => setConfig(prev => ({ ...prev, referral_bonus_referrer: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Points for the person who invites</p>
                </div>
                <div>
                  <Label>Referee Bonus</Label>
                  <Input 
                    type="number"
                    value={config.referral_bonus_referee}
                    onChange={(e) => setConfig(prev => ({ ...prev, referral_bonus_referee: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Points for the invited user</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Daily Rewards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gift className="w-5 h-5 text-green-500" />
                Daily Rewards & Streaks
              </CardTitle>
              <CardDescription>Configure check-in and streak bonuses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Base Check-in Points</Label>
                  <Input 
                    type="number"
                    value={config.daily_checkin_base_points}
                    onChange={(e) => setConfig(prev => ({ ...prev, daily_checkin_base_points: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>Max Streak Multiplier</Label>
                  <Input 
                    type="number"
                    step="0.1"
                    value={config.max_streak_multiplier}
                    onChange={(e) => setConfig(prev => ({ ...prev, max_streak_multiplier: parseFloat(e.target.value) || 1 }))}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <Label>Streak Multiplier Enabled</Label>
                  <p className="text-xs text-muted-foreground">Apply streak bonus to rewards</p>
                </div>
                <Switch 
                  checked={config.streak_multiplier_enabled}
                  onCheckedChange={(v) => setConfig(prev => ({ ...prev, streak_multiplier_enabled: v }))}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Wallet & Boxes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wallet className="w-5 h-5 text-cyan-500" />
                Wallet & Boxes
              </CardTitle>
              <CardDescription>Configure wallet and mystery box settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Wallet Connect Bonus</Label>
                  <Input 
                    type="number"
                    value={config.wallet_connect_bonus}
                    onChange={(e) => setConfig(prev => ({ ...prev, wallet_connect_bonus: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">One-time bonus for connecting wallet</p>
                </div>
                <div>
                  <Label>Box Cooldown (hours)</Label>
                  <Input 
                    type="number"
                    value={config.box_cooldown_hours}
                    onChange={(e) => setConfig(prev => ({ ...prev, box_cooldown_hours: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Time between box generations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* System Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className={config.maintenance_mode ? 'border-yellow-500/50' : ''}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="w-5 h-5 text-yellow-500" />
                System Settings
              </CardTitle>
              <CardDescription>Critical system configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                <div>
                  <Label className="text-yellow-500">Maintenance Mode</Label>
                  <p className="text-xs text-muted-foreground">Disable all user actions temporarily</p>
                </div>
                <Switch 
                  checked={config.maintenance_mode}
                  onCheckedChange={(v) => setConfig(prev => ({ ...prev, maintenance_mode: v }))}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

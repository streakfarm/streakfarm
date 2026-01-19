import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  Loader2,
  Package,
  Zap,
  Clock,
  Sparkles,
  Play
} from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface BoxConfig {
  boxes_per_hour: number;
  box_expiry_hours: number;
  max_boxes_per_day: number;
  rarity_weights: {
    common: number;
    rare: number;
    legendary: number;
  };
  point_ranges: {
    common: { min: number; max: number };
    rare: { min: number; max: number };
    legendary: { min: number; max: number };
  };
}

const defaultBoxConfig: BoxConfig = {
  boxes_per_hour: 1,
  box_expiry_hours: 3,
  max_boxes_per_day: 24,
  rarity_weights: {
    common: 85,
    rare: 14,
    legendary: 1,
  },
  point_ranges: {
    common: { min: 50, max: 1000 },
    rare: { min: 1000, max: 5000 },
    legendary: { min: 5000, max: 10000 },
  },
};

export function AdminBoxPanel() {
  const { adminConfig, configLoading, updateConfig, getConfig } = useAdmin();
  const [config, setConfig] = useState<BoxConfig>(defaultBoxConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpiring, setIsExpiring] = useState(false);

  useEffect(() => {
    const savedConfig = getConfig('box_settings');
    if (savedConfig && typeof savedConfig === 'object' && !Array.isArray(savedConfig)) {
      setConfig({ ...defaultBoxConfig, ...(savedConfig as unknown as Partial<BoxConfig>) });
    }
  }, [adminConfig, getConfig]);

  const handleSave = async () => {
    // Validate rarity weights sum to 100
    const totalWeight = config.rarity_weights.common + config.rarity_weights.rare + config.rarity_weights.legendary;
    if (Math.abs(totalWeight - 100) > 0.01) {
      toast.error(`Rarity weights must sum to 100 (currently ${totalWeight})`);
      return;
    }

    setIsSaving(true);
    try {
      await updateConfig.mutateAsync({
        id: 'box_settings',
        value: config as unknown as import('@/integrations/supabase/types').Json,
      });
      toast.success('Box configuration saved successfully');
    } catch (error) {
      toast.error('Failed to save box configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateBoxes = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-boxes');
      if (error) throw error;
      toast.success(`Generated ${data.boxes_created} boxes for ${data.active_users} users`);
    } catch (error) {
      toast.error('Failed to generate boxes');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExpireBoxes = async () => {
    setIsExpiring(true);
    try {
      const { data, error } = await supabase.functions.invoke('expire-boxes');
      if (error) throw error;
      toast.success(`Expired ${data.expired_count} boxes`);
    } catch (error) {
      toast.error('Failed to expire boxes');
      console.error(error);
    } finally {
      setIsExpiring(false);
    }
  };

  const updateRarity = (type: 'common' | 'rare' | 'legendary', value: number) => {
    setConfig(prev => ({
      ...prev,
      rarity_weights: {
        ...prev.rarity_weights,
        [type]: value,
      },
    }));
  };

  const updatePointRange = (type: 'common' | 'rare' | 'legendary', field: 'min' | 'max', value: number) => {
    setConfig(prev => ({
      ...prev,
      point_ranges: {
        ...prev.point_ranges,
        [type]: {
          ...prev.point_ranges[type],
          [field]: value,
        },
      },
    }));
  };

  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const totalWeight = config.rarity_weights.common + config.rarity_weights.rare + config.rarity_weights.legendary;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Mystery Box Settings</h2>
          <p className="text-sm text-muted-foreground">Configure box generation and rewards</p>
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
        {/* Manual Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5 text-primary" />
                Manual Controls
              </CardTitle>
              <CardDescription>Run box generation/expiry manually</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button 
                  onClick={handleGenerateBoxes} 
                  disabled={isGenerating}
                  className="flex-1 gap-2"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Generate Boxes Now
                </Button>
                <Button 
                  onClick={handleExpireBoxes} 
                  disabled={isExpiring}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  {isExpiring ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  Expire Old Boxes
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                💡 Set up a cron job to call these functions hourly for automatic box generation
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Generation Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="w-5 h-5 text-blue-500" />
                Generation Settings
              </CardTitle>
              <CardDescription>Control how boxes are created</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Boxes Per Hour</Label>
                  <Input 
                    type="number"
                    min={1}
                    max={5}
                    value={config.boxes_per_hour}
                    onChange={(e) => setConfig(prev => ({ ...prev, boxes_per_hour: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div>
                  <Label>Expiry Hours</Label>
                  <Input 
                    type="number"
                    min={1}
                    max={24}
                    value={config.box_expiry_hours}
                    onChange={(e) => setConfig(prev => ({ ...prev, box_expiry_hours: parseInt(e.target.value) || 3 }))}
                  />
                </div>
                <div>
                  <Label>Max Per Day</Label>
                  <Input 
                    type="number"
                    min={1}
                    max={48}
                    value={config.max_boxes_per_day}
                    onChange={(e) => setConfig(prev => ({ ...prev, max_boxes_per_day: parseInt(e.target.value) || 24 }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Rarity Weights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Rarity Distribution
                <span className={`ml-auto text-sm font-normal ${Math.abs(totalWeight - 100) > 0.01 ? 'text-destructive' : 'text-green-500'}`}>
                  Total: {totalWeight}%
                </span>
              </CardTitle>
              <CardDescription>Probability weights for each rarity (must sum to 100)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Common */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    📦 Common
                  </Label>
                  <span className="text-sm font-mono">{config.rarity_weights.common}%</span>
                </div>
                <Slider 
                  value={[config.rarity_weights.common]}
                  min={50}
                  max={95}
                  step={1}
                  onValueChange={([v]) => updateRarity('common', v)}
                  className="w-full"
                />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <Label className="text-xs">Min Points</Label>
                    <Input 
                      type="number"
                      value={config.point_ranges.common.min}
                      onChange={(e) => updatePointRange('common', 'min', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Max Points</Label>
                    <Input 
                      type="number"
                      value={config.point_ranges.common.max}
                      onChange={(e) => updatePointRange('common', 'max', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              {/* Rare */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    💎 Rare
                  </Label>
                  <span className="text-sm font-mono text-blue-400">{config.rarity_weights.rare}%</span>
                </div>
                <Slider 
                  value={[config.rarity_weights.rare]}
                  min={1}
                  max={30}
                  step={1}
                  onValueChange={([v]) => updateRarity('rare', v)}
                  className="w-full"
                />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <Label className="text-xs">Min Points</Label>
                    <Input 
                      type="number"
                      value={config.point_ranges.rare.min}
                      onChange={(e) => updatePointRange('rare', 'min', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Max Points</Label>
                    <Input 
                      type="number"
                      value={config.point_ranges.rare.max}
                      onChange={(e) => updatePointRange('rare', 'max', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              {/* Legendary */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    👑 Legendary
                  </Label>
                  <span className="text-sm font-mono text-yellow-400">{config.rarity_weights.legendary}%</span>
                </div>
                <Slider 
                  value={[config.rarity_weights.legendary]}
                  min={0.1}
                  max={10}
                  step={0.1}
                  onValueChange={([v]) => updateRarity('legendary', v)}
                  className="w-full"
                />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <Label className="text-xs">Min Points</Label>
                    <Input 
                      type="number"
                      value={config.point_ranges.legendary.min}
                      onChange={(e) => updatePointRange('legendary', 'min', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Max Points</Label>
                    <Input 
                      type="number"
                      value={config.point_ranges.legendary.max}
                      onChange={(e) => updatePointRange('legendary', 'max', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

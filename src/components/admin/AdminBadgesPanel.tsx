import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2,
  Sparkles,
  Users
} from 'lucide-react';
import { useAdmin, Badge } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge as UIBadge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const BADGE_CATEGORIES = ['streak', 'achievement', 'wallet', 'special'] as const;
const BADGE_RARITIES = ['common', 'rare', 'epic', 'legendary', 'mythic'] as const;
const EMOJIS = ['🔥', '⭐', '💎', '🏆', '👑', '🎖️', '🌟', '💰', '🎯', '🚀', '💪', '🎮'];

const defaultBadge: Omit<Badge, 'current_supply'> = {
  id: '',
  name: '',
  description: '',
  icon_emoji: '🏆',
  image_url: null,
  badge_category: 'achievement',
  multiplier: 1.0,
  rarity: 'common',
  requirements: null,
  max_supply: null,
  is_active: true,
  sort_order: 0,
  can_convert_to_nft: true,
  available_from: null,
  available_until: null,
};

export function AdminBadgesPanel() {
  const { allBadges, badgesLoading, createBadge, updateBadge, deleteBadge } = useAdmin();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [badgeForm, setBadgeForm] = useState<Omit<Badge, 'current_supply'>>(defaultBadge);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleOpenDialog = (badge?: Badge) => {
    if (badge) {
      setEditingBadge(badge);
      const { current_supply, ...rest } = badge;
      setBadgeForm(rest);
    } else {
      setEditingBadge(null);
      setBadgeForm({ ...defaultBadge, id: `badge_${Date.now()}` });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingBadge) {
        await updateBadge.mutateAsync(badgeForm);
        toast.success('Badge updated successfully');
      } else {
        await createBadge.mutateAsync(badgeForm);
        toast.success('Badge created successfully');
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save badge');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteBadge.mutateAsync(deleteId);
      toast.success('Badge deleted');
      setDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete badge');
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      case 'rare': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'epic': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      case 'legendary': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'mythic': return 'bg-pink-500/20 text-pink-400 border-pink-500/50';
      default: return 'bg-muted';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'streak': return 'bg-orange-500/20 text-orange-400';
      case 'achievement': return 'bg-green-500/20 text-green-400';
      case 'wallet': return 'bg-cyan-500/20 text-cyan-400';
      case 'special': return 'bg-pink-500/20 text-pink-400';
      default: return 'bg-muted';
    }
  };

  if (badgesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Badges Management</h2>
          <p className="text-sm text-muted-foreground">{allBadges.length} total badges</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Badge
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBadge ? 'Edit Badge' : 'Create Badge'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1">
                  <Label>Icon</Label>
                  <Select 
                    value={badgeForm.icon_emoji} 
                    onValueChange={(v) => setBadgeForm(prev => ({ ...prev, icon_emoji: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMOJIS.map(emoji => (
                        <SelectItem key={emoji} value={emoji}>{emoji}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Label>Name</Label>
                  <Input 
                    value={badgeForm.name}
                    onChange={(e) => setBadgeForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Badge name"
                  />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea 
                  value={badgeForm.description || ''}
                  onChange={(e) => setBadgeForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Badge description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select 
                    value={badgeForm.badge_category} 
                    onValueChange={(v: typeof BADGE_CATEGORIES[number]) => setBadgeForm(prev => ({ ...prev, badge_category: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BADGE_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Rarity</Label>
                  <Select 
                    value={badgeForm.rarity} 
                    onValueChange={(v: typeof BADGE_RARITIES[number]) => setBadgeForm(prev => ({ ...prev, rarity: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BADGE_RARITIES.map(rarity => (
                        <SelectItem key={rarity} value={rarity} className="capitalize">{rarity}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Multiplier</Label>
                  <Input 
                    type="number"
                    step="0.1"
                    value={badgeForm.multiplier}
                    onChange={(e) => setBadgeForm(prev => ({ ...prev, multiplier: parseFloat(e.target.value) || 1 }))}
                  />
                </div>
                <div>
                  <Label>Max Supply (optional)</Label>
                  <Input 
                    type="number"
                    value={badgeForm.max_supply || ''}
                    onChange={(e) => setBadgeForm(prev => ({ ...prev, max_supply: parseInt(e.target.value) || null }))}
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sort Order</Label>
                  <Input 
                    type="number"
                    value={badgeForm.sort_order}
                    onChange={(e) => setBadgeForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>Image URL (optional)</Label>
                  <Input 
                    value={badgeForm.image_url || ''}
                    onChange={(e) => setBadgeForm(prev => ({ ...prev, image_url: e.target.value || null }))}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch 
                    checked={badgeForm.is_active}
                    onCheckedChange={(v) => setBadgeForm(prev => ({ ...prev, is_active: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Can Convert to NFT</Label>
                  <Switch 
                    checked={badgeForm.can_convert_to_nft || false}
                    onCheckedChange={(v) => setBadgeForm(prev => ({ ...prev, can_convert_to_nft: v }))}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createBadge.isPending || updateBadge.isPending}
                >
                  {(createBadge.isPending || updateBadge.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingBadge ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AnimatePresence>
          {allBadges.map((badge, index) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-card border rounded-xl p-4 relative ${
                badge.is_active ? 'border-border' : 'border-destructive/30 opacity-60'
              }`}
            >
              {!badge.is_active && (
                <div className="absolute top-2 right-2">
                  <UIBadge variant="destructive" className="text-xs">Inactive</UIBadge>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${getRarityColor(badge.rarity)}`}>
                  {badge.icon_emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{badge.name}</h3>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <UIBadge className={getRarityColor(badge.rarity)}>
                      {badge.rarity}
                    </UIBadge>
                    <UIBadge className={getCategoryColor(badge.badge_category)}>
                      {badge.badge_category}
                    </UIBadge>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-primary" />
                      {badge.multiplier}x
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {badge.current_supply}/{badge.max_supply || '∞'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1 mt-3 pt-3 border-t border-border">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="flex-1"
                  onClick={() => handleOpenDialog(badge)}
                >
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteId(badge.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {allBadges.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No badges yet. Create your first badge!
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Badge?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the badge
              and remove it from all users who have earned it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

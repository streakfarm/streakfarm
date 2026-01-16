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

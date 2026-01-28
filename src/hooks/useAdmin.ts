import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import type { Json } from '@/integrations/supabase/types';

export interface AdminConfig {
  id: string;
  value: Json;
  description: string | null;
  updated_at: string | null;
  updated_by: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  icon_emoji: string | null;
  task_type: 'daily' | 'social' | 'referral' | 'wallet' | 'onetime';
  status: 'active' | 'inactive' | 'expired';
  points_reward: number;
  is_repeatable: boolean;
  repeat_interval_hours: number | null;
  max_completions: number | null;
  requires_wallet: boolean;
  verification_type: string | null;
  requirements: Json | null;
  available_from: string | null;
  available_until: string | null;
  sort_order: number;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon_emoji: string;
  image_url: string | null;
  badge_category: 'streak' | 'achievement' | 'wallet' | 'special';
  multiplier: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  requirements: Json | null;
  max_supply: number | null;
  current_supply: number;
  is_active: boolean;
  sort_order: number;
  can_convert_to_nft: boolean;
  available_from: string | null;
  available_until: string | null;
}

export function useAdmin() {
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  // Check if current user is admin
  const { data: isAdmin, isLoading: isCheckingAdmin } = useQuery({
    queryKey: ['is-admin', profile?.user_id],
    queryFn: async () => {
      if (!profile?.user_id) return false;
      
      const { data, error } = await supabase
        .rpc('has_role', { 
          _user_id: profile.user_id, 
          _role: 'admin' 
        });
      
      if (error) {
        console.error('Error checking admin role:', error);
        return false;
      }
      return data as boolean;
    },
    enabled: !!profile?.user_id,
  });

  // Fetch all tasks (including inactive)
  const { data: allTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['admin-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as Task[];
    },
    enabled: isAdmin === true,
  });

  // Fetch all badges (including inactive)
  const { data: allBadges = [], isLoading: badgesLoading } = useQuery({
    queryKey: ['admin-badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as Badge[];
    },
    enabled: isAdmin === true,
  });

  // Fetch admin config
  const { data: adminConfig = [], isLoading: configLoading } = useQuery({
    queryKey: ['admin-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_config')
        .select('*');
      
      if (error) throw error;
      return data as AdminConfig[];
    },
    enabled: isAdmin === true,
  });

  // Get specific config value
  const getConfig = (key: string): Json | undefined => {
    const config = adminConfig.find(c => c.id === key);
    return config?.value;
  };

  // Mutations
  const createTask = useMutation({
    mutationFn: async (task: Omit<Task, 'created_at'>) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          id: task.id,
          title: task.title,
          description: task.description,
          icon_emoji: task.icon_emoji,
          task_type: task.task_type,
          status: task.status,
          points_reward: task.points_reward,
          is_repeatable: task.is_repeatable,
          repeat_interval_hours: task.repeat_interval_hours,
          max_completions: task.max_completions,
          requires_wallet: task.requires_wallet,
          verification_type: task.verification_type,
          requirements: task.requirements,
          available_from: task.available_from,
          available_until: task.available_until,
          sort_order: task.sort_order,
        })
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...(updates.title !== undefined && { title: updates.title }),
          ...(updates.description !== undefined && { description: updates.description }),
          ...(updates.icon_emoji !== undefined && { icon_emoji: updates.icon_emoji }),
          ...(updates.task_type !== undefined && { task_type: updates.task_type }),
          ...(updates.status !== undefined && { status: updates.status }),
          ...(updates.points_reward !== undefined && { points_reward: updates.points_reward }),
          ...(updates.is_repeatable !== undefined && { is_repeatable: updates.is_repeatable }),
          ...(updates.repeat_interval_hours !== undefined && { repeat_interval_hours: updates.repeat_interval_hours }),
          ...(updates.max_completions !== undefined && { max_completions: updates.max_completions }),
          ...(updates.requires_wallet !== undefined && { requires_wallet: updates.requires_wallet }),
          ...(updates.verification_type !== undefined && { verification_type: updates.verification_type }),
          ...(updates.requirements !== undefined && { requirements: updates.requirements }),
          ...(updates.available_from !== undefined && { available_from: updates.available_from }),
          ...(updates.available_until !== undefined && { available_until: updates.available_until }),
          ...(updates.sort_order !== undefined && { sort_order: updates.sort_order }),
        })
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const createBadge = useMutation({
    mutationFn: async (badge: Omit<Badge, 'current_supply'>) => {
      const { data, error } = await supabase
        .from('badges')
        .insert({
          id: badge.id,
          name: badge.name,
          description: badge.description,
          icon_emoji: badge.icon_emoji,
          image_url: badge.image_url,
          badge_category: badge.badge_category,
          multiplier: badge.multiplier,
          rarity: badge.rarity,
          requirements: badge.requirements,
          max_supply: badge.max_supply,
          is_active: badge.is_active,
          sort_order: badge.sort_order,
          can_convert_to_nft: badge.can_convert_to_nft,
          available_from: badge.available_from,
          available_until: badge.available_until,
        })
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
      queryClient.invalidateQueries({ queryKey: ['badges'] });
    },
  });

  const updateBadge = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Badge> & { id: string }) => {
      const { data, error } = await supabase
        .from('badges')
        .update({
          ...(updates.name !== undefined && { name: updates.name }),
          ...(updates.description !== undefined && { description: updates.description }),
          ...(updates.icon_emoji !== undefined && { icon_emoji: updates.icon_emoji }),
          ...(updates.image_url !== undefined && { image_url: updates.image_url }),
          ...(updates.badge_category !== undefined && { badge_category: updates.badge_category }),
          ...(updates.multiplier !== undefined && { multiplier: updates.multiplier }),
          ...(updates.rarity !== undefined && { rarity: updates.rarity }),
          ...(updates.requirements !== undefined && { requirements: updates.requirements }),
          ...(updates.max_supply !== undefined && { max_supply: updates.max_supply }),
          ...(updates.is_active !== undefined && { is_active: updates.is_active }),
          ...(updates.sort_order !== undefined && { sort_order: updates.sort_order }),
          ...(updates.can_convert_to_nft !== undefined && { can_convert_to_nft: updates.can_convert_to_nft }),
          ...(updates.available_from !== undefined && { available_from: updates.available_from }),
          ...(updates.available_until !== undefined && { available_until: updates.available_until }),
        })
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
      queryClient.invalidateQueries({ queryKey: ['badges'] });
    },
  });

  const deleteBadge = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('badges')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
      queryClient.invalidateQueries({ queryKey: ['badges'] });
    },
  });

  const updateConfig = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: Json }) => {
      const { data, error } = await supabase
        .from('admin_config')
        .upsert({ 
          id, 
          value,
          updated_at: new Date().toISOString(),
          updated_by: profile?.id 
        })
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-config'] });
    },
  });

  // Award badge to user
  const awardBadge = useMutation({
    mutationFn: async ({ userId, badgeId }: { userId: string; badgeId: string }) => {
      const { data, error } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badgeId,
        })
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-badges'] });
    },
  });

  return {
    isAdmin,
    isCheckingAdmin,
    allTasks,
    allBadges,
    adminConfig,
    getConfig,
    tasksLoading,
    badgesLoading,
    configLoading,
    createTask,
    updateTask,
    deleteTask,
    createBadge,
    updateBadge,
    deleteBadge,
    updateConfig,
    awardBadge,
  };
}

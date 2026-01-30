import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  icon_emoji: string | null;
  task_type: 'daily' | 'social' | 'referral' | 'wallet' | 'onetime';
  points_reward: number;
  is_repeatable: boolean | null;
  repeat_interval_hours: number | null;
  max_completions: number | null;
  requires_wallet: boolean | null;
  status: 'active' | 'inactive' | 'expired' | null;
  available_from: string | null;
  available_until: string | null;
  sort_order: number | null;
}

export interface TaskCompletion {
  id: string;
  task_id: string;
  user_id: string;
  completed_at: string | null;
  points_awarded: number;
  is_verified: boolean | null;
}

export function useTasks() {
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'active')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as Task[];
    },
  });

  const { data: completions = [], isLoading: completionsLoading } = useQuery({
    queryKey: ['task-completions', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('task_completions')
        .select('*')
        .eq('user_id', profile.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return data as TaskCompletion[];
    },
    enabled: !!profile?.id,
  });

  const completeTask = useMutation({
    mutationFn: async ({ taskId, verificationData }: { taskId: string; verificationData?: Record<string, unknown> }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/complete-task`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ taskId, verificationData }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete task');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-completions'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const dailyCheckin = useMutation({
    mutationFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-checkin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({}),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to check in');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['badges'] });
    },
  });

  // Helper to check task completion status
  const getTaskStatus = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    const taskCompletions = completions.filter(c => c.task_id === taskId);

    if (!task) return { completed: false, canComplete: false, nextAvailable: null };

    const completionCount = taskCompletions.length;

    // Check max completions
    if (task.max_completions && completionCount >= task.max_completions) {
      return { completed: true, canComplete: false, nextAvailable: null };
    }

    // Non-repeatable and already completed
    if (!task.is_repeatable && completionCount > 0) {
      return { completed: true, canComplete: false, nextAvailable: null };
    }

    // Check repeat interval
    if (task.is_repeatable && task.repeat_interval_hours && taskCompletions.length > 0) {
      const lastCompletion = new Date(taskCompletions[0].completed_at!);
      const nextAvailable = new Date(lastCompletion.getTime() + task.repeat_interval_hours * 60 * 60 * 1000);
      if (new Date() < nextAvailable) {
        return { completed: false, canComplete: false, nextAvailable };
      }
    }

    return { completed: false, canComplete: true, nextAvailable: null };
  };

  // Group tasks by type
  const tasksByType = {
    daily: tasks.filter(t => t.task_type === 'daily'),
    social: tasks.filter(t => t.task_type === 'social'),
    referral: tasks.filter(t => t.task_type === 'referral'),
    wallet: tasks.filter(t => t.task_type === 'wallet'),
    onetime: tasks.filter(t => t.task_type === 'onetime'),
  };

  // Set of completed task IDs for quick lookup
  const completedTaskIds = new Set(
    tasks
      .filter(t => {
        const status = getTaskStatus(t.id);
        return status.completed;
      })
      .map(t => t.id)
  );

  return {
    tasks,
    tasksByType,
    completions,
    completedTaskIds,
    isLoading: tasksLoading || completionsLoading,
    completeTask,
    dailyCheckin,
    getTaskStatus,
  };
}

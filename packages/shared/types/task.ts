export type TaskType = 'social' | 'invite' | 'watch_ad' | 'daily' | 'wallet' | 'custom';
export type TaskStatus = 'pending' | 'verifying' | 'completed' | 'failed';

export interface Task {
  id: string;
  title: string;
  description: string;
  task_type: TaskType;
  points: number;
  icon_emoji: string;
  action_url: string | null;
  requires_wallet: boolean;
  is_repeatable: boolean;
  repeat_interval_hours: number | null;
  max_completions: number | null;
  verification_type: 'auto' | 'manual' | 'api';
  verification_config: Record<string, any>;
  is_active: boolean;
  available_from: Date | null;
  available_until: Date | null;
  display_order: number;
  created_at: Date;
}

export interface TaskCompletion {
  id: string;
  user_id: string;
  task_id: string;
  status: TaskStatus;
  points_awarded: number;
  completed_at: Date | null;
  verification_data: Record<string, any> | null;
  created_at: Date;
  task?: Task;
}

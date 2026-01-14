export enum BoxType {
  HOURLY = 'hourly',
  DAILY_BONUS = 'daily_bonus',
  STREAK_MILESTONE = 'streak_milestone',
  REFERRAL_REWARD = 'referral_reward',
  TASK_COMPLETION = 'task_completion',
}

export interface Box {
  id: string;
  user_id: string;
  type: BoxType;
  
  // Rewards
  points_min: number;
  points_max: number;
  points_awarded: number | null;
  
  // State
  is_opened: boolean;
  opened_at: Date | null;
  
  // Metadata
  multiplier_applied: number;
  special_reward: string | null;
  
  created_at: Date;
  expires_at: Date | null;
}

export interface BoxConfig {
  type: BoxType;
  points_min: number;
  points_max: number;
  cooldown_minutes: number;
  max_per_day: number;
  requires_streak?: number;
}

export interface BoxOpenResult {
  box_id: string;
  points_awarded: number;
  multiplier_applied: number;
  total_points: number;
  new_user_total: number;
  special_reward: string | null;
  animation: string;
}

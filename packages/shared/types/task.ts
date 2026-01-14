export enum TaskType {
  SOCIAL_FOLLOW = 'social_follow',
  SOCIAL_SHARE = 'social_share',
  SOCIAL_RETWEET = 'social_retweet',
  SOCIAL_JOIN = 'social_join',
  WALLET_CONNECT = 'wallet_connect',
  REFERRAL = 'referral',
  DAILY_CHECKIN = 'daily_checkin',
  WATCH_AD = 'watch_ad',
  CUSTOM = 'custom',
}

export enum TaskStatus {
  AVAILABLE = 'available',
  IN_PROGRESS = 'in_progress',
  PENDING_VERIFICATION = 'pending_verification',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  
  // Rewards
  points_reward: number;
  box_reward: boolean;
  
  // Requirements
  action_url: string | null;
  verification_type: string;
  
  // Constraints
  is_repeatable: boolean;
  cooldown_hours: number | null;
  max_completions: number | null;
  
  // Visibility
  is_active: boolean;
  start_date: Date | null;
  end_date: Date | null;
  
  // Metadata
  icon: string;
  priority: number;
  total_completions: number;
  
  created_at: Date;
  updated_at: Date;
}

export interface UserTask {
  id: string;
  user_id: string;
  task_id: string;
  
  status: TaskStatus;
  completions_count: number;
  
  started_at: Date | null;
  completed_at: Date | null;
  next_available_at: Date | null;
  
  created_at: Date;
  updated_at: Date;
  
  // Joined data
  task?: Task;
}

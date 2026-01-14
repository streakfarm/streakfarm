export enum BadgeCategory {
  STREAK = 'streak',
  POINTS = 'points',
  BOXES = 'boxes',
  TASKS = 'tasks',
  REFERRALS = 'referrals',
  SPECIAL = 'special',
}

export enum BadgeRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  
  // Unlock requirements
  requirement_type: string;
  requirement_value: number;
  
  // Rewards
  points_reward: number;
  multiplier_bonus: number;
  
  // Visual
  icon_url: string;
  color: string;
  
  // Meta
  total_earned: number;
  is_active: boolean;
  
  created_at: Date;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  
  // Progress
  progress_current: number;
  progress_required: number;
  is_unlocked: boolean;
  
  // Metadata
  unlocked_at: Date | null;
  created_at: Date;
  
  // Joined data
  badge?: Badge;
}

export interface BadgeProgress {
  badge_id: string;
  badge_name: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  progress_current: number;
  progress_required: number;
  progress_percentage: number;
  is_unlocked: boolean;
  icon_url: string;
}

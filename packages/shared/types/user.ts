export interface User {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string;
  last_name: string | null;
  photo_url: string | null;
  language_code: string | null;
  
  // Points & Streaks
  total_points: number;
  current_streak: number;
  longest_streak: number;
  last_checkin: Date | null;
  
  // Multipliers
  base_multiplier: number;
  badge_multiplier: number;
  total_multiplier: number;
  
  // Stats
  total_boxes_opened: number;
  total_tasks_completed: number;
  total_referrals: number;
  
  // Wallet
  wallet_address: string | null;
  wallet_connected: boolean;
  
  // Meta
  is_early_adopter: boolean;
  is_founding_member: boolean;
  user_number: number;
  
  created_at: Date;
  updated_at: Date;
}

export interface UserStats {
  total_users: number;
  active_today: number;
  active_this_week: number;
  total_points_distributed: number;
  total_boxes_opened: number;
  average_streak: number;
}

export interface UserRank {
  user_id: string;
  username: string | null;
  first_name: string;
  photo_url: string | null;
  total_points: number;
  current_streak: number;
  rank: number;
}

export interface User {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  language_code: string;
  raw_points: number;
  streak_current: number;
  streak_best: number;
  last_checkin: Date | null;
  total_boxes_opened: number;
  total_tasks_completed: number;
  total_referrals: number;
  wallet_address: string | null;
  wallet_type: string | null;
  wallet_connected_at: Date | null;
  multiplier_permanent: number;
  joined_at: Date;
  ref_code: string;
  referred_by: string | null;
  fingerprint: string | null;
  ip_address: string | null;
  user_agent: string | null;
  is_flagged: boolean;
  flag_reason: string | null;
  is_banned: boolean;
  ban_reason: string | null;
  is_bot: boolean;
  created_at: Date;
  updated_at: Date;
  last_active_at: Date;
}

export type UserPublic = Pick<
  User,
  | 'id'
  | 'username'
  | 'first_name'
  | 'raw_points'
  | 'streak_current'
  | 'streak_best'
  | 'total_referrals'
  | 'multiplier_permanent'
  | 'joined_at'
>;

export interface UserStats {
  rank: number;
  total_users: number;
  percentile: number;
  boxes_today: number;
  points_today: number;
  badges_count: number;
  total_multiplier: number;
}

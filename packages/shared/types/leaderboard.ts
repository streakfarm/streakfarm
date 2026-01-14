export enum LeaderboardType {
  GLOBAL = 'global',
  FRIENDS = 'friends',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  telegram_id: number;
  username: string | null;
  first_name: string;
  photo_url: string | null;
  
  total_points: number;
  current_streak: number;
  
  // Change indicators
  rank_change: number | null;
  points_change: number | null;
}

export interface LeaderboardData {
  type: LeaderboardType;
  entries: LeaderboardEntry[];
  user_rank: number | null;
  total_users: number;
  updated_at: Date;
}

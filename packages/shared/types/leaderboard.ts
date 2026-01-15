export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string | null;
  first_name: string | null;
  raw_points: number;
  streak_current: number;
  badges_count: number;
  total_multiplier: number;
  is_current_user?: boolean;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  current_user: LeaderboardEntry | null;
  total_users: number;
  last_updated: Date;
}

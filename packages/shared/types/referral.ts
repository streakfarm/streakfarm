export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  points_awarded: number;
  created_at: Date;
  referred_user?: {
    id: string;
    username: string | null;
    first_name: string | null;
    raw_points: number;
    joined_at: Date;
  };
}

export interface ReferralStats {
  total_referrals: number;
  active_referrals: number;
  total_points_earned: number;
  referral_code: string;
  referral_link: string;
}

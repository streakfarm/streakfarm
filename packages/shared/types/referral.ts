export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  
  // Rewards
  points_earned: number;
  bonus_multiplier: number;
  
  // Status
  is_active: boolean;
  referred_user_active: boolean;
  
  created_at: Date;
}

export interface ReferralStats {
  total_referrals: number;
  active_referrals: number;
  total_points_earned: number;
  current_tier: number;
  next_tier_at: number;
}

export interface ReferralTier {
  tier: number;
  min_referrals: number;
  max_referrals: number | null;
  points_per_referral: number;
  bonus_multiplier: number;
  tier_name: string;
}

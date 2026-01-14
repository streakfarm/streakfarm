export const POINTS_CONFIG = {
  // Daily Check-in
  DAILY_CHECKIN_BASE: 100,
  DAILY_CHECKIN_STREAK_BONUS: 10, // Per day of streak

  // Boxes
  BOX_HOURLY_MIN: 100,
  BOX_HOURLY_MAX: 1000,
  BOX_DAILY_MIN: 500,
  BOX_DAILY_MAX: 5000,
  BOX_STREAK_MIN: 1000,
  BOX_STREAK_MAX: 10000,

  // Referrals
  REFERRAL_BASE_REWARD: 1000,
  REFERRAL_TIER_1: 1000, // 1-9 referrals
  REFERRAL_TIER_2: 1500, // 10-49 referrals
  REFERRAL_TIER_3: 2000, // 50-99 referrals
  REFERRAL_TIER_4: 3000, // 100+ referrals

  // Multipliers
  LAUNCH_WEEK_MULTIPLIER: 3.0,
  FOUNDING_MEMBER_MULTIPLIER: 2.0,
  BASE_MULTIPLIER: 1.0,

  // Limits
  MAX_BOXES_PER_DAY: 24,
  MAX_DAILY_POINTS: 100000,
} as const;

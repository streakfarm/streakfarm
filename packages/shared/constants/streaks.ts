export const STREAK_CONFIG = {
  // Timezone
  STREAK_RESET_HOUR: 0, // Midnight UTC
  GRACE_PERIOD_HOURS: 4,

  // Milestones
  MILESTONES: [7, 14, 30, 50, 100, 200, 365],

  // Rewards
  MILESTONE_REWARDS: {
    7: 1000,
    14: 2500,
    30: 5000,
    50: 10000,
    100: 25000,
    200: 50000,
    365: 100000,
  },

  // Box Rewards
  MILESTONE_BOX_REWARDS: [7, 30, 100, 365],
} as const;

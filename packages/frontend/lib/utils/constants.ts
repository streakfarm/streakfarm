export const APP_CONFIG = {
  NAME: 'StreakFarm',
  BOT_USERNAME: process.env.NEXT_PUBLIC_BOT_USERNAME || 'StreakFarmBot',
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const;

export const COLORS = {
  streak: {
    fire: '#FF6B35',
    gold: '#FFB800',
  },
  rarity: {
    common: '#10B981',
    rare: '#3B82F6',
    epic: '#8B5CF6',
    legendary: '#F59E0B',
  },
} as const;

export const ANIMATIONS = {
  BOX_OPENING: '/lottie/box-opening.json',
  STREAK_FIRE: '/lottie/streak-fire.json',
  BADGE_EARN: '/lottie/badge-earn.json',
  CONFETTI: '/lottie/confetti.json',
  LEVEL_UP: '/lottie/level-up.json',
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  ONBOARDING: '/onboarding',
  DASHBOARD: '/dashboard',
  TASKS: '/tasks',
  BADGES: '/badges',
  LEADERBOARD: '/leaderboard',
  REFERRALS: '/referrals',
  PROFILE: '/profile',
  BOXES: '/boxes',
  WALLET: '/wallet',
  SETTINGS: '/settings',
  HOW_TO_PLAY: '/how-to-play',
} as const;

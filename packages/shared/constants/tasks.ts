import { TaskType } from '../types/task';

export const DEFAULT_TASKS = [
  // Social Tasks
  {
    title: 'Follow on Twitter',
    description: 'Follow @StreakFarm on Twitter',
    type: TaskType.SOCIAL_FOLLOW,
    points_reward: 500,
    box_reward: false,
    action_url: 'https://twitter.com/streakfarm',
    verification_type: 'manual',
    is_repeatable: false,
    icon: '🐦',
    priority: 1,
  },
  {
    title: 'Join Telegram Channel',
    description: 'Join our official Telegram channel',
    type: TaskType.SOCIAL_JOIN,
    points_reward: 300,
    box_reward: true,
    action_url: 'https://t.me/streakfarm',
    verification_type: 'telegram_member',
    is_repeatable: false,
    icon: '📢',
    priority: 2,
  },
  {
    title: 'Share on Twitter',
    description: 'Tweet about StreakFarm',
    type: TaskType.SOCIAL_SHARE,
    points_reward: 1000,
    box_reward: true,
    action_url: null,
    verification_type: 'manual',
    is_repeatable: true,
    cooldown_hours: 24,
    icon: '📱',
    priority: 3,
  },

  // Wallet Tasks
  {
    title: 'Connect TON Wallet',
    description: 'Connect your TON wallet to unlock features',
    type: TaskType.WALLET_CONNECT,
    points_reward: 2000,
    box_reward: true,
    action_url: null,
    verification_type: 'wallet_connected',
    is_repeatable: false,
    icon: '👛',
    priority: 4,
  },

  // Referral Tasks
  {
    title: 'Invite 3 Friends',
    description: 'Invite 3 friends to join StreakFarm',
    type: TaskType.REFERRAL,
    points_reward: 5000,
    box_reward: true,
    action_url: null,
    verification_type: 'referral_count',
    is_repeatable: false,
    icon: '👥',
    priority: 5,
  },
] as const;

export const TASK_CATEGORIES = {
  SOCIAL: 'social',
  INVITE: 'invite',
  WATCH_AD: 'watch_ad',
  DAILY: 'daily',
  WALLET: 'wallet',
  CUSTOM: 'custom',
} as const;

export const SOCIAL_PLATFORMS = {
  TELEGRAM: 'telegram',
  TWITTER: 'twitter',
  YOUTUBE: 'youtube',
  DISCORD: 'discord',
  INSTAGRAM: 'instagram',
} as const;

export const AD_NETWORKS = {
  ADSGRAM: 'adsgram',
  TELEGRAM_ADS: 'telegram_ads',
} as const;

export const MAX_ADS_PER_DAY = 5;
export const REFERRAL_BASE_REWARD = 1000;
export const REFERRAL_PERCENTAGE = 0.1;

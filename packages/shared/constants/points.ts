export const STREAK_MULTIPLIERS = [
  { days: 1, multiplier: 1.0 },
  { days: 3, multiplier: 1.2 },
  { days: 7, multiplier: 1.5 },
  { days: 14, multiplier: 2.0 },
  { days: 30, multiplier: 2.5 },
  { days: 60, multiplier: 3.0 },
  { days: 90, multiplier: 4.0 },
  { days: 180, multiplier: 5.0 },
  { days: 365, multiplier: 10.0 },
] as const;

export const DAILY_CHECKIN_POINTS = 100;
export const WALLET_CONNECTION_BONUS = 5000;

export type BoxRarity = 'common' | 'rare' | 'legendary';

export interface Box {
  id: string;
  user_id: string;
  generated_at: Date;
  expires_at: Date;
  opened_at: Date | null;
  base_points: number;
  multiplier_applied: number;
  final_points: number;
  rarity: BoxRarity;
  is_expired: boolean;
}

export interface BoxOpenResult {
  box_id: string;
  rarity: BoxRarity;
  base_points: number;
  multiplier: number;
  final_points: number;
  badges_earned: string[];
}

export const BOX_RARITY_CHANCES = {
  legendary: 0.001,
  rare: 0.05,
  common: 0.949,
} as const;

export const BOX_POINT_RANGES = {
  common: { min: 50, max: 1000 },
  rare: { min: 5000, max: 10000 },
  legendary: { min: 10000, max: 50000 },
} as const;

export const BOX_EXPIRY_HOURS = 3;
export const BOXES_PER_DAY = 24;

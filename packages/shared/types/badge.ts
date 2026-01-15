export type BadgeCategory = 'streak' | 'achievement' | 'wallet' | 'special';
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_emoji: string;
  image_url: string | null;
  badge_category: BadgeCategory;
  multiplier: number;
  rarity: BadgeRarity;
  requirements: Record<string, any>;
  max_supply: number | null;
  current_supply: number;
  is_active: boolean;
  available_from: Date | null;
  available_until: Date | null;
  can_convert_to_nft: boolean;
  created_at: Date;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: Date;
  is_active: boolean;
  converted_to_nft: boolean;
  nft_address: string | null;
  converted_at: Date | null;
  badge?: Badge;
}

export interface BadgeProgress {
  badge: Badge;
  current: number;
  required: number;
  percentage: number;
  is_unlocked: boolean;
}

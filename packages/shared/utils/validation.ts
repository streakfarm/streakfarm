import { z } from 'zod';

export const TelegramIdSchema = z.number().int().positive();

export const UsernameSchema = z
  .string()
  .min(3)
  .max(32)
  .regex(/^[a-zA-Z0-9_]+$/)
  .nullable();

export const WalletAddressSchema = z
  .string()
  .regex(/^EQ[a-zA-Z0-9_-]{46}$/, 'Invalid TON wallet address');

export const PointsSchema = z.number().int().min(0);

export const StreakSchema = z.number().int().min(0);

export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(100).default(20),
});

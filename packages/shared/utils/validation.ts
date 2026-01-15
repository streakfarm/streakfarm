import { z } from 'zod';

export const telegramInitDataSchema = z.object({
  user: z.object({
    id: z.number(),
    first_name: z.string(),
    last_name: z.string().optional(),
    username: z.string().optional(),
    language_code: z.string().optional(),
  }),
  auth_date: z.number(),
  hash: z.string(),
});

export const walletAddressSchema = z
  .string()
  .regex(/^[UEk][Qf][a-zA-Z0-9_-]{46}$/, 'Invalid TON address');

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export const uuidSchema = z.string().uuid();

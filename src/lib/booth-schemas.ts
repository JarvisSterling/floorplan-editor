import { z } from 'zod';

export const createBoothSchema = z.object({
  object_id: z.string().uuid(),
  event_id: z.string(),
  booth_number: z.string().min(1),
  status: z.enum(['available', 'reserved', 'sold', 'blocked', 'premium']),
  category: z.enum(['standard', 'island', 'corner', 'inline', 'peninsula']).nullable().optional(),
  size_sqm: z.number().positive().nullable().optional(),
  price: z.number().nonnegative().nullable().optional(),
  pricing_tier: z.string().nullable().optional(),
  exhibitor_id: z.string().uuid().nullable().optional(),
  max_capacity: z.number().int().positive().nullable().optional(),
  amenities: z.array(z.string()).optional(),
});

export const updateBoothSchema = z.object({
  booth_number: z.string().min(1).optional(),
  status: z.enum(['available', 'reserved', 'sold', 'blocked', 'premium']).optional(),
  category: z.enum(['standard', 'island', 'corner', 'inline', 'peninsula']).nullable().optional(),
  size_sqm: z.number().positive().nullable().optional(),
  price: z.number().nonnegative().nullable().optional(),
  pricing_tier: z.string().nullable().optional(),
  exhibitor_id: z.string().uuid().nullable().optional(),
  max_capacity: z.number().int().positive().nullable().optional(),
  amenities: z.array(z.string()).optional(),
});

export const boothRequestSchema = z.object({
  requester_name: z.string().min(1, 'Name is required'),
  company: z.string().min(1, 'Company is required'),
  email: z.string().email('Valid email required'),
  message: z.string().nullable().optional(),
});

export const updateBoothProfileSchema = z.object({
  company_name: z.string().nullable().optional(),
  logo_url: z.string().url().nullable().optional(),
  banner_url: z.string().url().nullable().optional(),
  description: z.string().nullable().optional(),
  products: z.array(z.unknown()).optional(),
  team_members: z.array(z.unknown()).optional(),
  social_links: z.record(z.string(), z.string()).optional(),
  custom_fields: z.record(z.string(), z.unknown()).optional(),
});

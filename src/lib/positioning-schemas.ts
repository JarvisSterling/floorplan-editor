import { z } from 'zod';

export const anchorTypeEnum = z.enum(['ble', 'uwb', 'wifi', 'qr', 'nfc']);
export const anchorStatusEnum = z.enum(['active', 'inactive']);

export const createAnchorSchema = z.object({
  floor_plan_id: z.string().uuid(),
  x: z.number().finite(),
  y: z.number().finite(),
  type: anchorTypeEnum,
  hardware_id: z.string().max(200).nullable().optional().default(null),
  config: z.record(z.string(), z.unknown()).optional().default({}),
  battery_level: z.number().int().min(0).max(100).nullable().optional().default(null),
  status: anchorStatusEnum.optional().default('active'),
});

export const updateAnchorSchema = z.object({
  x: z.number().finite().optional(),
  y: z.number().finite().optional(),
  type: anchorTypeEnum.optional(),
  hardware_id: z.string().max(200).nullable().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  battery_level: z.number().int().min(0).max(100).nullable().optional(),
  status: anchorStatusEnum.optional(),
  last_seen: z.string().datetime().optional(),
});

export const updatePositionSchema = z.object({
  attendee_id: z.string().uuid(),
  floor_plan_id: z.string().uuid(),
  x: z.number().finite(),
  y: z.number().finite(),
  accuracy_m: z.number().positive().finite().nullable().optional(),
  source: z.string().max(50).nullable().optional(),
});

export const batchUpdatePositionSchema = z.object({
  positions: z.array(updatePositionSchema).min(1).max(500),
});

import { z } from 'zod';

export const createFloorSchema = z.object({
  event_id: z.string().min(1),
  name: z.string().min(1).max(100),
  floor_number: z.number().int(),
  width_m: z.number().positive().default(100),
  height_m: z.number().positive().default(100),
  background_image_url: z.string().url().nullable().optional(),
  grid_size_m: z.number().positive().default(1),
  scale_px_per_m: z.number().positive().default(10),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
  sort_order: z.number().int().optional(),
  is_published: z.boolean().optional().default(false),
});

export const updateFloorSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  floor_number: z.number().int().optional(),
  width_m: z.number().positive().optional(),
  height_m: z.number().positive().optional(),
  background_image_url: z.string().url().nullable().optional(),
  grid_size_m: z.number().positive().optional(),
  scale_px_per_m: z.number().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  sort_order: z.number().int().optional(),
  is_published: z.boolean().optional(),
});

export const reorderFloorsSchema = z.object({
  floor_ids: z.array(z.string().uuid()).min(1),
});

export const crossFloorLinkSchema = z.object({
  linked_floor_id: z.string().uuid(),
  linked_object_id: z.string().uuid(),
});

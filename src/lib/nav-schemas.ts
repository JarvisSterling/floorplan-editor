import { z } from 'zod';

export const navNodeTypeEnum = z.enum(['waypoint', 'entrance', 'exit', 'elevator', 'stairs']);

export const createNavNodeSchema = z.object({
  floor_plan_id: z.string().uuid(),
  x: z.number().finite(),
  y: z.number().finite(),
  type: navNodeTypeEnum,
  accessible: z.boolean().optional().default(true),
  linked_floor_node_id: z.string().uuid().nullable().optional().default(null),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

export const updateNavNodeSchema = z.object({
  x: z.number().finite().optional(),
  y: z.number().finite().optional(),
  type: navNodeTypeEnum.optional(),
  accessible: z.boolean().optional(),
  linked_floor_node_id: z.string().uuid().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const createNavEdgeSchema = z.object({
  from_node_id: z.string().uuid(),
  to_node_id: z.string().uuid(),
  distance_m: z.number().positive().finite(),
  bidirectional: z.boolean().optional().default(true),
  accessible: z.boolean().optional().default(true),
  weight_modifier: z.number().positive().finite().optional().default(1.0),
});

export const updateNavEdgeSchema = z.object({
  distance_m: z.number().positive().finite().optional(),
  bidirectional: z.boolean().optional(),
  accessible: z.boolean().optional(),
  weight_modifier: z.number().positive().finite().optional(),
});

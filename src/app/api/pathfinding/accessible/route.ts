import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';
import { findPath } from '@/lib/pathfinding';
import { findCrossFloorRoute } from '@/lib/cross-floor-routing';
import { generateDirections, estimateWalkingTime, formatWalkingTime, totalDistance } from '@/lib/directions';
import type { NavNode, NavEdge } from '@/types/database';
import { z } from 'zod';

const accessibleSchema = z.object({
  floor_plan_id: z.string().uuid().optional(),
  event_id: z.string().optional(),
  start_node_id: z.string().uuid(),
  end_node_id: z.string().uuid(),
});

/**
 * POST /api/pathfinding/accessible
 * Wheelchair-friendly routing: only accessible nodes/edges, prefers elevators over stairs,
 * applies reduced speed estimate (0.8 m/s for wheelchair users).
 */
export async function POST(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const body = await request.json();
  const parsed = accessibleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { floor_plan_id, event_id, start_node_id, end_node_id } = parsed.data;

  if (!floor_plan_id && !event_id) {
    return NextResponse.json({ error: 'Either floor_plan_id or event_id is required' }, { status: 400 });
  }

  // Determine if cross-floor is needed
  if (event_id) {
    // Cross-floor accessible routing
    const { data: floors, error: floorError } = await client
      .from('floor_plans')
      .select('id')
      .eq('event_id', event_id);

    if (floorError) return NextResponse.json({ error: floorError.message }, { status: 500 });
    const floorIds = (floors || []).map((f: { id: string }) => f.id);

    const { data: allNodes, error: nodeError } = await client
      .from('nav_nodes')
      .select('*')
      .in('floor_plan_id', floorIds);
    if (nodeError) return NextResponse.json({ error: nodeError.message }, { status: 500 });

    const nodeIds = (allNodes || []).map((n: NavNode) => n.id);
    const { data: allEdges, error: edgeError } = await client
      .from('nav_edges')
      .select('*')
      .or(`from_node_id.in.(${nodeIds.join(',')}),to_node_id.in.(${nodeIds.join(',')})`);
    if (edgeError) return NextResponse.json({ error: edgeError.message }, { status: 500 });

    const result = findCrossFloorRoute(
      (allNodes || []) as NavNode[],
      (allEdges || []) as NavEdge[],
      start_node_id,
      end_node_id,
      { accessibleOnly: true }
    );

    if (!result) {
      return NextResponse.json({
        error: 'No accessible route found. Some paths may require stairs.',
        accessible: false,
      }, { status: 404 });
    }

    // Wheelchair speed: ~0.8 m/s
    const walkTime = Math.ceil(result.total_distance_m / 0.8);

    return NextResponse.json({
      accessible: true,
      total_distance_m: result.total_distance_m,
      walking_time: formatWalkingTime(walkTime),
      walking_time_seconds: walkTime,
      floor_transitions: result.floor_transitions,
      segments: result.segments.map((seg) => ({
        floor_plan_id: seg.floor_plan_id,
        path: seg.path,
        distance_m: seg.distance_m,
        directions: seg.directions.map((d) => ({
          instruction: d.instruction,
          distance_m: d.distance_m,
          direction: d.direction,
        })),
      })),
    });
  }

  // Single-floor accessible routing
  const { data: nodes, error: nodeError } = await client
    .from('nav_nodes')
    .select('*')
    .eq('floor_plan_id', floor_plan_id!);
  if (nodeError) return NextResponse.json({ error: nodeError.message }, { status: 500 });

  const nodeIds = (nodes || []).map((n: NavNode) => n.id);
  const { data: edges, error: edgeError } = await client
    .from('nav_edges')
    .select('*')
    .or(`from_node_id.in.(${nodeIds.join(',')}),to_node_id.in.(${nodeIds.join(',')})`);
  if (edgeError) return NextResponse.json({ error: edgeError.message }, { status: 500 });

  const result = findPath(
    (nodes || []) as NavNode[],
    (edges || []) as NavEdge[],
    start_node_id,
    end_node_id,
    { accessibleOnly: true }
  );

  if (!result) {
    return NextResponse.json({
      error: 'No accessible route found on this floor',
      accessible: false,
    }, { status: 404 });
  }

  const directions = generateDirections(result.nodes);
  const dist = totalDistance(directions);
  const walkTime = Math.ceil(dist / 0.8);

  return NextResponse.json({
    accessible: true,
    path: result.path,
    distance_m: result.distance,
    nodes: result.nodes,
    directions: directions.map((d) => ({
      instruction: d.instruction,
      distance_m: d.distance_m,
      direction: d.direction,
    })),
    walking_time: formatWalkingTime(walkTime),
    walking_time_seconds: walkTime,
  });
}

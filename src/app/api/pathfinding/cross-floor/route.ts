import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';
import { findCrossFloorRoute } from '@/lib/cross-floor-routing';
import { estimateWalkingTime, formatWalkingTime } from '@/lib/directions';
import type { NavNode, NavEdge } from '@/types/database';
import { z } from 'zod';

const crossFloorSchema = z.object({
  event_id: z.string().uuid(),
  start_node_id: z.string().uuid(),
  end_node_id: z.string().uuid(),
  accessible_only: z.boolean().optional().default(false),
});

// POST /api/pathfinding/cross-floor
export async function POST(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const body = await request.json();
  const parsed = crossFloorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { event_id, start_node_id, end_node_id, accessible_only } = parsed.data;

  // Load all floor plans for this event
  const { data: floors, error: floorError } = await client
    .from('floor_plans')
    .select('id')
    .eq('event_id', event_id);

  if (floorError) return NextResponse.json({ error: floorError.message }, { status: 500 });
  if (!floors || floors.length === 0) {
    return NextResponse.json({ error: 'No floor plans found' }, { status: 404 });
  }

  const floorIds = floors.map((f: { id: string }) => f.id);

  // Load all nodes across all floors
  const { data: allNodes, error: nodeError } = await client
    .from('nav_nodes')
    .select('*')
    .in('floor_plan_id', floorIds);

  if (nodeError) return NextResponse.json({ error: nodeError.message }, { status: 500 });
  if (!allNodes || allNodes.length === 0) {
    return NextResponse.json({ error: 'No navigation nodes found' }, { status: 404 });
  }

  // Load all edges — use .in() to avoid filter injection via .or() interpolation
  const nodeIds = allNodes.map((n: NavNode) => n.id);
  const [fromResult, toResult] = await Promise.all([
    client.from('nav_edges').select('*').in('from_node_id', nodeIds),
    client.from('nav_edges').select('*').in('to_node_id', nodeIds),
  ]);
  const edgeError = fromResult.error || toResult.error;
  const edgeMap = new Map<string, NavEdge>();
  for (const e of [...(fromResult.data || []), ...(toResult.data || [])] as NavEdge[]) {
    edgeMap.set(e.id, e);
  }
  const allEdges = Array.from(edgeMap.values());

  if (edgeError) return NextResponse.json({ error: edgeError.message }, { status: 500 });

  const result = findCrossFloorRoute(
    allNodes as NavNode[],
    (allEdges || []) as NavEdge[],
    start_node_id,
    end_node_id,
    { accessibleOnly: accessible_only }
  );

  if (!result) {
    return NextResponse.json({ error: 'No route found between floors' }, { status: 404 });
  }

  const walkTime = estimateWalkingTime(result.total_distance_m);

  return NextResponse.json({
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

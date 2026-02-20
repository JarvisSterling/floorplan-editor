import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';
import { optimizeMultiStopRoute, twoOptImprove } from '@/lib/route-optimizer';
import { generateDirections, estimateWalkingTime, formatWalkingTime, totalDistance } from '@/lib/directions';
import type { NavNode, NavEdge } from '@/types/database';
import { z } from 'zod';

const multiStopSchema = z.object({
  floor_plan_id: z.string().uuid(),
  start_node_id: z.string().uuid(),
  stop_node_ids: z.array(z.string().uuid()).min(1).max(50),
  accessible_only: z.boolean().optional().default(false),
  optimize: z.boolean().optional().default(true),
});

// POST /api/pathfinding/multi-stop
export async function POST(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const body = await request.json();
  const parsed = multiStopSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { floor_plan_id, start_node_id, stop_node_ids, accessible_only, optimize } = parsed.data;

  // Load nodes
  const { data: nodes, error: nodeError } = await client
    .from('nav_nodes')
    .select('*')
    .eq('floor_plan_id', floor_plan_id);

  if (nodeError) return NextResponse.json({ error: nodeError.message }, { status: 500 });
  if (!nodes || nodes.length === 0) {
    return NextResponse.json({ error: 'No navigation nodes found' }, { status: 404 });
  }

  const nodeIds = nodes.map((n: NavNode) => n.id);
  // Use separate queries to avoid filter injection via .or() string interpolation
  const [fromResult, toResult] = await Promise.all([
    client.from('nav_edges').select('*').in('from_node_id', nodeIds),
    client.from('nav_edges').select('*').in('to_node_id', nodeIds),
  ]);

  const edgeError = fromResult.error || toResult.error;
  // Merge and deduplicate edges
  const edgeMap = new Map<string, NavEdge>();
  for (const e of [...(fromResult.data || []), ...(toResult.data || [])] as NavEdge[]) {
    edgeMap.set(e.id, e);
  }
  const edges = Array.from(edgeMap.values());

  if (edgeError) return NextResponse.json({ error: edgeError.message }, { status: 500 });

  const opts = { accessibleOnly: accessible_only };
  let result = optimizeMultiStopRoute(
    nodes as NavNode[],
    (edges || []) as NavEdge[],
    start_node_id,
    stop_node_ids,
    opts
  );

  if (!result) {
    return NextResponse.json({ error: 'Cannot find path to all stops' }, { status: 404 });
  }

  // Apply 2-opt improvement if requested and manageable size
  if (optimize && stop_node_ids.length <= 15) {
    result = twoOptImprove(nodes as NavNode[], (edges || []) as NavEdge[], result, opts);
  }

  // Generate directions for full path
  const nodeMap = new Map((nodes as NavNode[]).map((n) => [n.id, n]));
  const fullPathNodes: NavNode[] = [];
  for (const segment of result.segments) {
    for (let i = 0; i < segment.path.length; i++) {
      // Avoid duplicating nodes at segment boundaries
      if (i === 0 && fullPathNodes.length > 0) continue;
      const node = nodeMap.get(segment.path[i]);
      if (node) fullPathNodes.push(node);
    }
  }

  const directions = generateDirections(fullPathNodes);
  const totalDist = totalDistance(directions);
  const walkTime = estimateWalkingTime(totalDist);

  return NextResponse.json({
    ordered_stops: result.ordered_node_ids,
    total_distance_m: result.total_distance_m,
    segments: result.segments,
    directions: directions.map((d) => ({
      instruction: d.instruction,
      distance_m: d.distance_m,
      direction: d.direction,
    })),
    walking_time: formatWalkingTime(walkTime),
    walking_time_seconds: walkTime,
  });
}

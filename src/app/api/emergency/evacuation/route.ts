import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';
import { findPath, findNearestNode } from '@/lib/pathfinding';
import { generateDirections, estimateWalkingTime, formatWalkingTime } from '@/lib/directions';
import type { NavNode, NavEdge } from '@/types/database';
import { z } from 'zod';

const evacuationSchema = z.object({
  floor_plan_id: z.string().uuid(),
  from_x: z.number().finite(),
  from_y: z.number().finite(),
  accessible_only: z.boolean().optional().default(false),
});

/**
 * POST /api/emergency/evacuation — find nearest exit and route to it
 */
export async function POST(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const body = await request.json();
  const parsed = evacuationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { floor_plan_id, from_x, from_y, accessible_only } = parsed.data;

  // Load nodes and edges
  const { data: nodes, error: nodeError } = await client
    .from('nav_nodes')
    .select('*')
    .eq('floor_plan_id', floor_plan_id);

  if (nodeError) return NextResponse.json({ error: nodeError.message }, { status: 500 });
  if (!nodes || nodes.length === 0) {
    return NextResponse.json({ error: 'No navigation nodes found' }, { status: 404 });
  }

  const nodeIds = nodes.map((n: NavNode) => n.id);
  const [fromResult, toResult] = await Promise.all([
    client.from('nav_edges').select('*').in('from_node_id', nodeIds),
    client.from('nav_edges').select('*').in('to_node_id', nodeIds),
  ]);
  const edgeError = fromResult.error || toResult.error;
  const edgeMap = new Map<string, NavEdge>();
  for (const e of [...(fromResult.data || []), ...(toResult.data || [])] as NavEdge[]) {
    edgeMap.set(e.id, e);
  }
  const edges = Array.from(edgeMap.values());

  if (edgeError) return NextResponse.json({ error: edgeError.message }, { status: 500 });

  const typedNodes = nodes as NavNode[];
  const typedEdges = (edges || []) as NavEdge[];

  // Find nearest node to current position
  const startNode = findNearestNode(typedNodes, from_x, from_y);
  if (!startNode) {
    return NextResponse.json({ error: 'No nearby navigation node found' }, { status: 404 });
  }

  // Find all exits
  const exits = typedNodes.filter((n) => n.type === 'exit' || n.type === 'entrance');
  if (exits.length === 0) {
    return NextResponse.json({ error: 'No exits found on this floor' }, { status: 404 });
  }

  // Find shortest path to any exit
  let bestRoute: { path: string[]; distance: number; nodes: NavNode[] } | null = null;
  let bestExit: NavNode | null = null;

  for (const exit of exits) {
    const result = findPath(typedNodes, typedEdges, startNode.id, exit.id, { accessibleOnly: accessible_only });
    if (result && (!bestRoute || result.distance < bestRoute.distance)) {
      bestRoute = result;
      bestExit = exit;
    }
  }

  if (!bestRoute || !bestExit) {
    return NextResponse.json({ error: 'No evacuation route found' }, { status: 404 });
  }

  const directions = generateDirections(bestRoute.nodes);
  const walkTime = estimateWalkingTime(bestRoute.distance);

  return NextResponse.json({
    emergency: true,
    nearest_exit: {
      node_id: bestExit.id,
      type: bestExit.type,
      x: bestExit.x,
      y: bestExit.y,
    },
    route: {
      path: bestRoute.path,
      distance_m: bestRoute.distance,
      walking_time: formatWalkingTime(walkTime),
      walking_time_seconds: walkTime,
      directions: directions.map((d) => ({
        instruction: d.instruction,
        distance_m: d.distance_m,
        direction: d.direction,
      })),
    },
    all_exits: exits.map((e) => ({
      node_id: e.id,
      type: e.type,
      x: e.x,
      y: e.y,
    })),
  });
}

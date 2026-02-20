import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';
import { findPath } from '@/lib/pathfinding';
import type { NavNode, NavEdge } from '@/types/database';
import { z } from 'zod';

const pathfindingSchema = z.object({
  floor_plan_id: z.string().uuid(),
  start_node_id: z.string().uuid(),
  end_node_id: z.string().uuid(),
  accessible_only: z.boolean().optional().default(false),
});

// POST /api/pathfinding — find shortest path between two nodes
export async function POST(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const body = await request.json();
  const parsed = pathfindingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { floor_plan_id, start_node_id, end_node_id, accessible_only } = parsed.data;

  // Load nodes
  const { data: nodes, error: nodeError } = await client
    .from('nav_nodes')
    .select('*')
    .eq('floor_plan_id', floor_plan_id);

  if (nodeError) return NextResponse.json({ error: nodeError.message }, { status: 500 });
  if (!nodes || nodes.length === 0) {
    return NextResponse.json({ error: 'No navigation nodes found' }, { status: 404 });
  }

  // Load edges
  const nodeIds = nodes.map((n: NavNode) => n.id);
  const { data: edges, error: edgeError } = await client
    .from('nav_edges')
    .select('*')
    .or(`from_node_id.in.(${nodeIds.join(',')}),to_node_id.in.(${nodeIds.join(',')})`);

  if (edgeError) return NextResponse.json({ error: edgeError.message }, { status: 500 });

  const result = findPath(
    nodes as NavNode[],
    (edges || []) as NavEdge[],
    start_node_id,
    end_node_id,
    { accessibleOnly: accessible_only }
  );

  if (!result) {
    return NextResponse.json({ error: 'No path found between the specified nodes' }, { status: 404 });
  }

  return NextResponse.json({
    path: result.path,
    distance_m: result.distance,
    nodes: result.nodes,
    step_count: result.path.length,
  });
}

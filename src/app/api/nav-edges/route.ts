import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';
import { createNavEdgeSchema } from '@/lib/nav-schemas';

// GET /api/nav-edges?floor_plan_id=X
export async function GET(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const floorPlanId = searchParams.get('floor_plan_id');

  if (!floorPlanId) {
    return NextResponse.json({ error: 'floor_plan_id is required' }, { status: 400 });
  }

  // Get edges where either node belongs to this floor plan
  const { data: nodes, error: nodeError } = await client
    .from('nav_nodes')
    .select('id')
    .eq('floor_plan_id', floorPlanId);

  if (nodeError) return NextResponse.json({ error: nodeError.message }, { status: 500 });

  const nodeIds = (nodes || []).map((n: { id: string }) => n.id);
  if (nodeIds.length === 0) return NextResponse.json([]);

  const { data, error: dbError } = await client
    .from('nav_edges')
    .select('*')
    .or(`from_node_id.in.(${nodeIds.join(',')}),to_node_id.in.(${nodeIds.join(',')})`);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/nav-edges
export async function POST(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const body = await request.json();
  const parsed = createNavEdgeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  // Prevent self-edges
  if (parsed.data.from_node_id === parsed.data.to_node_id) {
    return NextResponse.json({ error: 'Cannot create edge from a node to itself' }, { status: 400 });
  }

  const { data, error: dbError } = await client
    .from('nav_edges')
    .insert(parsed.data)
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

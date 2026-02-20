import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';
import { generateNavGraph } from '@/lib/nav-graph-generator';
import type { FloorPlanObject } from '@/types/database';

// POST /api/nav-nodes/generate — auto-generate nav graph for a floor plan
export async function POST(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const body = await request.json();
  const floorPlanId = body.floor_plan_id;

  if (!floorPlanId || typeof floorPlanId !== 'string') {
    return NextResponse.json({ error: 'floor_plan_id (string) is required' }, { status: 400 });
  }

  // Get floor plan for scale
  const { data: floorPlan, error: fpError } = await client
    .from('floor_plans')
    .select('scale_px_per_m')
    .eq('id', floorPlanId)
    .single();

  if (fpError) return NextResponse.json({ error: 'Floor plan not found' }, { status: 404 });

  // Get all objects on this floor plan
  const { data: objects, error: objError } = await client
    .from('floor_plan_objects')
    .select('*')
    .eq('floor_plan_id', floorPlanId);

  if (objError) return NextResponse.json({ error: objError.message }, { status: 500 });

  const scale = floorPlan.scale_px_per_m || 50;
  const result = generateNavGraph(objects as FloorPlanObject[], scale);

  if (result.nodes.length === 0) {
    return NextResponse.json({ message: 'No walkable areas found', nodes: [], edges: [] });
  }

  // Optionally clear existing auto-generated nodes first
  if (body.replace_existing) {
    // Delete existing auto-generated nodes (cascades to edges via FK)
    const { data: existingNodes } = await client
      .from('nav_nodes')
      .select('id, metadata')
      .eq('floor_plan_id', floorPlanId);

    const autoNodeIds = (existingNodes || [])
      .filter((n: { metadata: Record<string, unknown> }) => n.metadata?.auto_generated)
      .map((n: { id: string }) => n.id);

    if (autoNodeIds.length > 0) {
      await client.from('nav_edges').delete().or(
        autoNodeIds.map((id: string) => `from_node_id.eq.${id}`).join(',') + ',' +
        autoNodeIds.map((id: string) => `to_node_id.eq.${id}`).join(',')
      );
      await client.from('nav_nodes').delete().in('id', autoNodeIds);
    }
  }

  // Insert nodes — add generation_index to metadata so we can reliably
  // map inserted rows back to their original indices regardless of DB return order.
  const nodeInserts = result.nodes.map((n, idx) => ({
    floor_plan_id: floorPlanId,
    x: n.x,
    y: n.y,
    type: n.type,
    accessible: n.accessible,
    metadata: { ...n.metadata, generation_index: idx },
  }));

  const { data: insertedNodes, error: insertError } = await client
    .from('nav_nodes')
    .insert(nodeInserts)
    .select();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  // Build index→id map from generation_index metadata for reliable edge mapping
  const indexToNodeId = new Map<number, string>();
  if (insertedNodes) {
    for (const node of insertedNodes) {
      const idx = (node.metadata as Record<string, unknown>)?.generation_index;
      if (typeof idx === 'number') {
        indexToNodeId.set(idx, node.id);
      }
    }
  }

  // Insert edges with real node IDs
  if (result.edges.length > 0 && insertedNodes) {
    const edgeInserts = result.edges
      .filter((e) => indexToNodeId.has(e.fromIndex) && indexToNodeId.has(e.toIndex))
      .map((e) => ({
        from_node_id: indexToNodeId.get(e.fromIndex)!,
        to_node_id: indexToNodeId.get(e.toIndex)!,
        distance_m: e.distance_m,
        bidirectional: true,
        accessible: e.accessible,
        weight_modifier: 1.0,
      }));

    const { error: edgeError } = await client.from('nav_edges').insert(edgeInserts);
    if (edgeError) return NextResponse.json({ error: edgeError.message }, { status: 500 });
  }

  return NextResponse.json({
    message: `Generated ${insertedNodes?.length || 0} nodes and ${result.edges.length} edges`,
    node_count: insertedNodes?.length || 0,
    edge_count: result.edges.length,
  }, { status: 201 });
}

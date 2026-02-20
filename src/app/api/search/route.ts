import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';
import { findNearestNode } from '@/lib/pathfinding';
import type { NavNode } from '@/types/database';
import { z } from 'zod';

const searchSchema = z.object({
  event_id: z.string().uuid(),
  query: z.string().min(1).max(200).optional(),
  type: z.enum(['booth', 'facility', 'nearest']).optional().default('booth'),
  floor_plan_id: z.string().uuid().optional(),
  from_x: z.number().finite().optional(),
  from_y: z.number().finite().optional(),
  facility_type: z.enum(['entrance', 'exit', 'elevator', 'stairs', 'waypoint']).optional(),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

// POST /api/search — search booths by name, find nearest facility
export async function POST(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const body = await request.json();
  const parsed = searchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { event_id, query, type, floor_plan_id, from_x, from_y, facility_type, limit } = parsed.data;

  if (type === 'booth' || type === undefined) {
    // Search booths by name/number
    if (!query) {
      return NextResponse.json({ error: 'query is required for booth search' }, { status: 400 });
    }

    // Sanitize query for PostgREST filter injection — strip special filter chars
    const sanitizedQuery = query.replace(/[%_(),.]/g, '');

    // Search booths
    const { data: booths, error: boothError } = await client
      .from('booths')
      .select('*, booth_profiles(*)')
      .eq('event_id', event_id)
      .ilike('booth_number', `%${sanitizedQuery}%`);

    if (boothError) return NextResponse.json({ error: boothError.message }, { status: 500 });

    // Also search by company name in profiles
    const { data: profileMatches, error: profileError } = await client
      .from('booth_profiles')
      .select('*, booths!inner(*)')
      .ilike('company_name', `%${sanitizedQuery}%`);

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

    // Merge and deduplicate
    const boothIds = new Set((booths || []).map((b: { id: string }) => b.id));
    const allResults = [...(booths || [])];

    for (const pm of (profileMatches || [])) {
      const booth = (pm as Record<string, unknown>).booths as { id: string };
      if (booth && !boothIds.has(booth.id)) {
        allResults.push(booth);
        boothIds.add(booth.id);
      }
    }

    // Get associated floor plan objects for positions
    const objectIds = allResults.map((b: { object_id?: string }) => b.object_id).filter(Boolean);
    let objectPositions: Record<string, { x: number; y: number; floor_plan_id: string }> = {};

    if (objectIds.length > 0) {
      const { data: objects } = await client
        .from('floor_plan_objects')
        .select('id, x, y, floor_plan_id')
        .in('id', objectIds);

      if (objects) {
        objectPositions = Object.fromEntries(
          objects.map((o: { id: string; x: number; y: number; floor_plan_id: string }) => [o.id, { x: o.x, y: o.y, floor_plan_id: o.floor_plan_id }])
        );
      }
    }

    return NextResponse.json({
      type: 'booth',
      results: allResults.slice(0, limit).map((b: Record<string, unknown>) => ({
        ...b,
        position: objectPositions[b.object_id as string] || null,
      })),
      total: allResults.length,
    });
  }

  if (type === 'nearest' || type === 'facility') {
    // Find nearest facility (entrance, exit, elevator, stairs)
    if (!floor_plan_id) {
      return NextResponse.json({ error: 'floor_plan_id is required for facility search' }, { status: 400 });
    }
    if (from_x === undefined || from_y === undefined) {
      return NextResponse.json({ error: 'from_x and from_y are required for nearest search' }, { status: 400 });
    }

    const { data: nodes, error: nodeError } = await client
      .from('nav_nodes')
      .select('*')
      .eq('floor_plan_id', floor_plan_id);

    if (nodeError) return NextResponse.json({ error: nodeError.message }, { status: 500 });

    const nearest = findNearestNode(
      (nodes || []) as NavNode[],
      from_x,
      from_y,
      facility_type || undefined
    );

    if (!nearest) {
      return NextResponse.json({ error: 'No matching facility found' }, { status: 404 });
    }

    // Also find a few more nearby
    const sorted = ((nodes || []) as NavNode[])
      .filter((n) => !facility_type || n.type === facility_type)
      .map((n) => ({
        ...n,
        distance: Math.sqrt((n.x - from_x) ** 2 + (n.y - from_y) ** 2),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    return NextResponse.json({
      type: 'facility',
      nearest,
      results: sorted,
    });
  }

  return NextResponse.json({ error: 'Invalid search type' }, { status: 400 });
}

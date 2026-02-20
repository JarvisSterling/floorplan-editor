import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';
import { createAnchorSchema } from '@/lib/positioning-schemas';

// GET /api/positioning/anchors?floor_plan_id=X
export async function GET(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const floorPlanId = searchParams.get('floor_plan_id');

  if (!floorPlanId) {
    return NextResponse.json({ error: 'floor_plan_id is required' }, { status: 400 });
  }

  const { data, error: dbError } = await client
    .from('positioning_anchors')
    .select('*')
    .eq('floor_plan_id', floorPlanId)
    .order('created_at', { ascending: true });

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/positioning/anchors
export async function POST(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const body = await request.json();
  const parsed = createAnchorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error: dbError } = await client
    .from('positioning_anchors')
    .insert(parsed.data)
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

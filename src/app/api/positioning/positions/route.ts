import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';
import { updatePositionSchema, batchUpdatePositionSchema } from '@/lib/positioning-schemas';

// GET /api/positioning/positions?floor_plan_id=X — get all live positions on a floor
export async function GET(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const floorPlanId = searchParams.get('floor_plan_id');

  if (!floorPlanId) {
    return NextResponse.json({ error: 'floor_plan_id is required' }, { status: 400 });
  }

  // Only positions updated in last 5 minutes are considered "live"
  const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data, error: dbError } = await client
    .from('attendee_positions')
    .select('*')
    .eq('floor_plan_id', floorPlanId)
    .gte('updated_at', cutoff);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/positioning/positions — update a single position
export async function POST(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const body = await request.json();
  const parsed = updatePositionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const posData = {
    ...parsed.data,
    updated_at: new Date().toISOString(),
  };

  // Upsert position
  const { data, error: dbError } = await client
    .from('attendee_positions')
    .upsert(posData, { onConflict: 'attendee_id' })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });

  // Also log to position history
  await client.from('position_history').insert({
    attendee_id: parsed.data.attendee_id,
    floor_plan_id: parsed.data.floor_plan_id,
    x: parsed.data.x,
    y: parsed.data.y,
  });

  return NextResponse.json(data);
}

// PUT /api/positioning/positions — batch update positions
export async function PUT(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const body = await request.json();
  const parsed = batchUpdatePositionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const now = new Date().toISOString();
  const positions = parsed.data.positions.map((p) => ({
    ...p,
    updated_at: now,
  }));

  const { error: dbError } = await client
    .from('attendee_positions')
    .upsert(positions, { onConflict: 'attendee_id' });

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  // Batch log to history
  const historyEntries = parsed.data.positions.map((p) => ({
    attendee_id: p.attendee_id,
    floor_plan_id: p.floor_plan_id,
    x: p.x,
    y: p.y,
  }));
  await client.from('position_history').insert(historyEntries);

  return NextResponse.json({ updated: positions.length });
}

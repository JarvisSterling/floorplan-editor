import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';
import { createFloorSchema } from '@/lib/floor-schemas';

// GET /api/floor-plans — list floor plans (filterable by event_id)
export async function GET(request: NextRequest) {
  const authResult = getAuthClient(request);
  if (authResult.error) return authResult.error;
  const { client } = authResult;

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');

  let query = client.from('floor_plans').select('*').order('sort_order');
  if (eventId) query = query.eq('event_id', eventId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/floor-plans — create floor plan
export async function POST(request: NextRequest) {
  const authResult = getAuthClient(request);
  if (authResult.error) return authResult.error;
  const { client } = authResult;

  const body = await request.json();
  const parsed = createFloorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await client.from('floor_plans').insert(parsed.data).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

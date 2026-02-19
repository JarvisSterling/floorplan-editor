import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';
import { createBoothSchema } from '@/lib/booth-schemas';

// GET /api/booths?event_id=X — list booths for an event
export async function GET(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');

  let query = client.from('booths').select('*, booth_profiles(*)');
  if (eventId) query = query.eq('event_id', eventId);

  const { data, error: dbError } = await query;
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/booths — create a booth
export async function POST(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const body = await request.json();
  const parsed = createBoothSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error: dbError } = await client.from('booths').insert(parsed.data).select().single();
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });

  // Also create an empty booth_profile
  await client.from('booth_profiles').insert({ booth_id: data.id });

  return NextResponse.json(data, { status: 201 });
}

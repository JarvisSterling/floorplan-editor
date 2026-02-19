import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/booths?event_id=X — list booths for an event
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');

  let query = supabaseAdmin.from('booths').select('*, booth_profiles(*)');
  if (eventId) query = query.eq('event_id', eventId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/booths — create a booth
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { data, error } = await supabaseAdmin.from('booths').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Also create an empty booth_profile
  await supabaseAdmin.from('booth_profiles').insert({ booth_id: data.id });

  return NextResponse.json(data, { status: 201 });
}

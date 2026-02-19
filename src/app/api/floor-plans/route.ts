import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/floor-plans — list floor plans (filterable by event_id)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');

  let query = supabaseAdmin.from('floor_plans').select('*').order('sort_order');
  if (eventId) query = query.eq('event_id', eventId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/floor-plans — create floor plan
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { data, error } = await supabaseAdmin.from('floor_plans').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

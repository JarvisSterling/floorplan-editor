import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

type Params = { params: Promise<{ id: string }> };

// POST /api/floor-plans/[id]/objects — create object
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from('floor_plan_objects')
    .insert({ ...body, floor_plan_id: id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

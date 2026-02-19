import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

type Params = { params: Promise<{ id: string }> };

// GET /api/floor-plans/[id] — get floor plan with all objects
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { data: floorPlan, error } = await supabaseAdmin
    .from('floor_plans')
    .select('*, floor_plan_objects(*)')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(floorPlan);
}

// PUT /api/floor-plans/[id] — update floor plan
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from('floor_plans')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// DELETE /api/floor-plans/[id] — delete floor plan
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { error } = await supabaseAdmin.from('floor_plans').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

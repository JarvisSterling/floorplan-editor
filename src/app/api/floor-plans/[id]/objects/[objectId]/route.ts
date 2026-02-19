import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

type Params = { params: Promise<{ id: string; objectId: string }> };

// PUT /api/floor-plans/[id]/objects/[objectId] — update object
export async function PUT(request: NextRequest, { params }: Params) {
  const { id, objectId } = await params;
  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from('floor_plan_objects')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', objectId)
    .eq('floor_plan_id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// DELETE /api/floor-plans/[id]/objects/[objectId] — delete object
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id, objectId } = await params;
  const { error } = await supabaseAdmin
    .from('floor_plan_objects')
    .delete()
    .eq('id', objectId)
    .eq('floor_plan_id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';
import { updateFloorSchema } from '@/lib/floor-schemas';

type Params = { params: Promise<{ id: string }> };

// GET /api/floor-plans/[id] — get floor plan with all objects
export async function GET(request: NextRequest, { params }: Params) {
  const authResult = getAuthClient(request);
  if (authResult.error) return authResult.error;
  const { client } = authResult;

  const { id } = await params;
  const { data: floorPlan, error } = await client
    .from('floor_plans')
    .select('*, floor_plan_objects(*)')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(floorPlan);
}

// PUT /api/floor-plans/[id] — update floor plan
export async function PUT(request: NextRequest, { params }: Params) {
  const authResult = getAuthClient(request);
  if (authResult.error) return authResult.error;
  const { client } = authResult;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateFloorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await client
    .from('floor_plans')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// DELETE /api/floor-plans/[id] — delete floor plan
export async function DELETE(request: NextRequest, { params }: Params) {
  const authResult = getAuthClient(request);
  if (authResult.error) return authResult.error;
  const { client } = authResult;

  const { id } = await params;
  const { error } = await client.from('floor_plans').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

type Params = { params: Promise<{ id: string }> };

// POST /api/floor-plans/[id]/duplicate — duplicate a floor with all its objects
export async function POST(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  // Get source floor plan
  const { data: source, error: fetchErr } = await supabaseAdmin
    .from('floor_plans')
    .select('*, floor_plan_objects(*)')
    .eq('id', id)
    .single();

  if (fetchErr || !source) {
    return NextResponse.json({ error: 'Floor plan not found' }, { status: 404 });
  }

  // Get max sort_order for this event
  const { data: maxSort } = await supabaseAdmin
    .from('floor_plans')
    .select('sort_order')
    .eq('event_id', source.event_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const newSortOrder = (maxSort?.sort_order ?? 0) + 1;
  const newFloorId = uuidv4();
  const now = new Date().toISOString();

  // Create new floor plan
  const { floor_plan_objects: sourceObjects, id: _srcId, created_at: _ca, updated_at: _ua, ...floorData } = source;
  const { data: newFloor, error: insertErr } = await supabaseAdmin
    .from('floor_plans')
    .insert({
      ...floorData,
      id: newFloorId,
      name: `${source.name} (Copy)`,
      sort_order: newSortOrder,
      floor_number: source.floor_number + 1,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 400 });
  }

  // Duplicate objects
  if (sourceObjects && sourceObjects.length > 0) {
    const newObjects = sourceObjects.map((obj: Record<string, unknown>) => {
      const { id: _objId, created_at: _oca, updated_at: _oua, ...objData } = obj;
      return {
        ...objData,
        id: uuidv4(),
        floor_plan_id: newFloorId,
        created_at: now,
        updated_at: now,
      };
    });

    await supabaseAdmin.from('floor_plan_objects').insert(newObjects);
  }

  return NextResponse.json(newFloor, { status: 201 });
}

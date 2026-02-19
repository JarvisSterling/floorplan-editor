import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

type Params = { params: Promise<{ id: string }> };

// PUT /api/floor-plans/[id]/objects/bulk — bulk update objects
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { updates } = await request.json() as {
    updates: Array<{ id: string; [key: string]: unknown }>;
  };

  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: 'updates array required' }, { status: 400 });
  }

  const results = await Promise.all(
    updates.map((update) => {
      const { id: objectId, ...fields } = update;
      return supabaseAdmin
        .from('floor_plan_objects')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('id', objectId)
        .eq('floor_plan_id', id)
        .select()
        .single();
    })
  );

  const errors = results.filter((r) => r.error);
  if (errors.length > 0) {
    return NextResponse.json(
      { error: 'Some updates failed', details: errors.map((e) => e.error?.message) },
      { status: 400 }
    );
  }

  return NextResponse.json(results.map((r) => r.data));
}

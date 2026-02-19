import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { reorderFloorsSchema } from '@/lib/floor-schemas';

// PUT /api/floor-plans/reorder — reorder floors by passing ordered array of IDs
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const parsed = reorderFloorsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { floor_ids } = parsed.data;

  // Update sort_order for each floor
  const updates = floor_ids.map((id, index) =>
    supabaseAdmin
      .from('floor_plans')
      .update({ sort_order: index, updated_at: new Date().toISOString() })
      .eq('id', id)
  );

  const results = await Promise.all(updates);
  const errors = results.filter((r) => r.error);
  if (errors.length > 0) {
    return NextResponse.json({ error: 'Failed to reorder some floors' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';
import { reorderFloorsSchema } from '@/lib/floor-schemas';

// PUT /api/floor-plans/reorder — reorder floors by passing ordered array of IDs
export async function PUT(request: NextRequest) {
  const authResult = getAuthClient(request);
  if (authResult.error) return authResult.error;
  const { client } = authResult;

  const body = await request.json();
  const parsed = reorderFloorsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { floor_ids } = parsed.data;

  // Verify all floors exist and belong to same event/user (ownership check)
  const { data: floors, error: fetchError } = await client
    .from('floor_plans')
    .select('id, event_id')
    .in('id', floor_ids);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (floors.length !== floor_ids.length) {
    return NextResponse.json({ error: 'Some floors not found or not accessible' }, { status: 404 });
  }

  // Check all floors belong to same event
  const eventIds = new Set(floors.map(f => f.event_id));
  if (eventIds.size > 1) {
    return NextResponse.json({ error: 'Cannot reorder floors from different events' }, { status: 400 });
  }

  // Update sort_order for each floor
  const updates = floor_ids.map((id, index) =>
    client
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

import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';
import type { FloorPlanObject, AttendeePosition } from '@/types/database';

// GET /api/positioning/occupancy?floor_plan_id=X — zone occupancy counts
export async function GET(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const floorPlanId = searchParams.get('floor_plan_id');

  if (!floorPlanId) {
    return NextResponse.json({ error: 'floor_plan_id is required' }, { status: 400 });
  }

  // Get zones
  const { data: zones, error: zoneError } = await client
    .from('floor_plan_objects')
    .select('*')
    .eq('floor_plan_id', floorPlanId)
    .eq('type', 'zone');

  if (zoneError) return NextResponse.json({ error: zoneError.message }, { status: 500 });

  // Get live positions
  const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: positions, error: posError } = await client
    .from('attendee_positions')
    .select('*')
    .eq('floor_plan_id', floorPlanId)
    .gte('updated_at', cutoff);

  if (posError) return NextResponse.json({ error: posError.message }, { status: 500 });

  // Count attendees in each zone
  const occupancy = (zones || []).map((zone: FloorPlanObject) => {
    const w = zone.width || 0;
    const h = zone.height || 0;
    const count = (positions || []).filter((pos: AttendeePosition) =>
      pos.x >= zone.x && pos.x <= zone.x + w &&
      pos.y >= zone.y && pos.y <= zone.y + h
    ).length;

    return {
      zone_id: zone.id,
      label: zone.label,
      count,
      area_sqm: (w * h) / (50 * 50), // PX_PER_METER^2
      density_per_sqm: w > 0 && h > 0 ? count / ((w * h) / (50 * 50)) : 0,
    };
  });

  const totalOnFloor = (positions || []).length;

  return NextResponse.json({
    floor_plan_id: floorPlanId,
    total_attendees: totalOnFloor,
    zones: occupancy,
  });
}

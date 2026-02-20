import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';

// GET /api/analytics/traffic-flow?floor_plan_id=X — traffic flow between zones
export async function GET(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const floorPlanId = searchParams.get('floor_plan_id');
  const hours = parseInt(searchParams.get('hours') || '24', 10);

  if (!floorPlanId) {
    return NextResponse.json({ error: 'floor_plan_id is required' }, { status: 400 });
  }

  // Get zones on this floor
  const { data: zones } = await client
    .from('floor_plan_objects')
    .select('id, label, x, y, width, height')
    .eq('floor_plan_id', floorPlanId)
    .eq('type', 'zone');

  if (!zones || zones.length < 2) {
    return NextResponse.json({ flows: [], message: 'Need at least 2 zones for flow analysis' });
  }

  // Get position history
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { data: history } = await client
    .from('position_history')
    .select('attendee_id, x, y, recorded_at')
    .eq('floor_plan_id', floorPlanId)
    .gte('recorded_at', cutoff)
    .order('attendee_id')
    .order('recorded_at', { ascending: true })
    .limit(50000);

  if (!history || history.length === 0) {
    return NextResponse.json({ flows: [], message: 'No position history' });
  }

  // Determine which zone a point is in
  function getZone(x: number, y: number): string | null {
    for (const z of zones!) {
      const zone = z as { id: string; x: number; y: number; width: number | null; height: number | null };
      const w = zone.width || 0;
      const h = zone.height || 0;
      if (x >= zone.x && x <= zone.x + w && y >= zone.y && y <= zone.y + h) {
        return zone.id;
      }
    }
    return null;
  }

  // Track transitions per attendee
  const flows = new Map<string, number>(); // "fromZone->toZone" -> count

  type HistEntry = { attendee_id: string; x: number; y: number; recorded_at: string };
  let prevAttendee = '';
  let prevZone: string | null = null;

  for (const pos of history as HistEntry[]) {
    if (pos.attendee_id !== prevAttendee) {
      prevAttendee = pos.attendee_id;
      prevZone = getZone(pos.x, pos.y);
      continue;
    }

    const currentZone = getZone(pos.x, pos.y);
    if (currentZone && prevZone && currentZone !== prevZone) {
      const key = `${prevZone}->${currentZone}`;
      flows.set(key, (flows.get(key) || 0) + 1);
    }
    if (currentZone) prevZone = currentZone;
  }

  // Build zone map for labels
  const zoneMap = new Map(zones.map((z: { id: string; label: string | null }) => [z.id, z.label || 'Unnamed']));

  const flowList = Array.from(flows.entries())
    .map(([key, count]) => {
      const [from, to] = key.split('->');
      return {
        from_zone_id: from,
        from_zone_label: zoneMap.get(from) || 'Unknown',
        to_zone_id: to,
        to_zone_label: zoneMap.get(to) || 'Unknown',
        transition_count: count,
      };
    })
    .sort((a, b) => b.transition_count - a.transition_count);

  return NextResponse.json({
    floor_plan_id: floorPlanId,
    time_window_hours: hours,
    flows: flowList,
  });
}

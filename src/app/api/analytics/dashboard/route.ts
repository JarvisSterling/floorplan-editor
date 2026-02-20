import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';

// GET /api/analytics/dashboard?event_id=X — real-time event dashboard
export async function GET(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');

  if (!eventId) {
    return NextResponse.json({ error: 'event_id is required' }, { status: 400 });
  }

  // Get floor plans
  const { data: floors } = await client
    .from('floor_plans')
    .select('id, name, floor_number')
    .eq('event_id', eventId);

  const floorIds = (floors || []).map((f: { id: string }) => f.id);

  // Live attendee count per floor
  const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: livePositions } = await client
    .from('attendee_positions')
    .select('floor_plan_id')
    .in('floor_plan_id', floorIds)
    .gte('updated_at', cutoff);

  const floorCounts: Record<string, number> = {};
  for (const pos of (livePositions || [])) {
    const fid = (pos as { floor_plan_id: string }).floor_plan_id;
    floorCounts[fid] = (floorCounts[fid] || 0) + 1;
  }

  // Total booths and visits
  const { count: totalBooths } = await client
    .from('booths')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId);

  const { data: recentVisits } = await client
    .from('booth_visits')
    .select('id, booth_id, dwell_seconds')
    .in('booth_id', (await client.from('booths').select('id').eq('event_id', eventId)).data?.map((b: { id: string }) => b.id) || [])
    .gte('entered_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

  const avgDwell = (recentVisits || []).reduce((sum: number, v: { dwell_seconds?: number | null }) =>
    sum + (v.dwell_seconds || 0), 0) / Math.max((recentVisits || []).length, 1);

  return NextResponse.json({
    event_id: eventId,
    timestamp: new Date().toISOString(),
    live: {
      total_attendees_on_site: (livePositions || []).length,
      per_floor: (floors || []).map((f: { id: string; name: string; floor_number: number }) => ({
        floor_plan_id: f.id,
        name: f.name,
        floor_number: f.floor_number,
        attendee_count: floorCounts[f.id] || 0,
      })),
    },
    booths: {
      total: totalBooths || 0,
      visits_last_hour: (recentVisits || []).length,
      avg_dwell_seconds: Math.round(avgDwell),
    },
  });
}

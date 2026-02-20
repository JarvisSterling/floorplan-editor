import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';
import { z } from 'zod';

const visitSchema = z.object({
  booth_id: z.string().uuid(),
  attendee_id: z.string().uuid(),
  source: z.enum(['positioning', 'qr_scan', 'manual']).optional().default('positioning'),
});

const exitSchema = z.object({
  visit_id: z.string().uuid(),
});

// GET /api/analytics/booth-visits?booth_id=X or ?event_id=X
export async function GET(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const boothId = searchParams.get('booth_id');
  const eventId = searchParams.get('event_id');

  if (!boothId && !eventId) {
    return NextResponse.json({ error: 'booth_id or event_id is required' }, { status: 400 });
  }

  if (boothId) {
    const { data, error: dbError } = await client
      .from('booth_visits')
      .select('*')
      .eq('booth_id', boothId)
      .order('entered_at', { ascending: false })
      .limit(100);

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

    // Compute stats
    const totalVisits = (data || []).length;
    const avgDwell = (data || []).reduce((s: number, v: { dwell_seconds?: number | null }) =>
      s + (v.dwell_seconds || 0), 0) / Math.max(totalVisits, 1);
    const uniqueAttendees = new Set((data || []).map((v: { attendee_id: string }) => v.attendee_id)).size;

    return NextResponse.json({
      booth_id: boothId,
      stats: { total_visits: totalVisits, unique_attendees: uniqueAttendees, avg_dwell_seconds: Math.round(avgDwell) },
      visits: data,
    });
  }

  // Event-level booth ranking
  const { data: booths } = await client
    .from('booths')
    .select('id, booth_number')
    .eq('event_id', eventId!);

  const boothIds = (booths || []).map((b: { id: string }) => b.id);
  const { data: allVisits } = await client
    .from('booth_visits')
    .select('booth_id, dwell_seconds')
    .in('booth_id', boothIds);

  // Rank booths by visit count
  const visitCounts: Record<string, { count: number; totalDwell: number }> = {};
  for (const v of (allVisits || [])) {
    const bid = (v as { booth_id: string }).booth_id;
    if (!visitCounts[bid]) visitCounts[bid] = { count: 0, totalDwell: 0 };
    visitCounts[bid].count++;
    visitCounts[bid].totalDwell += (v as { dwell_seconds?: number | null }).dwell_seconds || 0;
  }

  const boothMap = new Map((booths || []).map((b: { id: string; booth_number: string }) => [b.id, b.booth_number]));
  const rankings = Object.entries(visitCounts)
    .map(([bid, stats]) => ({
      booth_id: bid,
      booth_number: boothMap.get(bid) || 'Unknown',
      visit_count: stats.count,
      avg_dwell_seconds: Math.round(stats.totalDwell / stats.count),
    }))
    .sort((a, b) => b.visit_count - a.visit_count);

  return NextResponse.json({ event_id: eventId, rankings });
}

// POST /api/analytics/booth-visits — record a visit
export async function POST(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const body = await request.json();
  const parsed = visitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error: dbError } = await client
    .from('booth_visits')
    .insert(parsed.data)
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/analytics/booth-visits — record exit
export async function PATCH(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const body = await request.json();
  const parsed = exitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { data: visit } = await client
    .from('booth_visits')
    .select('entered_at')
    .eq('id', parsed.data.visit_id)
    .single();

  const now = new Date();
  const dwellSeconds = visit
    ? Math.round((now.getTime() - new Date(visit.entered_at as string).getTime()) / 1000)
    : null;

  const { data, error: dbError } = await client
    .from('booth_visits')
    .update({ exited_at: now.toISOString(), dwell_seconds: dwellSeconds })
    .eq('id', parsed.data.visit_id)
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
  return NextResponse.json(data);
}

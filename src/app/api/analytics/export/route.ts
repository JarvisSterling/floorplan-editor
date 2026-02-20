import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';
import { z } from 'zod';

/** Escape a value for safe CSV output (prevents formula injection & handles commas/quotes) */
function csvEscape(val: unknown): string {
  if (val === null || val === undefined) return '';
  let s = String(val);
  // Prevent formula injection — prefix with single quote if starts with =, +, -, @, \t, \r
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  // Wrap in quotes if contains comma, quote, or newline
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const exportParamsSchema = z.object({
  event_id: z.string().uuid(),
  format: z.enum(['csv', 'json']).optional().default('csv'),
  type: z.enum(['booth_visits', 'booth_performance']).optional().default('booth_visits'),
});

// GET /api/analytics/export?event_id=X&format=csv — export analytics data
export async function GET(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const parsed = exportParamsSchema.safeParse({
    event_id: searchParams.get('event_id'),
    format: searchParams.get('format') || undefined,
    type: searchParams.get('type') || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }
  const { event_id: eventId, format, type: dataType } = parsed.data;

  if (dataType === 'booth_visits') {
    const { data: booths } = await client
      .from('booths')
      .select('id, booth_number')
      .eq('event_id', eventId);

    const boothIds = (booths || []).map((b: { id: string }) => b.id);
    const boothMap = new Map((booths || []).map((b: { id: string; booth_number: string }) => [b.id, b.booth_number]));

    const { data: visits } = await client
      .from('booth_visits')
      .select('*')
      .in('booth_id', boothIds)
      .order('entered_at', { ascending: true });

    if (format === 'csv') {
      const header = 'visit_id,booth_id,booth_number,attendee_id,entered_at,exited_at,dwell_seconds,source\n';
      const rows = (visits || []).map((v: Record<string, unknown>) =>
        [v.id, v.booth_id, boothMap.get(v.booth_id as string) || '', v.attendee_id, v.entered_at, v.exited_at || '', v.dwell_seconds || '', v.source].map(csvEscape).join(',')
      ).join('\n');

      return new Response(header + rows, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="booth_visits_${eventId}.csv"`,
        },
      });
    }

    return NextResponse.json({ data: visits });
  }

  if (dataType === 'booth_performance') {
    const { data: booths } = await client
      .from('booths')
      .select('id, booth_number, status, category, size_sqm')
      .eq('event_id', eventId);

    const boothIds = (booths || []).map((b: { id: string }) => b.id);

    const { data: visits } = await client
      .from('booth_visits')
      .select('booth_id, dwell_seconds')
      .in('booth_id', boothIds);

    // Aggregate
    const stats: Record<string, { visits: number; totalDwell: number; uniqueAttendees: Set<string> }> = {};
    for (const v of (visits || []) as Array<{ booth_id: string; dwell_seconds?: number | null; attendee_id?: string }>) {
      if (!stats[v.booth_id]) stats[v.booth_id] = { visits: 0, totalDwell: 0, uniqueAttendees: new Set() };
      stats[v.booth_id].visits++;
      stats[v.booth_id].totalDwell += v.dwell_seconds || 0;
    }

    if (format === 'csv') {
      const header = 'booth_number,status,category,size_sqm,total_visits,avg_dwell_seconds\n';
      const rows = (booths || []).map((b: Record<string, unknown>) => {
        const s = stats[b.id as string];
        return [b.booth_number, b.status, b.category || '', b.size_sqm || '', s?.visits || 0, s ? Math.round(s.totalDwell / Math.max(s.visits, 1)) : 0].map(csvEscape).join(',');
      }).join('\n');

      return new Response(header + rows, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="booth_performance_${eventId}.csv"`,
        },
      });
    }

    return NextResponse.json({
      data: (booths || []).map((b: Record<string, unknown>) => {
        const s = stats[b.id as string];
        return { ...b, total_visits: s?.visits || 0, avg_dwell_seconds: s ? Math.round(s.totalDwell / Math.max(s.visits, 1)) : 0 };
      }),
    });
  }

  // dataType is validated by Zod so this is unreachable, but satisfy TypeScript
  return NextResponse.json({ error: 'Invalid data type' }, { status: 400 });
}

import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';
import { z } from 'zod';

const timelapseSchema = z.object({
  floor_plan_id: z.string().uuid(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  interval_minutes: z.number().int().min(1).max(60).optional().default(15),
  grid_size_px: z.number().int().min(10).max(200).optional().default(50),
});

// POST /api/analytics/heatmap-timelapse — post-event heatmap animation data
export async function POST(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const body = await request.json();
  const parsed = timelapseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { floor_plan_id, start_time, end_time, interval_minutes, grid_size_px } = parsed.data;

  // Fetch position history
  const { data: history, error: histError } = await client
    .from('position_history')
    .select('x, y, recorded_at')
    .eq('floor_plan_id', floor_plan_id)
    .gte('recorded_at', start_time)
    .lte('recorded_at', end_time)
    .order('recorded_at', { ascending: true })
    .limit(50000);

  if (histError) return NextResponse.json({ error: histError.message }, { status: 500 });
  if (!history || history.length === 0) {
    return NextResponse.json({ frames: [], message: 'No position history found' });
  }

  // Build time frames
  const startMs = new Date(start_time).getTime();
  const endMs = new Date(end_time).getTime();
  const intervalMs = interval_minutes * 60 * 1000;
  const frames: Array<{
    timestamp: string;
    cells: Array<{ x: number; y: number; count: number }>;
    total_positions: number;
  }> = [];

  for (let t = startMs; t < endMs; t += intervalMs) {
    const frameStart = t;
    const frameEnd = t + intervalMs;

    // Filter positions in this time window
    const framePositions = (history as Array<{ x: number; y: number; recorded_at: string }>).filter((p) => {
      const ts = new Date(p.recorded_at).getTime();
      return ts >= frameStart && ts < frameEnd;
    });

    // Grid aggregation
    const grid = new Map<string, number>();
    for (const pos of framePositions) {
      const col = Math.floor(pos.x / grid_size_px);
      const row = Math.floor(pos.y / grid_size_px);
      const key = `${col},${row}`;
      grid.set(key, (grid.get(key) || 0) + 1);
    }

    const cells = Array.from(grid.entries()).map(([key, count]) => {
      const [col, row] = key.split(',').map(Number);
      return { x: col * grid_size_px, y: row * grid_size_px, count };
    });

    frames.push({
      timestamp: new Date(frameStart).toISOString(),
      cells,
      total_positions: framePositions.length,
    });
  }

  return NextResponse.json({
    floor_plan_id,
    interval_minutes,
    grid_size_px,
    frame_count: frames.length,
    frames,
  });
}

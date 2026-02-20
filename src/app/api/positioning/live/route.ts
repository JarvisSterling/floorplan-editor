import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';

// GET /api/positioning/live?floor_plan_id=X — SSE endpoint for live position updates
export async function GET(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const floorPlanId = searchParams.get('floor_plan_id');

  if (!floorPlanId) {
    return NextResponse.json({ error: 'floor_plan_id is required' }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Poll for position updates every 2 seconds
      const interval = setInterval(async () => {
        try {
          const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
          const { data, error: dbError } = await client
            .from('attendee_positions')
            .select('*')
            .eq('floor_plan_id', floorPlanId)
            .gte('updated_at', cutoff);

          if (dbError) {
            controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: dbError.message })}\n\n`));
            return;
          }

          controller.enqueue(
            encoder.encode(`event: positions\ndata: ${JSON.stringify(data || [])}\n\n`)
          );
        } catch {
          // Connection likely closed
          clearInterval(interval);
        }
      }, 2000);

      // Send initial data
      (async () => {
        try {
          const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
          const { data } = await client
            .from('attendee_positions')
            .select('*')
            .eq('floor_plan_id', floorPlanId)
            .gte('updated_at', cutoff);

          controller.enqueue(
            encoder.encode(`event: positions\ndata: ${JSON.stringify(data || [])}\n\n`)
          );
        } catch {}
      })();

      // Cleanup on abort
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

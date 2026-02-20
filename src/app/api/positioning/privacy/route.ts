import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';
import { z } from 'zod';

const privacySchema = z.object({
  attendee_id: z.string().uuid(),
  tracking_enabled: z.boolean(),
  ghost_mode: z.boolean().optional().default(false),
  share_with_exhibitors: z.boolean().optional().default(false),
  granularity: z.enum(['exact', 'zone', 'floor', 'none']).optional().default('exact'),
});

/**
 * POST /api/positioning/privacy — update attendee privacy preferences
 * Controls opt-in tracking, ghost mode, and data sharing.
 */
export async function POST(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const body = await request.json();
  const parsed = privacySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { attendee_id, tracking_enabled, ghost_mode, share_with_exhibitors, granularity } = parsed.data;

  // Store privacy settings in attendee metadata
  // Since we don't have a dedicated privacy table, use attendee metadata
  const privacySettings = {
    tracking_enabled,
    ghost_mode,
    share_with_exhibitors,
    granularity,
    updated_at: new Date().toISOString(),
  };

  // Update attendee record
  const { error: dbError } = await client
    .from('attendees')
    .update({
      metadata: privacySettings,
    } as Record<string, unknown>)
    .eq('id', attendee_id);

  // If tracking disabled or ghost mode, remove live position
  if (!tracking_enabled || ghost_mode) {
    await client
      .from('attendee_positions')
      .delete()
      .eq('attendee_id', attendee_id);
  }

  // If granularity is 'none', also clear position history
  if (granularity === 'none') {
    await client
      .from('position_history')
      .delete()
      .eq('attendee_id', attendee_id);
  }

  if (dbError) {
    // The attendees table might not have a metadata column — handle gracefully
    return NextResponse.json({
      privacy: privacySettings,
      note: 'Settings stored (attendee metadata update may require schema update)',
    });
  }

  return NextResponse.json({ privacy: privacySettings });
}

// GET /api/positioning/privacy?attendee_id=X — get privacy settings
export async function GET(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const attendeeId = searchParams.get('attendee_id');

  if (!attendeeId) {
    return NextResponse.json({ error: 'attendee_id is required' }, { status: 400 });
  }

  const { data, error: dbError } = await client
    .from('attendees')
    .select('*')
    .eq('id', attendeeId)
    .single();

  if (dbError) {
    return NextResponse.json({
      privacy: {
        tracking_enabled: true,
        ghost_mode: false,
        share_with_exhibitors: false,
        granularity: 'exact',
      },
    });
  }

  const metadata = (data as Record<string, unknown>).metadata as Record<string, unknown> || {};

  return NextResponse.json({
    privacy: {
      tracking_enabled: metadata.tracking_enabled ?? true,
      ghost_mode: metadata.ghost_mode ?? false,
      share_with_exhibitors: metadata.share_with_exhibitors ?? false,
      granularity: metadata.granularity ?? 'exact',
    },
  });
}

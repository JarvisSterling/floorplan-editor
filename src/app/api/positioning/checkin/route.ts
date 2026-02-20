import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';
import type { PositioningAnchor } from '@/types/database';
import { z } from 'zod';

const checkinSchema = z.object({
  attendee_id: z.string().uuid(),
  anchor_hardware_id: z.string().min(1),
  type: z.enum(['qr', 'nfc']),
});

/**
 * POST /api/positioning/checkin — QR/NFC zone check-in
 * When an attendee scans a QR code or taps NFC, their position snaps to that anchor's location.
 */
export async function POST(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const body = await request.json();
  const parsed = checkinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { attendee_id, anchor_hardware_id, type } = parsed.data;

  // Find the anchor
  const { data: anchor, error: anchorError } = await client
    .from('positioning_anchors')
    .select('*')
    .eq('hardware_id', anchor_hardware_id)
    .eq('type', type)
    .eq('status', 'active')
    .single();

  if (anchorError || !anchor) {
    return NextResponse.json({ error: 'Anchor not found or inactive' }, { status: 404 });
  }

  const typedAnchor = anchor as PositioningAnchor;
  const now = new Date().toISOString();

  // Update anchor last_seen
  await client
    .from('positioning_anchors')
    .update({ last_seen: now })
    .eq('id', typedAnchor.id);

  // Update attendee position (snap to anchor location)
  const posData = {
    attendee_id,
    floor_plan_id: typedAnchor.floor_plan_id,
    x: typedAnchor.x,
    y: typedAnchor.y,
    accuracy_m: 1.0, // high accuracy for direct scan
    source: `${type}_checkin`,
    updated_at: now,
  };

  await client
    .from('attendee_positions')
    .upsert(posData, { onConflict: 'attendee_id' });

  // Log history
  await client.from('position_history').insert({
    attendee_id,
    floor_plan_id: typedAnchor.floor_plan_id,
    x: typedAnchor.x,
    y: typedAnchor.y,
  });

  return NextResponse.json({
    checked_in: true,
    position: { x: typedAnchor.x, y: typedAnchor.y },
    floor_plan_id: typedAnchor.floor_plan_id,
    anchor_id: typedAnchor.id,
  });
}

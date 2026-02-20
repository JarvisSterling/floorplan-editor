import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';
import { estimatePosition, type AnchorReading } from '@/lib/trilateration';
import type { PositioningAnchor } from '@/types/database';
import { z } from 'zod';

const trilaterateSchema = z.object({
  floor_plan_id: z.string().uuid(),
  attendee_id: z.string().uuid(),
  readings: z.array(z.object({
    anchor_hardware_id: z.string(),
    rssi: z.number().max(0),
    tx_power: z.number().optional(),
  })).min(1).max(20),
  record_history: z.boolean().optional().default(true),
});

// POST /api/positioning/trilaterate — estimate position from BLE readings
export async function POST(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const body = await request.json();
  const parsed = trilaterateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { floor_plan_id, attendee_id, readings, record_history } = parsed.data;

  // Look up anchor positions by hardware_id
  const hardwareIds = readings.map((r) => r.anchor_hardware_id);
  const { data: anchors, error: anchorError } = await client
    .from('positioning_anchors')
    .select('*')
    .eq('floor_plan_id', floor_plan_id)
    .eq('status', 'active')
    .in('hardware_id', hardwareIds);

  if (anchorError) return NextResponse.json({ error: anchorError.message }, { status: 500 });
  if (!anchors || anchors.length === 0) {
    return NextResponse.json({ error: 'No matching active anchors found' }, { status: 404 });
  }

  // Build anchor readings with positions
  const anchorMap = new Map((anchors as PositioningAnchor[]).map((a) => [a.hardware_id, a]));
  const anchorReadings: AnchorReading[] = [];

  for (const reading of readings) {
    const anchor = anchorMap.get(reading.anchor_hardware_id);
    if (!anchor) continue;
    anchorReadings.push({
      anchor_id: anchor.id,
      x: anchor.x,
      y: anchor.y,
      rssi: reading.rssi,
      tx_power: reading.tx_power,
    });
  }

  if (anchorReadings.length === 0) {
    return NextResponse.json({ error: 'No valid anchor readings' }, { status: 400 });
  }

  const estimate = estimatePosition(anchorReadings);
  if (!estimate) {
    return NextResponse.json({ error: 'Position estimation failed' }, { status: 500 });
  }

  // Update live position
  const posData = {
    attendee_id,
    floor_plan_id,
    x: estimate.x,
    y: estimate.y,
    accuracy_m: estimate.accuracy_m,
    source: `ble_${estimate.method}`,
    updated_at: new Date().toISOString(),
  };

  await client
    .from('attendee_positions')
    .upsert(posData, { onConflict: 'attendee_id' });

  // Record history
  if (record_history) {
    await client.from('position_history').insert({
      attendee_id,
      floor_plan_id,
      x: estimate.x,
      y: estimate.y,
    });
  }

  return NextResponse.json({
    position: { x: estimate.x, y: estimate.y },
    accuracy_m: estimate.accuracy_m,
    method: estimate.method,
    anchors_used: anchorReadings.length,
  });
}

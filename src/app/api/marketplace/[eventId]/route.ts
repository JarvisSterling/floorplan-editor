import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/marketplace/[eventId] — public marketplace data
// NOTE: This endpoint intentionally has no authentication to allow public access
// to the marketplace for browsing available booths. Rate limiting should be
// handled at the infrastructure level (e.g., Vercel, CDN, or load balancer).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  // Get all floor plans for this event
  const { data: floorPlans, error: fpError } = await supabaseAdmin
    .from('floor_plans')
    .select('*, floor_plan_objects(*)')
    .eq('event_id', eventId)
    .eq('is_published', true)
    .order('sort_order');

  if (fpError) return NextResponse.json({ error: fpError.message }, { status: 400 });
  if (!floorPlans || floorPlans.length === 0) {
    return NextResponse.json({ error: 'No published floor plans found' }, { status: 404 });
  }

  // Get all booths for this event with profiles
  const { data: booths, error: boothError } = await supabaseAdmin
    .from('booths')
    .select('*, booth_profiles(*)')
    .eq('event_id', eventId);

  if (boothError) return NextResponse.json({ error: boothError.message }, { status: 400 });

  return NextResponse.json({
    floorPlans,
    booths: booths || [],
  });
}

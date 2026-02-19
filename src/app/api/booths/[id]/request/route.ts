import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { boothRequestSchema } from '@/lib/booth-schemas';

// POST /api/booths/[id]/request — submit a booth request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = boothRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  // Check booth exists
  const { data: booth, error: boothErr } = await supabaseAdmin
    .from('booths')
    .select('id, status')
    .eq('id', id)
    .single();

  if (boothErr || !booth) {
    return NextResponse.json({ error: 'Booth not found' }, { status: 404 });
  }

  const isWaitlist = booth.status === 'reserved' || booth.status === 'sold';

  // Create request
  const { data: req, error: reqErr } = await supabaseAdmin
    .from('booth_requests')
    .insert({
      booth_id: id,
      requester_name: parsed.data.requester_name,
      company: parsed.data.company,
      email: parsed.data.email,
      message: parsed.data.message ?? null,
      status: 'pending',
    })
    .select()
    .single();

  if (reqErr) return NextResponse.json({ error: reqErr.message }, { status: 400 });

  // If available, optimistically reserve
  if (booth.status === 'available') {
    await supabaseAdmin
      .from('booths')
      .update({ status: 'reserved' })
      .eq('id', id);
  }

  return NextResponse.json({ request: req, waitlist: isWaitlist }, { status: 201 });
}

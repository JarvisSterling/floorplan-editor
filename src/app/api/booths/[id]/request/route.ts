import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthClient } from '@/lib/supabase-auth';
import { boothRequestSchema } from '@/lib/booth-schemas';

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 10; // max 10 requests per IP per window

  const key = `booth-request:${ip}`;
  const current = rateLimitStore.get(key);

  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  return true;
}

// POST /api/booths/[id]/request — submit a booth request
// Requires authentication OR IP-based rate limiting for public access
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Try auth first, fall back to IP rate limiting
  const authResult = getAuthClient(request);
  let clientId: string;
  
  if (authResult.client) {
    // Authenticated request - use user ID for rate limiting
    const { data: { user }, error: userError } = await authResult.client.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    }
    clientId = user.id;
  } else {
    // Unauthenticated request - use IP for rate limiting
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Try again in 15 minutes.' 
      }, { status: 429 });
    }
    clientId = `ip:${ip}`;
  }

  const body = await request.json();
  const parsed = boothRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  // Check for duplicate requests (same email + booth_id within 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: existingRequest } = await supabaseAdmin
    .from('booth_requests')
    .select('id')
    .eq('booth_id', id)
    .eq('email', parsed.data.email)
    .gte('created_at', oneDayAgo)
    .single();

  if (existingRequest) {
    return NextResponse.json({ 
      error: 'Duplicate request detected. You have already requested this booth in the last 24 hours.' 
    }, { status: 409 });
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

  // Fix race condition: use conditional update WHERE status = 'available'
  if (booth.status === 'available') {
    const { data: updatedBooth, error: updateErr } = await supabaseAdmin
      .from('booths')
      .update({ status: 'reserved' })
      .eq('id', id)
      .eq('status', 'available') // Conditional update
      .select('status')
      .single();

    if (updateErr || !updatedBooth) {
      // Booth was taken by someone else
      return NextResponse.json({ 
        error: 'Booth was just reserved by another user. Please try a different booth.' 
      }, { status: 409 });
    }
  }

  return NextResponse.json({ request: req, waitlist: isWaitlist }, { status: 201 });
}

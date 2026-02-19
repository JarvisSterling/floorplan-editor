import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';
import { updateBoothProfileSchema } from '@/lib/booth-schemas';

// PUT /api/booths/[id]/profile — update booth profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateBoothProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error: dbError } = await client
    .from('booth_profiles')
    .update(parsed.data)
    .eq('booth_id', id)
    .select()
    .single();
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
  return NextResponse.json(data);
}

// GET /api/booths/[id]/profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const { id } = await params;
  const { data, error: dbError } = await client
    .from('booth_profiles')
    .select('*')
    .eq('booth_id', id)
    .single();
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 404 });
  return NextResponse.json(data);
}

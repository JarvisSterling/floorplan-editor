import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';
import { updateBoothSchema } from '@/lib/booth-schemas';

// PUT /api/booths/[id] — update booth
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateBoothSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error: dbError } = await client
    .from('booths')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single();
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
  return NextResponse.json(data);
}

// DELETE /api/booths/[id] — delete booth
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const { id } = await params;
  // Delete profile first (FK)
  await client.from('booth_profiles').delete().eq('booth_id', id);
  const { error: dbError } = await client.from('booths').delete().eq('id', id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

// GET /api/booths/[id] — get single booth with profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const { id } = await params;
  const { data, error: dbError } = await client
    .from('booths')
    .select('*, booth_profiles(*)')
    .eq('id', id)
    .single();
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 404 });
  return NextResponse.json(data);
}

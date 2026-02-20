import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';
import { updateAnchorSchema } from '@/lib/positioning-schemas';

type Params = { params: Promise<{ id: string }> };

// GET /api/positioning/anchors/:id
export async function GET(request: NextRequest, { params }: Params) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const { id } = await params;
  const { data, error: dbError } = await client
    .from('positioning_anchors')
    .select('*')
    .eq('id', id)
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 404 });
  return NextResponse.json(data);
}

// PATCH /api/positioning/anchors/:id
export async function PATCH(request: NextRequest, { params }: Params) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateAnchorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error: dbError } = await client
    .from('positioning_anchors')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
  return NextResponse.json(data);
}

// DELETE /api/positioning/anchors/:id
export async function DELETE(request: NextRequest, { params }: Params) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const { id } = await params;
  const { error: dbError } = await client
    .from('positioning_anchors')
    .delete()
    .eq('id', id);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

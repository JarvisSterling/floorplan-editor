import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';

type Params = { params: Promise<{ id: string }> };

// GET /api/templates/:id
export async function GET(request: NextRequest, { params }: Params) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const { id } = await params;
  const { data, error: dbError } = await client
    .from('floor_plan_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 404 });
  return NextResponse.json(data);
}

// DELETE /api/templates/:id
export async function DELETE(request: NextRequest, { params }: Params) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const { id } = await params;
  const { error: dbError } = await client
    .from('floor_plan_templates')
    .delete()
    .eq('id', id);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

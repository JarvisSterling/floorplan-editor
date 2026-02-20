import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';
import { z } from 'zod';

const bulkUpdateSchema = z.object({
  booth_ids: z.array(z.string().uuid()).min(1).max(200),
  updates: z.object({
    status: z.enum(['available', 'reserved', 'sold', 'blocked', 'premium']).optional(),
    pricing_tier: z.string().nullable().optional(),
    price: z.number().nonnegative().nullable().optional(),
    category: z.enum(['standard', 'island', 'corner', 'inline', 'peninsula']).nullable().optional(),
  }),
});

const bulkDeleteSchema = z.object({
  booth_ids: z.array(z.string().uuid()).min(1).max(200),
});

// PATCH /api/booths/bulk — bulk update booths
export async function PATCH(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const body = await request.json();
  const parsed = bulkUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { booth_ids, updates } = parsed.data;

  const { data, error: dbError } = await client
    .from('booths')
    .update(updates)
    .in('id', booth_ids)
    .select();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({
    updated: (data || []).length,
    booths: data,
  });
}

// DELETE /api/booths/bulk — bulk delete booths
export async function DELETE(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const body = await request.json();
  const parsed = bulkDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  // Delete profiles first
  await client
    .from('booth_profiles')
    .delete()
    .in('booth_id', parsed.data.booth_ids);

  const { error: dbError } = await client
    .from('booths')
    .delete()
    .in('id', parsed.data.booth_ids);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ deleted: parsed.data.booth_ids.length });
}

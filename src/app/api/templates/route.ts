import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';
import { z } from 'zod';

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  category: z.string().max(50).nullable().optional(),
  thumbnail_url: z.string().url().nullable().optional(),
  data: z.record(z.string(), z.unknown()),
  is_public: z.boolean().optional().default(false),
});

// GET /api/templates — list templates
export async function GET(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const publicOnly = searchParams.get('public') === 'true';

  let query = client.from('floor_plan_templates').select('*').order('created_at', { ascending: false });
  if (category) query = query.eq('category', category);
  if (publicOnly) query = query.eq('is_public', true);

  const { data, error: dbError } = await query;
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/templates — save a floor plan as template
export async function POST(request: NextRequest) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const body = await request.json();
  const parsed = createTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error: dbError } = await client
    .from('floor_plan_templates')
    .insert(parsed.data)
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

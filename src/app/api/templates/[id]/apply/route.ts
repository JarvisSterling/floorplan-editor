import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/supabase-auth';
import { z } from 'zod';

type Params = { params: Promise<{ id: string }> };

const applySchema = z.object({
  floor_plan_id: z.string().uuid(),
  clear_existing: z.boolean().optional().default(false),
});

// POST /api/templates/:id/apply — apply a template to a floor plan
export async function POST(request: NextRequest, { params }: Params) {
  const { client, error } = getAuthClient(request);
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { floor_plan_id, clear_existing } = parsed.data;

  // Get template
  const { data: template, error: tplError } = await client
    .from('floor_plan_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (tplError) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

  const templateData = template.data as { objects?: unknown[] };
  if (!templateData.objects || !Array.isArray(templateData.objects)) {
    return NextResponse.json({ error: 'Template has no objects data' }, { status: 400 });
  }

  // Clear existing objects if requested
  if (clear_existing) {
    await client
      .from('floor_plan_objects')
      .delete()
      .eq('floor_plan_id', floor_plan_id);
  }

  // Insert template objects with new floor_plan_id
  const objects = templateData.objects.map((obj: unknown) => {
    const o = obj as Record<string, unknown>;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, created_at: _ca, updated_at: _ua, floor_plan_id: _fp, ...rest } = o as Record<string, unknown> & { id?: unknown; created_at?: unknown; updated_at?: unknown; floor_plan_id?: unknown };
    return { ...rest, floor_plan_id };
  });

  const { data: inserted, error: insertError } = await client
    .from('floor_plan_objects')
    .insert(objects)
    .select();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  return NextResponse.json({
    applied: true,
    objects_created: (inserted || []).length,
  });
}

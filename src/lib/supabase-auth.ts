import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Extract a user-scoped Supabase client from the request's auth token.
 * Returns { client } on success, or { error } with a NextResponse on failure.
 */
export function getAuthClient(
  request: NextRequest
): { client: SupabaseClient; error?: never } | { client?: never; error: NextResponse } {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return {
      error: NextResponse.json(
        { error: 'Missing or invalid authorization token' },
        { status: 401 }
      ),
    };
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  return { client };
}

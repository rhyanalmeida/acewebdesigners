// Service-role Supabase client for Edge Functions. Bypasses RLS — never expose
// this key or return raw rows to the public. SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are auto-injected into the function runtime.

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

let cached: SupabaseClient | null = null

export function admin(): SupabaseClient {
  if (cached) return cached
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set')
  cached = createClient(url, key, { auth: { persistSession: false } })
  return cached
}

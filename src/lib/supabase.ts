/**
 * Supabase browser client.
 *
 * The browser NEVER reads/writes tables directly — every table has RLS enabled
 * with no anon policy, so all data access goes through Edge Functions
 * (`slots`, `book`, `mark-showed`, …). This client is used for two things:
 *   1. invoking those Edge Functions (`supabase.functions.invoke(...)`), and
 *   2. admin auth (magic-link) for the appointments dashboard.
 *
 * Conversions (Meta CAPI) are sent server-side from the Edge Functions — never
 * from here. See supabase/functions/_shared/meta.ts.
 */

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  // Fail loud in dev; in prod the Netlify build env must define these.
  console.warn(
    '⚠️ VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set — booking and admin will not work.',
  )
}

// Harmless placeholders when unconfigured so createClient() doesn't throw at
// import time — the app keeps rendering and the scheduler/admin show a fallback
// (guarded by isSupabaseConfigured) instead of white-screening.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)

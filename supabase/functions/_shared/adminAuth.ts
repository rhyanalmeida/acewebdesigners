// Admin gate for dashboard functions. The gateway already verified the Supabase
// auth JWT (verify_jwt=true); here we resolve the user and check the email is in
// the ADMIN_EMAILS allow-list. Returns { email } or null (caller → 401/403).

import { admin } from './supabaseAdmin.ts'

export async function requireAdmin(req: Request): Promise<{ email: string } | null> {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  const { data, error } = await admin().auth.getUser(token)
  const email = data.user?.email?.toLowerCase()
  if (error || !email) return null

  const allow = (Deno.env.get('ADMIN_EMAILS') ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  // If no allow-list is configured, deny by default (fail closed).
  if (allow.length === 0 || !allow.includes(email)) return null
  return { email }
}

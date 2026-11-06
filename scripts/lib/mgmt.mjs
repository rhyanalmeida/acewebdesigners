// Shared plumbing for the local ops scripts: supabase/.env loader + the Supabase Management-API SQL
// endpoint (the DB access pattern CLAUDE.md prescribes — the Supabase MCP points at the wrong project).
// SUPABASE_ACCESS_TOKEN is a Windows user env var; the local keys in supabase/.env never become Edge secrets.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
export const PROJECT_REF = 'dwsmrruzufqpopdzlszw'

/** KEY=value lines → object (quotes stripped, # comments ignored). */
export function loadDotEnv(file = path.join(ROOT, 'supabase', '.env')) {
  const out = {}
  if (!fs.existsSync(file)) return out
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 0) continue
    out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
  }
  return out
}
/** A real env var wins over supabase/.env. */
export const env = (k) => process.env[k] ?? loadDotEnv()[k] ?? ''

/** SQL string literal (NULL for null/undefined). Values only — never interpolate identifiers. */
export const lit = (v) => (v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`)
export const jsonLit = (v) => `${lit(JSON.stringify(v ?? {}))}::jsonb`
export const textArrayLit = (arr) => (arr?.length ? `array[${arr.map(lit).join(',')}]::text[]` : 'NULL')

/** Run one statement through the Management API; returns the row array (empty for DDL/DML without RETURNING). */
export async function sql(query) {
  const token = process.env.SUPABASE_ACCESS_TOKEN
  if (!token) throw new Error('SUPABASE_ACCESS_TOKEN env var is required')
  const r = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  const text = await r.text()
  if (!r.ok) throw new Error(`SQL ${r.status}: ${text.slice(0, 300)}`)
  try { return JSON.parse(text) } catch { return [] }
}

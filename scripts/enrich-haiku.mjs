#!/usr/bin/env node
/**
 * enrich-haiku.mjs — Claude Haiku reads each prospect's REAL website and records only page-grounded
 * facts: the owner's first name (when the site says who owns/runs it), cuisine, 1-3 signature dishes
 * named on the site, one 12-word hook, and the contact email if it is literally printed. This is the
 * "Enrich names + hooks" step of the weekly sequence (docs/COLD_EMAIL_SALES_PLAYBOOK_2026-11-04.md §1 #3),
 * which was manual; first-name + named-dish personalization is the strongest evidence-backed lever we
 * have (playbook §5), and a WRONG name is worse than "there" — so the prompt forbids guessing.
 *
 *   node scripts/enrich-haiku.mjs --in leads/x.enriched.csv [--out leads/x.haiku.csv] [--concurrency 4] [--limit 50] [--dry]
 *
 * Adds columns: owner first name · owner_evidence · cuisine · dishes · hook · haiku_email. Fills `emails/0`
 * only when it was blank and the page shows an address that passes lib/email-quality.mjs.
 * Cost: Haiku 5.5 $0.10/M in · $0.50/M out — ~8k tokens in + ~150 out per site ≈ $0.001/site (printed at the end).
 * ANTHROPIC_API_KEY from supabase/.env (local scripts only).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Anthropic from '@anthropic-ai/sdk'
import { isJunkEmail } from './lib/email-quality.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
for (const line of fs.existsSync(path.join(ROOT, 'supabase', '.env')) ? fs.readFileSync(path.join(ROOT, 'supabase', '.env'), 'utf8').split(/\r?\n/) : []) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const args = process.argv.slice(2)
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && i + 1 < args.length ? args[i + 1] : d }
const IN = opt('in'), OUT = opt('out', IN?.replace(/\.csv$/i, '.haiku.csv'))
const CONC = Number(opt('concurrency', 4)), LIMIT = Number(opt('limit', Infinity)), DRY = args.includes('--dry')
if (!IN) { console.error('usage: --in <csv> [--out <csv>] [--concurrency N] [--limit N] [--dry]'); process.exit(1) }
if (!process.env.ANTHROPIC_API_KEY) { console.error('ANTHROPIC_API_KEY missing (supabase/.env)'); process.exit(1) }

// ── csv ────────────────────────────────────────────────────────────────────
function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++ } else q = false } else cell += ch }
    else if (ch === '"') q = true
    else if (ch === ',') { row.push(cell); cell = '' }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = '' }
    else cell += ch
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.some((c) => c !== ''))
}
const cellOut = (v) => { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
const rows = parseCsv(fs.readFileSync(IN, 'utf8'))
const H = rows[0]
const norm = (h) => h.toLowerCase().replace(/[^a-z0-9]/g, '')
const col = (...names) => { const N = H.map(norm); for (const n of names) { const i = N.indexOf(norm(n)); if (i >= 0) return i } return -1 }
const iSite = col('website', 'site', 'url'), iKind = col('websiteKind'), iName = col('title', 'name', 'business name'), iEmail = col('emails/0', 'email'), iCat = col('categoryName', 'category', 'type')
if (iSite < 0 || iName < 0) { console.error(`need website + title columns. Headers: ${H.join(', ')}`); process.exit(1) }
const NEW = ['owner first name', 'owner_evidence', 'cuisine', 'dishes', 'hook', 'first_line', 'haiku_email']
const hdr = [...H]; for (const n of NEW) if (col(n) < 0) hdr.push(n)
const ix = Object.fromEntries(NEW.map((n) => [n, hdr.findIndex((h) => norm(h) === norm(n))]))

// ── fetch a few pages of the site as plain text ─────────────────────────────
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36'
const toText = (html) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/gi, ' ').replace(/<br\s*\/?>|<\/(p|div|li|h\d|tr|section|article)>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim()
async function get(url) {
  try { const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 15000); const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html' }, redirect: 'follow', signal: ac.signal }); clearTimeout(t); return r.ok && (r.headers.get('content-type') || '').includes('html') ? await r.text() : '' } catch { return '' }
}
async function siteText(site) {
  const base = /^https?:/i.test(site) ? site : `https://${site}`
  const home = await get(base)
  if (!home) return ''
  const origin = new URL(base).origin
  const links = [...new Set([...home.matchAll(/href="([^"#?]+)"/gi)].map((m) => m[1]).filter((h) => /about|story|team|owner|chef|menu|contact/i.test(h) && !/\.(jpg|png|pdf|css|js)$/i.test(h)).map((h) => { try { return new URL(h, origin).href } catch { return '' } }).filter((u) => u.startsWith(origin)))].slice(0, 4)
  const pages = await Promise.all(links.map(get))
  let text = `URL: ${base}\n${toText(home).slice(0, 7000)}`
  for (let i = 0; i < links.length; i++) if (pages[i]) text += `\n\nPAGE: ${links[i]}\n${toText(pages[i]).slice(0, 3500)}`
  return text.slice(0, 24000)
}

// ── Haiku: strict tool call = the schema we record ──────────────────────────
const client = new Anthropic()
const MODEL = 'claude-haiku-5-5'
const TOOL = {
  name: 'record_business_facts',
  description: 'Record ONLY facts literally supported by the page text. Use null for anything the pages do not state.',
  strict: true,
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      owner_first_name: { type: ['string', 'null'], description: 'First name of the owner/chef-owner/proprietor ONLY if the text says this person owns or runs the business. Never a staff member, reviewer, web designer or guessed name.' },
      owner_evidence: { type: ['string', 'null'], description: 'Verbatim quote (≤20 words) proving the ownership claim, else null.' },
      cuisine: { type: ['string', 'null'], description: 'Cuisine or business type as the site describes it (e.g. "Neapolitan pizza", "Thai", "roofing"), else null.' },
      signature_dishes: { type: 'array', items: { type: 'string' }, description: 'Up to 3 dish or product names copied verbatim from the site. Empty if none named.' },
      hook: { type: ['string', 'null'], description: 'One specific, friendly phrase (≤12 words) a stranger could truthfully say after reading the site, e.g. "the wood-fired margherita your menu leads with". No praise of the website itself. Null if nothing specific.' },
      first_line: { type: ['string', 'null'], description: 'The opening sentence of a short, plain cold email from a local web designer to this business: ONE sentence, 10–22 words, first person, mentions one specific thing from the pages (a named dish, the cuisine, the neighborhood, something from their story) the way a real person would, e.g. "Saw the lomo saltado on your menu — my wife and I have been meaning to try Mercado." Never flatter or critique the website, no exclamation marks, no sales language, no questions; ends with a period. Null if nothing specific enough.' },
      email: { type: ['string', 'null'], description: 'A contact email printed on the pages, else null. Never invent or infer one.' },
    },
    required: ['owner_first_name', 'owner_evidence', 'cuisine', 'signature_dishes', 'hook', 'first_line', 'email'],
  },
}
const SYSTEM = `You extract facts about a small local business from its own website text and write the opening line of a short, plain cold email from a local web designer (Rhyan, Ace Web Designers, Leominster MA). Rules: (1) call record_business_facts exactly once; (2) every field must be supported by the text — when unsure, use null or an empty list; (3) a wrong owner name is far worse than none: only name a person the text explicitly identifies as the owner, founder, proprietor or chef-owner; (4) copy dish names verbatim; (5) the hook and first_line must be something only someone who read THIS site could say — never a generic compliment, never a critique of their website, never a statistic, never anything about how the email or a website was made; (6) the first_line reads like one neighbor to another, not marketing.`

let inTok = 0, outTok = 0
async function extract(text) {
  const res = await client.messages.create({
    model: MODEL, max_tokens: 1200, system: SYSTEM, tools: [TOOL], tool_choice: { type: 'auto' },
    output_config: { effort: 'low' },
    messages: [{ role: 'user', content: `Website text:\n\n${text}\n\nRecord the facts with record_business_facts.` }],
  })
  inTok += res.usage.input_tokens; outTok += res.usage.output_tokens
  const call = res.content.find((b) => b.type === 'tool_use' && b.name === TOOL.name)
  return call ? call.input : null
}

// ── run ─────────────────────────────────────────────────────────────────────
const data = rows.slice(1).map((r) => { const o = [...r]; while (o.length < hdr.length) o.push(''); return o })
const todo = data.map((r, i) => ({ r, i })).filter(({ r }) => (r[iSite] || '').trim() && (iKind < 0 || r[iKind] === 'real') && !r[ix['owner first name']] && !r[ix.hook]).slice(0, LIMIT)
console.error(`${todo.length} sites to read (of ${data.length} rows) with ${MODEL}${DRY ? ' — DRY (fetch only, no API)' : ''}`)
let done = 0, named = 0, hooked = 0, mailed = 0
async function worker() {
  for (;;) {
    const item = todo.shift(); if (!item) return
    const { r } = item
    const text = await siteText(r[iSite].trim())
    if (text.length > 400 && !DRY) {
      try {
        const f = await extract(text)
        if (f) {
          if (f.owner_first_name && f.owner_evidence) { r[ix['owner first name']] = f.owner_first_name.trim().split(/\s+/)[0]; r[ix.owner_evidence] = f.owner_evidence; named++ }
          if (f.cuisine) r[ix.cuisine] = f.cuisine
          if (f.signature_dishes?.length) r[ix.dishes] = f.signature_dishes.slice(0, 3).join(' | ')
          if (f.hook) { r[ix.hook] = f.hook; hooked++ }
          if (f.first_line && /^[^!?]{20,180}\.$/.test(f.first_line.trim())) r[ix.first_line] = f.first_line.trim()
          if (f.email && /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(f.email) && !isJunkEmail(f.email.toLowerCase())) {
            r[ix.haiku_email] = f.email.toLowerCase()
            if (iEmail >= 0 && !r[iEmail]) { r[iEmail] = f.email.toLowerCase(); mailed++ }
          }
        }
      } catch (e) { console.error(`\n  ${r[iName]}: ${e?.status || ''} ${e?.message?.slice(0, 120)}`) }
    }
    done++; process.stderr.write(`  ${done} read · ${named} named · ${hooked} hooks · ${mailed} new emails\r`)
  }
}
await Promise.all(Array.from({ length: CONC }, worker))
fs.writeFileSync(OUT, [hdr.join(','), ...data.map((r) => r.map(cellOut).join(','))].join('\n'))
const cost = (inTok / 1e6) * 0.1 + (outTok / 1e6) * 0.5
console.error(`\n→ ${OUT}\n  ${done} sites · owner named ${named} · hooks ${hooked} · emails filled ${mailed} · tokens in ${inTok} out ${outTok} ≈ $${cost.toFixed(3)}`)

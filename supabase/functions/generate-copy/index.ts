/**
 * `generate-copy` — optional AI copywriting for the restaurant builder wizard.
 *
 * COST-CONTROLLED BY DESIGN (the explicit requirement was "don't run up cost"):
 *   • Cheapest capable model — Claude Haiku 4.5 (`claude-haiku-4-5`). To upgrade
 *     quality at higher cost, change MODEL to `claude-opus-4-8` (one line).
 *   • Tiny output cap (MAX_TOKENS) — copy is short.
 *   • ONE call fills everything (tagline + description + 3 sample items) — never
 *     N calls per field.
 *   • Fires only on an explicit button click on the client (never per keystroke).
 *   • Inputs are clamped; a best-effort per-IP cooldown throttles rapid repeats.
 *   • Server-side only — ANTHROPIC_API_KEY never reaches the browser. No-ops
 *     (503) when the key is unset, so the wizard still works without AI.
 *
 * POST { restaurantName, cuisine, sections? } → { tagline, description, items }
 */

import Anthropic from 'npm:@anthropic-ai/sdk@0.40.1'
import { handlePreflight, json } from '../_shared/cors.ts'

const MODEL = 'claude-haiku-4-5' // cheapest capable; swap to claude-opus-4-8 for higher quality at higher cost
const MAX_TOKENS = 400

// Best-effort per-IP cooldown (per isolate; not a hard global cap, but cheap and
// migration-free). A burst from one IP is throttled to 1 request / COOLDOWN_MS.
const COOLDOWN_MS = 4000
const lastSeen = new Map<string, number>()

interface Body {
  restaurantName?: string
  cuisine?: string
  sections?: string[]
}

const COPY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    tagline: { type: 'string', description: '6-10 word appetizing tagline' },
    description: { type: 'string', description: '1-2 sentences, max ~240 chars' },
    items: {
      type: 'array',
      description: '3 sample featured menu items typical for this cuisine',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          blurb: { type: 'string', description: '4-8 word description' },
        },
        required: ['name', 'blurb'],
      },
    },
  },
  required: ['tagline', 'description', 'items'],
}

Deno.serve(async (req: Request) => {
  const pre = handlePreflight(req)
  if (pre) return pre
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  const key = Deno.env.get('ANTHROPIC_API_KEY')
  if (!key) return json({ error: 'AI copy not configured' }, 503)

  let b: Body
  try {
    b = (await req.json()) as Body
  } catch {
    return json({ error: 'invalid JSON' }, 400)
  }

  // Clamp inputs (bounds prompt size → bounds cost).
  const name = (b.restaurantName ?? '').trim().slice(0, 80)
  const cuisine = (b.cuisine ?? '').trim().slice(0, 40)
  const sections = (b.sections ?? []).slice(0, 8).join(', ').slice(0, 120)
  if (!name || !cuisine) return json({ error: 'restaurantName and cuisine required' }, 400)

  // Best-effort per-IP throttle.
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
  const now = Date.now()
  const prev = lastSeen.get(ip) ?? 0
  if (now - prev < COOLDOWN_MS) return json({ error: 'slow down a moment and try again' }, 429)
  lastSeen.set(ip, now)

  const anthropic = new Anthropic({ apiKey: key })
  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system:
        'You write short, appetizing website copy for restaurants. Plain text only — no markdown, ' +
        'no emojis. Be concrete and specific to the cuisine. NEVER invent prices, addresses, hours, ' +
        'phone numbers, or claims; the menu items are clearly-labeled sample suggestions the owner edits.',
      output_config: { format: { type: 'json_schema', schema: COPY_SCHEMA } },
      messages: [
        {
          role: 'user',
          content:
            `Restaurant name: ${name}\nCuisine: ${cuisine}\n` +
            (sections ? `Site sections: ${sections}\n` : '') +
            'Write a tagline, a short description, and 3 sample featured menu items typical for this cuisine.',
        },
      ],
    })

    // Pull the JSON text block out of the response and parse it.
    const text = msg.content.find((c) => c.type === 'text') as { text?: string } | undefined
    if (!text?.text) return json({ error: 'no copy generated' }, 502)
    let parsed: { tagline?: string; description?: string; items?: { name: string; blurb: string }[] }
    try {
      parsed = JSON.parse(text.text)
    } catch {
      return json({ error: 'could not parse copy' }, 502)
    }
    return json({
      tagline: parsed.tagline ?? '',
      description: parsed.description ?? '',
      items: Array.isArray(parsed.items) ? parsed.items.slice(0, 3) : [],
    })
  } catch (err) {
    console.error('[generate-copy] anthropic error', err)
    return json({ error: 'AI copy temporarily unavailable' }, 502)
  }
})

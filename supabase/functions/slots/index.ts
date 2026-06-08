/**
 * `slots` — returns open booking slots for a calendar.
 *
 * Public (anon apikey only). Computes availability windows minus booked
 * appointments minus Google Calendar busy times. Returns UTC ISO instants; the
 * browser renders them in the visitor's timezone.
 *
 * POST { calendar: 'main'|'contractor', days?: number }
 *   → { tz: string, slots: { startISO, endISO }[] }
 */

import { handlePreflight, json } from '../_shared/cors.ts'
import { computeOpenSlots } from '../_shared/availability.ts'

Deno.serve(async (req: Request) => {
  const pre = handlePreflight(req)
  if (pre) return pre

  let calendar = 'contractor'
  let days: number | undefined
  try {
    const body = (await req.json()) as { calendar?: string; days?: number }
    if (body.calendar) calendar = body.calendar
    if (typeof body.days === 'number') days = body.days
  } catch {
    // allow empty body → defaults
  }

  if (calendar !== 'main' && calendar !== 'contractor') {
    return json({ error: "calendar must be 'main' or 'contractor'" }, 400)
  }

  try {
    const { tz, slots } = await computeOpenSlots({ calendar, days })
    return json({ tz, slots })
  } catch (err) {
    console.error('[slots] error', err)
    return json({ error: 'failed to compute slots' }, 500)
  }
})

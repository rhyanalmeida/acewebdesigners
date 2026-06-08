/**
 * Open-slot computation.
 *
 * Open slots = weekly `availability` windows, sliced into slot_minutes, MINUS
 * booked appointments, MINUS Google Calendar busy times (live freeBusy). All
 * timezone math is DST-correct: calendar days are enumerated with UTC date-only
 * arithmetic, then each wall-clock slot is converted to a real UTC instant with
 * date-fns-tz `fromZonedTime` (which applies the right offset per date).
 *
 * Returns UTC ISO instants; the browser renders them in the visitor's timezone.
 */

import { fromZonedTime } from 'npm:date-fns-tz@3'
import { admin } from './supabaseAdmin.ts'
import { freeBusy, type BusyInterval } from './google.ts'

export interface Slot {
  startISO: string
  endISO: string
}

interface AvailabilityRow {
  weekday: number
  start_minute: number
  end_minute: number
  slot_minutes: number
  tz: string
}

const pad = (n: number) => String(n).padStart(2, '0')
const DEFAULT_TZ = 'America/New_York'

export async function computeOpenSlots(opts: {
  calendar: 'main' | 'contractor'
  days?: number
  leadMinutes?: number
}): Promise<{ tz: string; slots: Slot[] }> {
  const days = Math.min(Math.max(opts.days ?? 21, 1), 60)
  const leadMinutes = opts.leadMinutes ?? 120
  const supa = admin()

  const { data: rules, error } = await supa
    .from('availability')
    .select('weekday,start_minute,end_minute,slot_minutes,tz')
    .eq('calendar', opts.calendar)
    .eq('active', true)
  if (error) {
    console.error('[availability] rules query failed', error.message)
    return { tz: DEFAULT_TZ, slots: [] }
  }
  if (!rules || rules.length === 0) return { tz: DEFAULT_TZ, slots: [] }

  const tz = (rules[0] as AvailabilityRow).tz || DEFAULT_TZ
  const byWeekday = new Map<number, AvailabilityRow[]>()
  for (const r of rules as AvailabilityRow[]) {
    const arr = byWeekday.get(r.weekday) ?? []
    arr.push(r)
    byWeekday.set(r.weekday, arr)
  }

  const now = Date.now()
  const windowStart = new Date(now)
  const windowEnd = new Date(now + days * 86_400_000)

  // Busy = booked appointments (not cancelled) + Google Calendar busy.
  const busy: BusyInterval[] = []
  const { data: appts } = await supa
    .from('appointments')
    .select('start_ts,end_ts')
    .eq('calendar', opts.calendar)
    .neq('status', 'cancelled')
    .gte('start_ts', windowStart.toISOString())
    .lte('start_ts', windowEnd.toISOString())
  for (const a of (appts ?? []) as { start_ts: string; end_ts: string }[]) {
    busy.push({ start: Date.parse(a.start_ts), end: Date.parse(a.end_ts) })
  }
  busy.push(...(await freeBusy(opts.calendar, windowStart.toISOString(), windowEnd.toISOString())))

  const overlapsBusy = (s: number, e: number) => busy.some((b) => s < b.end && e > b.start)
  const earliest = now + leadMinutes * 60_000

  // Enumerate calendar days with UTC date-only arithmetic (DST-safe anchor).
  const slots: Slot[] = []
  const base = new Date(now) // day 0 = today in tz
  for (let i = 0; i < days; i++) {
    // Build the calendar date for "today + i" as seen in tz.
    const dayInstant = new Date(base.getTime() + i * 86_400_000)
    // Derive the tz wall date for this instant via Intl (robust, runtime-tz-agnostic).
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    }).formatToParts(dayInstant)
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
    const ymd = `${get('year')}-${get('month')}-${get('day')}`
    const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'))

    const dayRules = byWeekday.get(weekday)
    if (!dayRules) continue

    for (const r of dayRules) {
      for (let m = r.start_minute; m + r.slot_minutes <= r.end_minute; m += r.slot_minutes) {
        const wall = `${ymd} ${pad(Math.floor(m / 60))}:${pad(m % 60)}:00`
        const startMs = fromZonedTime(wall, tz).getTime()
        const endMs = startMs + r.slot_minutes * 60_000
        if (startMs < earliest) continue
        if (overlapsBusy(startMs, endMs)) continue
        slots.push({ startISO: new Date(startMs).toISOString(), endISO: new Date(endMs).toISOString() })
      }
    }
  }

  slots.sort((a, b) => a.startISO.localeCompare(b.startISO))
  return { tz, slots }
}

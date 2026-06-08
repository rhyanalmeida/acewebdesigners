/**
 * Scheduler — our own booking widget (replaces the GoHighLevel iframe).
 *
 * Flow: fetch open slots from the `slots` Edge Function → pick a day → pick a
 * time → fill the short form → submit to the `book` Edge Function. On submit we
 * fire the browser pixel `Lead` with an event_id and send the SAME event_id to
 * the server (book → CAPI), so Meta dedupes the pair.
 *
 * Times are returned as UTC instants and rendered in the visitor's own
 * timezone. Identity (email/phone/address) + Meta click ids (fbc/fbp/fbclid)
 * are posted to the server for Conversions API match quality.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { getAttribution } from '../../utils/attribution'
import { trackLead } from '../../utils/pixelTracking'

interface Slot {
  startISO: string
  endISO: string
}

interface SchedulerProps {
  calendar: 'main' | 'contractor'
  calendarName?: string
  className?: string
  containerId?: string
  minHeight?: number
  onBooked?: (info: { appointmentId: string; startISO: string }) => void
}

const PHONE = '+17744467375'
const PHONE_DISPLAY = '(774) 446-7375'

const pad = (n: number) => String(n).padStart(2, '0')
/** Local (visitor-tz) YYYY-MM-DD key for grouping slots by day. */
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}
function formatLongDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

interface FormState {
  name: string
  email: string
  phone: string
  city: string
  state: string
  zip: string
}
const EMPTY_FORM: FormState = { name: '', email: '', phone: '', city: '', state: '', zip: '' }

export const Scheduler: React.FC<SchedulerProps> = ({
  calendar,
  calendarName,
  className = '',
  containerId,
  minHeight = 600,
  onBooked,
}) => {
  const [slots, setSlots] = useState<Slot[]>([])
  const [businessTz, setBusinessTz] = useState('America/New_York')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | undefined>()
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [confirmed, setConfirmed] = useState<Slot | null>(null)

  const visitorTz = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'your timezone',
    [],
  )

  const loadSlots = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const { data, error } = await supabase.functions.invoke('slots', { body: { calendar } })
      if (error) throw error
      const payload = data as { tz: string; slots: Slot[] }
      setSlots(payload.slots ?? [])
      if (payload.tz) setBusinessTz(payload.tz)
    } catch (err) {
      console.error('[Scheduler] failed to load slots', err)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [calendar])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      setLoadError(true)
      return
    }
    loadSlots()
  }, [loadSlots])

  // Group slots by visitor-local day.
  const slotsByDay = useMemo(() => {
    const map = new Map<string, Slot[]>()
    for (const s of slots) {
      const key = dayKey(new Date(s.startISO))
      const arr = map.get(key) ?? []
      arr.push(s)
      map.set(key, arr)
    }
    return map
  }, [slots])

  const availableDayKeys = useMemo(() => new Set(slotsByDay.keys()), [slotsByDay])
  const timesForSelectedDay = useMemo(() => {
    if (!selectedDay) return []
    return (slotsByDay.get(dayKey(selectedDay)) ?? []).slice().sort((a, b) => a.startISO.localeCompare(b.startISO))
  }, [selectedDay, slotsByDay])

  const startOfToday = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!selectedSlot) return
      setSubmitError('')
      if (!form.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        setSubmitError('Please enter your name and a valid email.')
        return
      }
      setSubmitting(true)

      // Dual-fire Lead: browser pixel + server CAPI share this event_id.
      const eventId =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `lead_${Date.now()}_${Math.random().toString(16).slice(2)}`
      const attr = getAttribution()
      trackLead(eventId, { content_name: calendarName ?? `${calendar} booking` })

      try {
        const { data, error } = await supabase.functions.invoke('book', {
          body: {
            calendar,
            startISO: selectedSlot.startISO,
            endISO: selectedSlot.endISO,
            tz: businessTz,
            name: form.name,
            email: form.email,
            phone: form.phone,
            city: form.city,
            state: form.state,
            zip: form.zip,
            country: 'US',
            fbc: attr.fbc,
            fbp: attr.fbp,
            fbclid: attr.fbclid,
            eventId,
            eventSourceUrl: window.location.href,
          },
        })

        if (error) {
          // Pull status + message off the underlying Response when present.
          let status = 0
          let msg = 'Something went wrong booking that slot. Please try again.'
          const ctx = (error as { context?: Response }).context
          if (ctx) {
            status = ctx.status
            try {
              const j = (await ctx.json()) as { error?: string }
              if (j?.error) msg = j.error
            } catch {
              /* ignore */
            }
          }
          if (status === 409) {
            // Slot taken between load and submit — refresh and let them re-pick.
            await loadSlots()
            setSelectedSlot(null)
          }
          setSubmitError(msg)
          return
        }

        const result = data as { appointmentId: string; startISO: string }
        setConfirmed(selectedSlot)
        onBooked?.({ appointmentId: result.appointmentId, startISO: result.startISO })
      } catch (err) {
        console.error('[Scheduler] book failed', err)
        setSubmitError('Something went wrong booking that slot. Please try again.')
      } finally {
        setSubmitting(false)
      }
    },
    [selectedSlot, form, calendar, calendarName, businessTz, loadSlots, onBooked],
  )

  const setField = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  // ── confirmation ──────────────────────────────────────────────────────────────
  if (confirmed) {
    return (
      <div id={containerId} className={`booking-widget-container ${className}`} style={{ minHeight }}>
        <div className="rounded-2xl bg-cream-50 ring-1 ring-ink-900/10 p-8 text-center shadow-soft">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-ink-900">You're booked!</h3>
          <p className="mt-2 text-ink-700">
            {formatLongDate(confirmed.startISO)} at <strong>{formatTime(confirmed.startISO)}</strong>
          </p>
          <p className="mt-1 text-sm text-ink-700/70">Times shown in your timezone ({visitorTz}).</p>
          <p className="mt-4 text-sm text-ink-700">
            A confirmation and reminders are on the way to <strong>{form.email}</strong>. See you then!
          </p>
        </div>
      </div>
    )
  }

  // ── unavailable / fallback ──────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div id={containerId} className={`booking-widget-container ${className}`} style={{ minHeight }}>
        <div className="flex items-center justify-center rounded-2xl border-2 border-yellow-200 bg-yellow-50 p-8" style={{ minHeight }}>
          <div className="text-center">
            <p className="font-semibold text-yellow-800">Online booking is briefly unavailable</p>
            <p className="mt-2 text-ink-700">Call or text us and we'll get you scheduled right away.</p>
            <a
              href={`tel:${PHONE}`}
              className="mt-4 inline-block rounded-full bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Call {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </div>
    )
  }

  // ── main ────────────────────────────────────────────────────────────────────────
  return (
    <div id={containerId} className={`booking-widget-container ${className}`} style={{ minHeight }}>
      {loading ? (
        <div className="flex items-center justify-center rounded-2xl bg-gray-50" style={{ minHeight }}>
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
            <p className="font-medium text-gray-600">Loading available times…</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2">
          {/* Left: date picker */}
          <div className="rounded-2xl bg-cream-50 p-4 ring-1 ring-ink-900/10">
            <p className="mb-3 text-sm font-semibold text-ink-800">1. Pick a day</p>
            <DayPicker
              mode="single"
              selected={selectedDay}
              onSelect={(d) => {
                setSelectedDay(d)
                setSelectedSlot(null)
              }}
              disabled={[{ before: startOfToday }, (date: Date) => !availableDayKeys.has(dayKey(date))]}
              className="rdp-ace"
            />
            <p className="mt-2 text-xs text-ink-700/70">Times shown in your timezone ({visitorTz}).</p>
          </div>

          {/* Right: times + form */}
          <div className="rounded-2xl bg-cream-50 p-4 ring-1 ring-ink-900/10">
            {!selectedDay ? (
              <p className="flex h-full items-center justify-center text-center text-ink-700/70">
                Select a day to see available times.
              </p>
            ) : !selectedSlot ? (
              <>
                <p className="mb-3 text-sm font-semibold text-ink-800">
                  2. Pick a time — {selectedDay.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                {timesForSelectedDay.length === 0 ? (
                  <p className="text-ink-700/70">No times left this day. Try another.</p>
                ) : (
                  <div className="grid max-h-[420px] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
                    {timesForSelectedDay.map((s) => (
                      <button
                        key={s.startISO}
                        type="button"
                        onClick={() => setSelectedSlot(s)}
                        className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:border-blue-500 hover:bg-blue-50"
                      >
                        {formatTime(s.startISO)}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink-800">3. Your details</p>
                  <button
                    type="button"
                    onClick={() => setSelectedSlot(null)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    ← change time
                  </button>
                </div>
                <p className="mb-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
                  {formatLongDate(selectedSlot.startISO)} at <strong>{formatTime(selectedSlot.startISO)}</strong>
                </p>

                <div className="space-y-3">
                  <input required value={form.name} onChange={setField('name')} placeholder="Full name *" className={inputClass} autoComplete="name" />
                  <input required type="email" value={form.email} onChange={setField('email')} placeholder="Email *" className={inputClass} autoComplete="email" />
                  <input type="tel" value={form.phone} onChange={setField('phone')} placeholder="Phone" className={inputClass} autoComplete="tel" />
                  <div className="grid grid-cols-2 gap-3">
                    <input value={form.city} onChange={setField('city')} placeholder="City" className={inputClass} autoComplete="address-level2" />
                    <input value={form.state} onChange={setField('state')} placeholder="State" className={inputClass} autoComplete="address-level1" />
                  </div>
                  <input value={form.zip} onChange={setField('zip')} placeholder="ZIP" className={inputClass} autoComplete="postal-code" />
                </div>

                {submitError && <p className="mt-3 text-sm text-red-600">{submitError}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-4 w-full rounded-full bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting ? 'Booking…' : 'Confirm booking'}
                </button>
                <p className="mt-3 text-center text-xs text-ink-700/60">
                  Prefer to talk? Call {PHONE_DISPLAY}.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-ink-900/15 bg-white px-3 py-2 text-ink-900 placeholder-ink-700/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'

export default Scheduler

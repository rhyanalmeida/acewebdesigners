// Pure helpers for scripts/instantly-create-campaign.mjs — no I/O, unit-tested.

export const DEFAULT_NAME = 'Outbound — Contractors v2'
export const SENDING_ACCOUNTS = ['rhyan@getacewebdesigners.com', 'rhyan@acewebdesignershq.com']

// Instantly's timezone enum has no America/New_York; America/Detroit is the same US Eastern zone.
const WEEKDAYS = { 0: false, 1: true, 2: true, 3: true, 4: true, 5: true, 6: false }
// Minutes between sends from one inbox: 6 + up to 8 random ≈ 10 avg ≈ 6 sends/hour (set 2026-11-04;
// was 10 + 15 ≈ 17.5 avg ≈ 3.4/hour, which with 3.5 h of windows starved the restaurant campaign).
export const EMAIL_GAP_MINUTES = 6
export const RANDOM_WAIT_MAX_MINUTES = 8

export const SCHEDULES = {
  // 06–16 ET (owner, 2026-11-02): wide enough for two inboxes to clear 60/day; Instantly fills from the start.
  default: [{ name: 'Weekdays 6am–4pm ET', timing: { from: '06:00', to: '16:00' }, days: WEEKDAYS, timezone: 'America/Detroit' }],
  // Restaurants: outside lunch and dinner service — operators don't read email during service
  // (RESTAURANT_OUTBOUND_PLAN §3). Widened 2026-11-04: the original 09:30–11 + 14–16 (3.5 h) at a
  // 10–25 min gap capped each inbox at ~12 sends/day, so the campaign never reached its 60/day limit.
  // Capacity rule: window hours × sends/hour (60 ÷ average gap) must exceed the per-inbox daily cap.
  restaurant: [
    { name: 'Weekdays 7–11:30am ET', timing: { from: '07:00', to: '11:30' }, days: WEEKDAYS, timezone: 'America/Detroit' },
    { name: 'Weekdays 1:30–4:30pm ET', timing: { from: '13:30', to: '16:30' }, days: WEEKDAYS, timezone: 'America/Detroit' },
  ],
}

/**
 * Parse docs/OUTBOUND_COLD_SEQUENCE_DRAFT.md: every "## Email N — Day D …" section
 * yields { n, day, subject, body } where body is the plain text between the
 * "**Subject:**" line and the next "---" rule.
 */
export function parseSequenceDoc(md) {
  const sections = md.split(/^## Email (\d+) — Day (\d+)[^\n]*\n/m)
  const steps = []
  for (let i = 1; i < sections.length; i += 3) {
    const n = Number(sections[i])
    const day = Number(sections[i + 1])
    const chunk = sections[i + 2]
    const m = chunk.match(/\*\*Subject:\*\*\s*(.+)/)
    if (!m) throw new Error(`Email ${n}: no **Subject:** line`)
    const subject = m[1].trim()
    const after = chunk.slice(m.index + m[0].length)
    const body = after.split(/^---\s*$/m)[0].replace(/^\s+|\s+$/g, '')
    steps.push({ n, day, subject, body })
  }
  if (!steps.length) throw new Error('no "## Email N — Day D" sections found')
  return steps
}

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * The doc is hard-wrapped at ~95 cols for readability, so a single newline inside a
 * paragraph is usually a soft wrap, not a real break. Rule: keep the break only when
 * the next line starts a new "unit" — an uppercase letter or digit (signature lines:
 * "Rhyan" / "Ace Web Designers"; a postal address like "123 Main St"), a merge tag
 * `{{…}}`, or a `[placeholder]`. Everything else ("usually\nmeans", "own\n.com domain")
 * is unwrapped with a space.
 */
export function unwrapSoftBreaks(paragraph) {
  return paragraph.replace(/\n(?![A-Z0-9{[])/g, ' ')
}

/** Plain text → minimal HTML Instantly accepts; blank-line paragraphs → <p>, hard breaks → <br/>. */
export function textToHtml(text) {
  return text
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(unwrapSoftBreaks(p)).replace(/\n/g, '<br/>')}</p>`)
    .join('')
}

/** A follow-up whose subject starts with "Re:" is sent with an empty subject → Instantly threads it. */
export const isThreaded = (subject) => /^re:\s*/i.test(subject)

export function buildPayload(steps, { name = DEFAULT_NAME, daily = 60, accounts = SENDING_ACCOUNTS, schedule = 'default' } = {}) {
  if (!SCHEDULES[schedule]) throw new Error(`unknown schedule "${schedule}" (${Object.keys(SCHEDULES).join(', ')})`)
  let prevDay = 0
  const apiSteps = steps.map((s, i) => {
    const delay = i === 0 ? 0 : s.day - prevDay
    if (i > 0 && delay < 1) throw new Error(`Email ${s.n}: day ${s.day} is not after the previous step (day ${prevDay})`)
    prevDay = s.day
    return {
      type: 'email',
      delay,
      delay_unit: 'days',
      variants: [{ subject: isThreaded(s.subject) ? '' : s.subject, body: textToHtml(s.body) }],
    }
  })
  return {
    name,
    campaign_schedule: { schedules: SCHEDULES[schedule] },
    sequences: [{ steps: apiSteps }],
    email_list: accounts,
    daily_limit: daily,
    email_gap: EMAIL_GAP_MINUTES,
    random_wait_max: RANDOM_WAIT_MAX_MINUTES,
    text_only: true,
    stop_on_reply: true,
    stop_for_company: true,
    link_tracking: false, // demo_url must stay the raw URL — the /demo page logs its own views
    open_tracking: false, // tracking pixels hurt deliverability on cold sends
    insert_unsubscribe_header: true,
    prioritize_new_leads: false,
    allow_risky_contacts: false,
  }
}

/** Hard requirements every email must satisfy before it can ever be sent. */
export function validateSteps(steps) {
  const problems = []
  for (const s of steps) {
    // Reply-gated demo (2026-09-22): the CTA is a "reply" ask, not a link. Either form is a valid CTA.
    if (!s.body.includes('{{demo_url}}') && !/\breply\b/i.test(s.body)) problems.push(`Email ${s.n}: missing CTA ({{demo_url}} or a reply ask)`)
    if (!s.body.includes('{{unsubscribe}}')) problems.push(`Email ${s.n}: missing {{unsubscribe}} link`)
  }
  const placeholders = steps.filter((s) => /\[OWNER:/.test(s.body)).length
  return { problems, placeholders }
}

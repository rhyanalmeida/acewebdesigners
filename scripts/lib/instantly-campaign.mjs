// Pure helpers for scripts/instantly-create-campaign.mjs — no I/O, unit-tested.

export const DEFAULT_NAME = 'Outbound — Contractors v2'
export const SENDING_ACCOUNTS = ['rhyan@getacewebdesigners.com', 'rhyan@acewebdesignershq.com']

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

export function buildPayload(steps, { name = DEFAULT_NAME, daily = 20, accounts = SENDING_ACCOUNTS } = {}) {
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
    campaign_schedule: {
      schedules: [
        {
          name: 'Weekdays 8am–5pm ET',
          timing: { from: '08:00', to: '17:00' },
          days: { 0: false, 1: true, 2: true, 3: true, 4: true, 5: true, 6: false },
          // Instantly's enum has no America/New_York; America/Detroit is the same US Eastern zone.
          timezone: 'America/Detroit',
        },
      ],
    },
    sequences: [{ steps: apiSteps }],
    email_list: accounts,
    daily_limit: daily,
    email_gap: 10,
    random_wait_max: 15,
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
    if (!s.body.includes('{{demo_url}}')) problems.push(`Email ${s.n}: missing {{demo_url}} CTA`)
    if (!s.body.includes('{{unsubscribe}}')) problems.push(`Email ${s.n}: missing {{unsubscribe}} link`)
  }
  const placeholders = steps.filter((s) => /\[OWNER:/.test(s.body)).length
  return { problems, placeholders }
}

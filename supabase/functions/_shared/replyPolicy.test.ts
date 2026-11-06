import { describe, it, expect } from 'vitest'
import {
  decide,
  lintDraft,
  humanReleaseTime,
  tzForState,
  clampFollowup,
  parseClassifier,
  followupText,
  nudgeText,
  toEmailBody,
  type ClassifierOutput,
  type ProspectCtx,
} from './replyPolicy'
import { OUTBOUND_PRICE, SUPPORT_EMAIL } from './outboundFacts'
import { OUTBOUND_PLAN, SUPPORT_EMAIL as DISPLAY_SUPPORT_EMAIL } from '../../../src/config/outboundPlan'

const DEMO = 'https://acewebdesigners.com/demo/0123456789abcdef0123456789abcdef'

const prospect = (o: Partial<ProspectCtx> = {}): ProspectCtx => ({
  suppressed: false, is_test: false, ai_turns: 0, handoff_at: null, site_status: 'none', demo_url: DEMO, ...o,
})
const model = (o: Partial<ClassifierOutput> = {}): ClassifierOutput => ({
  intent: 'question', confidence: 0.95, needs_human: false, reason: 'asks price', reply_text: `It's $37 a month, domain and hosting included, cancel anytime. The preview is at ${DEMO} if you want another look.\n\nRhyan`, followup_days: null, ...o,
})

describe('facts stay in sync with the display plan', () => {
  it('price + support email match src/config/outboundPlan.ts', () => {
    expect(OUTBOUND_PRICE).toBe(OUTBOUND_PLAN.monthly)
    expect(SUPPORT_EMAIL).toBe(DISPLAY_SUPPORT_EMAIL)
  })
})

describe('decide — terminal rules win', () => {
  it('hostile / remove / ooo are decided by rules alone', () => {
    expect(decide({ rule: 'hostile', model: model({ intent: 'yes' }), prospect: prospect() })).toMatchObject({ action: 'suppress', reason: 'hostile' })
    expect(decide({ rule: 'remove', model: model({ intent: 'yes' }), prospect: prospect() })).toMatchObject({ action: 'suppress', reason: 'unsubscribe' })
    expect(decide({ rule: 'ooo_auto', model: null, prospect: prospect() })).toMatchObject({ action: 'ignore' })
  })
  it('stays silent on suppressed, test and handed-off rows', () => {
    expect(decide({ rule: 'yes', model: model({ intent: 'yes' }), prospect: prospect({ suppressed: true }) }).action).toBe('silent')
    expect(decide({ rule: 'yes', model: model({ intent: 'yes' }), prospect: prospect({ is_test: true }) }).action).toBe('silent')
    expect(decide({ rule: 'unknown', model: model(), prospect: prospect({ handoff_at: '2026-11-02T00:00:00Z' }) }).action).toBe('silent')
  })
  it('escalates when the model is unavailable', () => {
    expect(decide({ rule: 'unknown', model: null, prospect: prospect() })).toMatchObject({ action: 'escalate', reason: 'classifier unavailable' })
  })
})

describe('decide — model intents', () => {
  it('yes → demo link, build only when nothing is built', () => {
    expect(decide({ rule: 'yes', model: model({ intent: 'yes', reply_text: null }), prospect: prospect() })).toMatchObject({ action: 'reply', kind: 'demo_link', startBuild: true })
    expect(decide({ rule: 'yes', model: model({ intent: 'yes', reply_text: null }), prospect: prospect({ site_status: 'deployed' }) })).toMatchObject({ action: 'reply', kind: 'demo_link', startBuild: false })
  })
  it('a rule yes rescues a hedging model; a rule no beats a model yes', () => {
    expect(decide({ rule: 'yes', model: model({ intent: 'unknown', reply_text: null }), prospect: prospect() })).toMatchObject({ action: 'reply', kind: 'demo_link' })
    expect(decide({ rule: 'no', model: model({ intent: 'yes', reply_text: null }), prospect: prospect() })).toMatchObject({ action: 'suppress', reason: 'declined' })
    expect(decide({ rule: 'no', model: model({ intent: 'later', followup_days: 30, reply_text: 'No problem, I will check back after the season. The preview stays at the same link.\n\nRhyan' }), prospect: prospect() })).toMatchObject({ action: 'reply', followupDays: 30 })
  })
  it('question / price objection → the draft, once lint passes', () => {
    const d = decide({ rule: 'unknown', model: model(), prospect: prospect() })
    expect(d).toMatchObject({ action: 'reply', kind: 'reply', intent: 'question' })
    expect(decide({ rule: 'unknown', model: model({ intent: 'objection_price' }), prospect: prospect() }).action).toBe('reply')
  })
  it('low confidence, needs_human, no draft, failed lint, or turn cap → a person', () => {
    expect(decide({ rule: 'unknown', model: model({ confidence: 0.5 }), prospect: prospect() })).toMatchObject({ action: 'escalate', intent: 'unknown' })
    expect(decide({ rule: 'unknown', model: model({ needs_human: true }), prospect: prospect() }).action).toBe('escalate')
    expect(decide({ rule: 'unknown', model: model({ reply_text: null }), prospect: prospect() })).toMatchObject({ action: 'escalate', reason: 'no draft' })
    expect(decide({ rule: 'unknown', model: model({ reply_text: 'We can do 20% off. Rhyan' }), prospect: prospect() }).reason).toMatch(/draft rejected/)
    expect(decide({ rule: 'unknown', model: model(), prospect: prospect({ ai_turns: 2 }) }).reason).toMatch(/already answered/)
  })
  it('no → declined suppression; unknown → escalate', () => {
    expect(decide({ rule: 'unknown', model: model({ intent: 'no', reply_text: null }), prospect: prospect() })).toMatchObject({ action: 'suppress', reason: 'declined' })
    expect(decide({ rule: 'unknown', model: model({ intent: 'unknown', reply_text: null }), prospect: prospect() }).action).toBe('escalate')
  })
  it('later clamps follow-up days into 7–60 with a 21-day default', () => {
    expect(clampFollowup(null)).toBe(21)
    expect(clampFollowup(2)).toBe(7)
    expect(clampFollowup(400)).toBe(60)
  })
})

describe('lintDraft', () => {
  it('passes a plain facts-only reply with the demo link', () => {
    expect(lintDraft(model().reply_text!, DEMO).ok).toBe(true)
  })
  it('rejects leaks', () => {
    const bad = [
      'Our AI builds it fast.',
      'It takes about 5 minutes.',
      'Happy to do $39 a month for you.',
      'Here is 10% off.',
      'See https://acewebdesigners.com/work for more.',
      'Call me at 774-329-3117.',
      'Great news!',
      '- first point\n- second point',
      'We guarantee more leads.',
    ]
    for (const t of bad) expect(lintDraft(t, DEMO).ok, t).toBe(false)
  })
})

describe('humanReleaseTime', () => {
  const rng = (v: number) => () => v
  const hourIn = (d: Date, tz: string) => Number(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', hour12: false }).format(d)) % 24
  const dayIn = (d: Date, tz: string) => new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(d)

  it('holds 20–90 minutes inside the window', () => {
    const now = new Date('2026-11-03T15:00:00Z') // Tue 10:00 ET
    const lo = humanReleaseTime(now, 'MA', rng(0))
    const hi = humanReleaseTime(now, 'MA', rng(0.999))
    expect((lo.getTime() - now.getTime()) / 60000).toBe(20)
    expect((hi.getTime() - now.getTime()) / 60000).toBe(90)
  })
  it('pushes a night-time reply to the next morning', () => {
    const now = new Date('2026-11-04T03:30:00Z') // Tue 22:30 ET
    const t = humanReleaseTime(now, 'MA', rng(0.5))
    expect(hourIn(t, 'America/New_York')).toBe(7)
    expect(dayIn(t, 'America/New_York')).toBe('Wed')
  })
  it('never lands on a Sunday', () => {
    const now = new Date('2026-11-08T16:00:00Z') // Sun 11:00 ET
    const t = humanReleaseTime(now, 'ME', rng(0.2))
    expect(dayIn(t, 'America/New_York')).toBe('Mon')
    expect(hourIn(t, 'America/New_York')).toBe(7)
  })
  it('uses the lead state time zone', () => {
    expect(tzForState('TX')).toBe('America/Chicago')
    expect(tzForState('MAINE')).toBe('America/New_York')
    expect(tzForState(null)).toBe('America/New_York')
    const now = new Date('2026-11-03T12:30:00Z') // 04:30 PT
    const t = humanReleaseTime(now, 'CA', rng(0.5))
    expect(hourIn(t, 'America/Los_Angeles')).toBe(7)
  })
})

describe('parseClassifier + texts', () => {
  it('rejects bad shapes and clamps confidence', () => {
    expect(parseClassifier(null)).toBeNull()
    expect(parseClassifier({ intent: 'maybe' })).toBeNull()
    expect(parseClassifier({ intent: 'yes', confidence: 3, needs_human: 'x', reason: 1, reply_text: '  ', followup_days: 'n' })).toEqual({
      intent: 'yes', confidence: 1, needs_human: true, reason: '', reply_text: null, followup_days: null,
    })
  })
  it('fixed texts pass the lint they impose on the model', () => {
    const p = { first_name: 'Todd', business_name: 'Hardy Roofing', demo_url: DEMO }
    for (const t of [followupText(p), nudgeText(p, 1), nudgeText(p, 2)]) expect(lintDraft(t, DEMO), t).toMatchObject({ ok: true })
  })
  it('toEmailBody links only the demo url', () => {
    const b = toEmailBody(`see ${DEMO}\nthanks`, DEMO)
    expect(b.html).toContain(`<a href="${DEMO}">`)
    expect(b.html).toContain('<br/>')
  })
})

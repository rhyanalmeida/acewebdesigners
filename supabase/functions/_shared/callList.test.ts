import { describe, it, expect } from 'vitest'
import { buildCallList, SEQUENCE_DAYS, type CallListProspect } from './callList'

const now = new Date('2026-11-20T12:00:00Z')
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString()
const base = (o: Partial<CallListProspect>): CallListProspect => ({ id: o.id ?? 'x', business_name: 'Cafe', phone: '555', emailed_at: daysAgo(12), ...o })

describe('buildCallList', () => {
  it('skips rows a person should not call: no phone, suppressed, test, purchased, never emailed', () => {
    expect(buildCallList([
      base({ phone: null }), base({ suppressed: true }), base({ is_test: true }), base({ purchased_at: daysAgo(1) }), base({ emailed_at: null }),
    ], now)).toEqual([])
  })
  it('ranks hand-offs first, then replies, then viewers, then finished sequences', () => {
    const rows = [
      base({ id: 'fin' }),
      base({ id: 'view', demo_first_viewed_at: daysAgo(1), demo_view_count: 3 }),
      base({ id: 'rep', replied_at: daysAgo(2), reply_sentiment: 'question', last_reply: 'how much?' }),
      base({ id: 'hand', replied_at: daysAgo(3), reply_sentiment: 'unknown', handoff_at: daysAgo(3) }),
    ]
    const ids = buildCallList(rows, now).map((e) => `${e.prospect.id}:${e.reason}`)
    expect(ids).toEqual(['hand:replied', 'rep:replied', 'view:viewed', 'fin:finished'])
  })
  it('never lists a no / remove / hostile reply, and leaves a fresh sequence alone', () => {
    const rows = [
      base({ id: 'no', replied_at: daysAgo(1), reply_sentiment: 'no' }),
      base({ id: 'hostile', replied_at: daysAgo(1), reply_sentiment: 'hostile' }),
      base({ id: 'fresh', emailed_at: daysAgo(SEQUENCE_DAYS - 1) }),
    ]
    expect(buildCallList(rows, now)).toEqual([])
  })
  it('hides a prospect called in the last two weeks and brings them back after', () => {
    expect(buildCallList([base({ called_at: daysAgo(3) })], now)).toEqual([])
    expect(buildCallList([base({ called_at: daysAgo(20) })], now)).toHaveLength(1)
  })
  it('quotes the reply so the caller knows what they asked', () => {
    const [e] = buildCallList([base({ replied_at: daysAgo(1), reply_sentiment: 'objection_price', last_reply: 'Too expensive for us right now' })], now)
    expect(e.why).toContain('objection_price')
    expect(e.why).toContain('Too expensive')
  })
})

import { describe, it, expect } from 'vitest'
import {
  pickNextCities, assessPool, nextCapReset, emailYield, batchLabel, parseUploadLine, parseVerifyOutput, parseHaikuCost,
  CITY_ROTATION, LOW_RUNWAY_DAYS, NEW_LEADS_PER_DAY,
} from './wave-plan.mjs'

describe('pickNextCities', () => {
  it('walks the rotation and skips cities the prospects table already covers', () => {
    expect(pickNextCities({ Lynn: 20, newton: 9 }, 3)).toEqual(['Waltham, MA', 'Malden, MA', 'Medford, MA'])
  })
  it('a city with only a handful of prospects is NOT done (a thin pull gets another pass)', () => {
    expect(pickNextCities({ Lynn: 3 }, 1)).toEqual(['Lynn, MA'])
  })
  it('honours the extra done list and a rotation override', () => {
    expect(pickNextCities({}, 2, { rotation: ['A, MA', 'B, MA', 'C, RI'], extraDone: ['a'] })).toEqual(['B, MA', 'C, RI'])
  })
  it('rotation has no duplicates and every entry carries a state', () => {
    expect(new Set(CITY_ROTATION.map((c) => c.toLowerCase())).size).toBe(CITY_ROTATION.length)
    for (const c of CITY_ROTATION) expect(c).toMatch(/, [A-Z]{2}$/)
  })
})

describe('nextCapReset', () => {
  it('is the 14th of this month until it passes, then next month', () => {
    expect(nextCapReset(new Date('2026-11-06T00:00:00Z'))).toBe('2026-11-14')
    expect(nextCapReset(new Date('2026-11-14T12:00:00Z'))).toBe('2026-12-14')
    expect(nextCapReset(new Date('2026-12-20T00:00:00Z'))).toBe('2027-01-14')
  })
})

describe('assessPool', () => {
  const now = new Date('2026-11-06T12:00:00Z')
  it('is not low with two weeks of leads', () => {
    const a = assessPool({ poolRestaurants: 18, instantlyUncontacted: 280, now })
    expect(a.low).toBe(false); expect(a.run).toBe(false); expect(a.runway_days).toBe(14)
  })
  it('fires when runway drops under the line and nothing blocks', () => {
    const a = assessPool({ poolRestaurants: 18, instantlyUncontacted: 60, now })
    expect(a.low).toBe(true); expect(a.run).toBe(true); expect(a.runway_days).toBe(3)
  })
  it('low but blocked by the monthly cap until the 14th; free again after the reset', () => {
    const base = { poolRestaurants: 0, instantlyUncontacted: 40, remainingInPlan: 0, remainingCheckedAt: '2026-11-05T00:00:00Z' }
    const blocked = assessPool({ ...base, now })
    expect(blocked.low).toBe(true); expect(blocked.run).toBe(false); expect(blocked.reasons[0]).toMatch(/cap is used up until 2026-11-14/)
    expect(assessPool({ ...base, now: new Date('2026-11-14T12:00:00Z') }).run).toBe(true)
  })
  it('blocks on a 7-day bounce over 2% once there are enough sends, on low credits, and on an open wave', () => {
    expect(assessPool({ poolRestaurants: 0, instantlyUncontacted: 0, weekSent: 100, weekBounced: 3, now }).reasons[0]).toMatch(/bounce 3.0%/)
    expect(assessPool({ poolRestaurants: 0, instantlyUncontacted: 0, weekSent: 20, weekBounced: 3, now }).run).toBe(true) // too few sends to judge
    expect(assessPool({ poolRestaurants: 0, instantlyUncontacted: 0, verifierCredits: 10, now }).reasons[0]).toMatch(/credits/)
    expect(assessPool({ poolRestaurants: 0, instantlyUncontacted: 0, openWave: { id: 'abcdefgh-1', status: 'running' }, now }).run).toBe(false)
  })
  it('force runs a healthy pool but never past a block', () => {
    expect(assessPool({ poolRestaurants: 500, instantlyUncontacted: 500, force: true, now }).run).toBe(true)
    expect(assessPool({ poolRestaurants: 500, instantlyUncontacted: 500, force: true, verifierCredits: 0, now }).run).toBe(false)
  })
  it('with no Instantly reading, judges the DB pool alone against the same line', () => {
    expect(assessPool({ poolRestaurants: NEW_LEADS_PER_DAY * LOW_RUNWAY_DAYS, now }).low).toBe(false)
    expect(assessPool({ poolRestaurants: NEW_LEADS_PER_DAY * LOW_RUNWAY_DAYS - 1, now }).low).toBe(true)
  })
})

describe('helpers', () => {
  it('emailYield, batchLabel', () => {
    expect(emailYield(84, 210)).toBeCloseTo(0.4)
    expect(emailYield(0, 0)).toBe(0)
    expect(batchLabel('restaurant', ['Lynn, MA', 'Nashua, NH'], new Date('2026-11-20T00:00:00Z'))).toBe('2026-11-20-manh-restaurants-auto')
  })
  it('parses the upload, verify and haiku summaries', () => {
    expect(parseUploadLine('uploaded=121 duplicates=0 skipped=0 invalid=0 blocklist=0 remaining_in_plan=879')).toEqual({ uploaded: 121, remaining_in_plan: 879 })
    expect(parseUploadLine('uploaded=5 duplicates=0 skipped=0 invalid=0 blocklist=0 remaining_in_plan=undefined')).toEqual({ uploaded: 5, remaining_in_plan: null })
    expect(parseUploadLine('nothing')).toBeNull()
    const v = parseVerifyOutput('210 API calls · 3 from cache · wrote → x\nverify_result: ok=147 · catch_all=45 · invalid=10 · unknown=8\nMillionVerifier credits left: 168\n')
    expect(v).toEqual({ credits: 168, calls: 210, tally: { ok: 147, catch_all: 45, invalid: 10, unknown: 8 } })
    expect(parseHaikuCost('  93 sites · owner named 12 · hooks 80 · emails filled 3 · tokens in 700000 out 14000 ≈ $0.077')).toBe(0.077)
  })
})

import { describe, expect, it } from 'vitest'
import { matchesTrade, selectDesignSystem, DEFAULT_DESIGN_SYSTEMS } from './designSystems.ts'
import {
  FALLBACK_PLAYBOOK,
  isPlaybookStale,
  type NichePlaybook,
  selectNichePlaybook,
} from './nichePlaybooks.ts'

const pb = (id: string, trades: string[]): NichePlaybook => ({
  ...FALLBACK_PLAYBOOK,
  id,
  display_name: id,
  trades,
  researched_at: new Date().toISOString(),
})

describe('matchesTrade', () => {
  it('matches whole words, including short tags', () => {
    expect(matchesTrade(['hvac'], 'HVAC repair')).toBe(true)
    expect(matchesTrade(['ev'], 'ev charger install')).toBe(true)
    expect(matchesTrade(['ev'], 'developer')).toBe(false) // short tag never matches mid-word
  })

  it('matches 4+ char tags as substrings both ways', () => {
    expect(matchesTrade(['remodel'], 'kitchen remodeling')).toBe(true)
    expect(matchesTrade(['plumbing'], 'plumb')).toBe(true)
  })

  it('never matches an empty trade', () => {
    expect(matchesTrade(['plumber'], '')).toBe(false)
    expect(matchesTrade(['plumber'], null)).toBe(false)
  })
})

describe('selectNichePlaybook', () => {
  const books = [pb('roofer', ['roofer', 'roofing', 'roof']), pb('plumber', ['plumber', 'plumbing'])]

  it('picks the playbook whose trades match the business type', () => {
    expect(selectNichePlaybook(books, 'Roofing company')?.id).toBe('roofer')
    expect(selectNichePlaybook(books, 'plumber')?.id).toBe('plumber')
  })

  it('returns undefined when nothing matches (caller researches or falls back)', () => {
    expect(selectNichePlaybook(books, 'bakery')).toBeUndefined()
    expect(selectNichePlaybook(books, undefined)).toBeUndefined()
  })
})

describe('isPlaybookStale', () => {
  const now = Date.now()
  it('fresh row is not stale; 121-day-old row is', () => {
    expect(isPlaybookStale(pb('x', []), now)).toBe(false)
    const old = { ...pb('x', []), researched_at: new Date(now - 121 * 24 * 3600 * 1000).toISOString() }
    expect(isPlaybookStale(old, now)).toBe(true)
  })
  it('missing researched_at is stale', () => {
    expect(isPlaybookStale({ ...pb('x', []), researched_at: null }, now)).toBe(true)
  })
})

describe('design-system selection still works after the matcher extraction', () => {
  it('stays deterministic and trade-aware', () => {
    const a = selectDesignSystem(DEFAULT_DESIGN_SYSTEMS, 'seed-1', 'plumbing')
    const b = selectDesignSystem(DEFAULT_DESIGN_SYSTEMS, 'seed-1', 'plumbing')
    expect(a.id).toBe(b.id)
    // a plumbing booking draws from plumbing-tagged + universal styles
    const eligible = DEFAULT_DESIGN_SYSTEMS.filter(
      (d) => d.trades.length === 0 || matchesTrade(d.trades, 'plumbing'),
    ).map((d) => d.id)
    expect(eligible).toContain(a.id)
  })
})

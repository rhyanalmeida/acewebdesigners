import { describe, expect, it } from 'vitest'
import { DEFAULT_DESIGN_SYSTEMS, matchesTrade, selectDesignSystem } from './designSystems.ts'

// Styles a food business may receive. The three universals (nocturne-luxe, editorial-serif,
// clean-corporate-trust) are deliberately NOT here: with 2+ food styles matching every
// restaurant category, selectDesignSystem stays on-trade and a diner never gets a corporate look.
const FOOD_OK = new Set([
  'appetite-market', 'candlelit-bistro', 'trattoria-rustic', 'fiesta-color', 'harbor-seafood', 'morning-light-cafe',
  'vintage-signage', 'warm-craftsman', 'playful-rounded',
])
const byId = (id: string) => DEFAULT_DESIGN_SYSTEMS.find((d) => d.id === id)!

describe('selectDesignSystem', () => {
  it('never hands a restaurant a corporate or contractor look', () => {
    const cats = [
      'Italian restaurant', 'Pizza restaurant', 'Mexican restaurant', 'Restaurant', 'Seafood restaurant', 'Cafe',
      'American restaurant', 'Family restaurant', 'Bar & grill', 'Coffee shop', 'Breakfast restaurant', 'Diner',
      'Steak house', 'Japanese restaurant', 'Puerto Rican restaurant', 'Takeout Restaurant', 'Chophouse restaurant',
    ]
    for (const cat of cats) {
      for (let i = 0; i < 25; i++) {
        const ds = selectDesignSystem(DEFAULT_DESIGN_SYSTEMS, `seed-${i}`, cat)
        expect(FOOD_OK.has(ds.id), `${cat} → ${ds.id}`).toBe(true)
      }
    }
  })
  it('matches cuisine-specific styles to their cuisine', () => {
    expect(matchesTrade(byId('fiesta-color').trades, 'Mexican restaurant')).toBe(true)
    expect(matchesTrade(byId('harbor-seafood').trades, 'Seafood restaurant')).toBe(true)
    expect(matchesTrade(byId('morning-light-cafe').trades, 'Coffee shop')).toBe(true)
    expect(matchesTrade(byId('trattoria-rustic').trades, 'Pizza restaurant')).toBe(true)
    expect(matchesTrade(byId('candlelit-bistro').trades, 'Steak house')).toBe(true)
  })
  it('keeps the single-match + universals behaviour for trades', () => {
    const ids = new Set(Array.from({ length: 60 }, (_, i) => selectDesignSystem(DEFAULT_DESIGN_SYSTEMS, `s${i}`, 'Roofing contractor').id))
    expect(ids.has('industrial-steel')).toBe(true)
    expect(ids.has('nocturne-luxe')).toBe(true)
    for (const id of ids) expect(['industrial-steel', 'nocturne-luxe', 'editorial-serif', 'clean-corporate-trust'].includes(id), id).toBe(true)
  })
  it('is deterministic per seed', () => {
    expect(selectDesignSystem(DEFAULT_DESIGN_SYSTEMS, 'abc', 'Pizza restaurant').id)
      .toBe(selectDesignSystem(DEFAULT_DESIGN_SYSTEMS, 'abc', 'Pizza restaurant').id)
  })
})

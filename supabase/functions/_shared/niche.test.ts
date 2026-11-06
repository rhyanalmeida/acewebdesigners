import { describe, expect, it } from 'vitest'
import { isFoodBusiness, nicheNoun } from './niche.ts'

describe('isFoodBusiness', () => {
  it('matches the Google Maps restaurant categories we scrape', () => {
    for (const t of [
      'Pizza restaurant', 'Mexican restaurant', 'Cafe', 'Diner', 'Coffee shop', 'Bar & grill', 'Breakfast restaurant',
      'Seafood restaurant', 'Bakery', 'Espresso bar', 'Bar', 'Irish pub', 'Steak house', 'Chophouse restaurant',
      'Oyster bar restaurant', 'Takeout Restaurant', 'Seafood market', 'Inn', 'Deli', 'Food truck',
    ])
      expect(isFoodBusiness(t), t).toBe(true)
  })
  it('rejects trades, near-misses and empty values', () => {
    for (const t of ['Roofing contractor', 'General contractor', 'plumber', 'HVAC contractor', 'Electrician', 'Barbershop', 'Publishing company', 'Wellness center', '', null, undefined])
      expect(isFoodBusiness(t), String(t)).toBe(false)
  })
  it('nicheNoun picks the copy word', () => {
    expect(nicheNoun('Italian restaurant')).toBe('restaurants')
    expect(nicheNoun('Roofing contractor')).toBe('contractors')
    expect(nicheNoun(null)).toBe('contractors')
  })
})

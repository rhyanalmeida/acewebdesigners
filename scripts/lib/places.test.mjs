import { describe, it, expect } from 'vitest'
import { placeIdFromHref, parseRating, parseAddress, parseCardText, mapsQuery, phoneFromItemId } from './places.mjs'
import { classifyWebsite } from './website-kind.mjs'

describe('placeIdFromHref', () => {
  it('prefers the real Google Place ID (!19sChIJ…) — the same id Apify emits', () => {
    expect(placeIdFromHref('https://www.google.com/maps/place/1885/data=!4m7!3m6!1s0x89e407004e3c4c53:0xaf360d434d5ed6d5!8m2!3d42.25!16s%2Fg%2F11vm18v5g1!19sChIJU0w8TgAH5IkR1dZeTUMNNq8'))
      .toBe('ChIJU0w8TgAH5IkR1dZeTUMNNq8')
  })
  it('falls back to the ftid pair when no Place ID is present', () => {
    expect(placeIdFromHref('https://www.google.com/maps/place/1885/data=!4m7!3m6!1s0x89e407004e3c4c53:0xaf360d434d5ed6d5!8m2!3d42.25'))
      .toBe('0x89e407004e3c4c53:0xaf360d434d5ed6d5')
  })
  it('falls back to the place name segment', () => {
    expect(placeIdFromHref('https://www.google.com/maps/place/Mercado+Restaurant/@42.2,-71.8,17z')).toBe('name:mercado+restaurant')
    expect(placeIdFromHref('')).toBe('')
  })
})

describe('parseRating', () => {
  it('reads "4.9(922)" and "4.8 (1,080)"', () => {
    expect(parseRating('1885\n4.9(922)\nAmerican restaurant')).toEqual({ rating: 4.9, reviews: 922 })
    expect(parseRating('4.8 (1,080)')).toEqual({ rating: 4.8, reviews: 1080 })
  })
  it('returns nulls when absent', () => {
    expect(parseRating('New restaurant')).toEqual({ rating: null, reviews: null })
  })
})

describe('parseAddress', () => {
  it('splits a US address', () => {
    expect(parseAddress('48 Green St, Worcester, MA 01604 ')).toEqual({ street: '48 Green St', city: 'Worcester', state: 'MA', zip: '01604' })
  })
  it('handles a trailing country, zip+4 and multi-part streets', () => {
    expect(parseAddress('100 Front St, Suite 4, Boston, MA 02110-1234, United States'))
      .toEqual({ street: '100 Front St, Suite 4', city: 'Boston', state: 'MA', zip: '02110' })
  })
  it('does not invent a state', () => {
    expect(parseAddress('Main St, Somewhere')).toEqual({ street: 'Main St', city: 'Somewhere', state: '', zip: '' })
    expect(parseAddress('')).toEqual({ street: '', city: '', state: '', zip: '' })
  })
})

describe('parseCardText', () => {
  it('pulls category + street from the dotted line and skips hours lines', () => {
    const t = 'deadhorse hill\ndeadhorse hill\n4.6(941)\nAmerican restaurant ·  · 281 Main St\nFunky but upscale New American cuisine\nOpen · Closes 9 PM'
    expect(parseCardText(t)).toEqual({ category: 'American restaurant', street: '281 Main St', price: '' })
  })
  it('reads a price tier when present', () => {
    expect(parseCardText('X\n4.5(10)\nPizza restaurant · $$ · 5 Elm St\n$$')).toMatchObject({ category: 'Pizza restaurant', street: '5 Elm St', price: '$$' })
  })
})

describe('misc', () => {
  it('builds the query and parses phones', () => {
    expect(mapsQuery(' restaurants ', 'Worcester, MA')).toBe('restaurants in Worcester, MA')
    expect(phoneFromItemId('phone:tel:+17746700933')).toBe('+17746700933')
    expect(phoneFromItemId('phone:tel:(508) 459-0012')).toBe('5084590012')
    expect(phoneFromItemId('')).toBe('')
  })
  it('classifies website kinds (shared with the Apify path)', () => {
    expect(classifyWebsite('')).toBe('none')
    expect(classifyWebsite('https://www.instagram.com/tastyexperiencebistro/')).toBe('social')
    expect(classifyWebsite('https://order.toasttab.com/x')).toBe('social')
    expect(classifyWebsite('http://1885worcester.com/')).toBe('real')
  })
})

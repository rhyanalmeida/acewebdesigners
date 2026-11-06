import { describe, it, expect } from 'vitest'
import { parseCsv, csvEscape, toCsv, findColumn } from './csv.mjs'

describe('parseCsv / toCsv', () => {
  it('round-trips quotes, commas, newlines and CRLF', () => {
    const rows = [
      ['title', 'emails/0', 'address'],
      ['Joe\'s "Place"', 'joe@place.com', '1 Main St, Boston, MA'],
      ['Multi\nline', '', ''],
    ]
    const text = toCsv(rows)
    expect(text.endsWith('\n')).toBe(true)
    expect(parseCsv(text)).toEqual(rows)
    // CRLF row terminators (Windows exports) — rows without an embedded newline, so only the
    // terminators change
    const flat = rows.slice(0, 2)
    expect(parseCsv(toCsv(flat).replace(/\n/g, '\r\n'))).toEqual(flat)
  })
  it('drops blank lines but keeps rows with an empty first cell', () => {
    expect(parseCsv('a,b\n\n,x\n')).toEqual([['a', 'b'], ['', 'x']])
    expect(parseCsv('')).toEqual([])
  })
  it('escapes only when needed', () => {
    expect(csvEscape('plain')).toBe('plain')
    expect(csvEscape('a,b')).toBe('"a,b"')
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""')
    expect(csvEscape(null)).toBe('')
  })
})

describe('findColumn', () => {
  it('matches case- and punctuation-insensitively, first candidate wins', () => {
    const H = ['Title', 'emails/0', 'Place ID', 'categoryName']
    expect(findColumn(H, 'email', 'emails/0')).toBe(1)
    expect(findColumn(H, 'place_id', 'placeId')).toBe(2)
    expect(findColumn(H, 'categoryname')).toBe(3)
    expect(findColumn(H, 'nope')).toBe(-1)
    expect(findColumn(undefined, 'x')).toBe(-1)
  })
})

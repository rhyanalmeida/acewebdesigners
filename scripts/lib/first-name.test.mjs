import { describe, it, expect } from 'vitest'
import { loadNames, firstNameFromEmail, shortBusinessName, greetingName } from './first-name.mjs'

const names = loadNames('Todd\nFrank\nParker\nCody\nKing\nHugh\nNathaniel\nNat\nStar\nPat\nJustin\n')

describe('firstNameFromEmail', () => {
  it('takes a validated first token, with separators or concatenated', () => {
    expect(firstNameFromEmail('parker.gardner@x.com', names)).toBe('Parker')
    expect(firstNameFromEmail('cody@x.com', names)).toBe('Cody')
    expect(firstNameFromEmail('toddhardy@x.com', names)).toBe('Todd')
    expect(firstNameFromEmail('frankreynoldsjr75@gmail.com', names)).toBe('Frank')
    expect(firstNameFromEmail('nathanieldavis842@yahoo.com', names)).toBe('Nathaniel') // longest prefix, not "Nat"
  })
  it('never invents a name from role boxes, initials, surnames or business words', () => {
    expect(firstNameFromEmail('info@x.com', names)).toBeNull()
    expect(firstNameFromEmail('jking@x.com', names)).toBeNull() // initial + surname
    expect(firstNameFromEmail('costello81@icloud.com', names)).toBeNull()
    expect(firstNameFromEmail('stardif@x.com', names)).toBeNull() // "Star" prefix too short a remainder
    expect(firstNameFromEmail('patriotpaintingme@gmail.com', names)).toBeNull()
    expect(firstNameFromEmail('kingsseasonalsolutions@gmail.com', names)).toBeNull()
    expect(firstNameFromEmail('hughesbros@x.com', names)).toBeNull()
  })
})

describe('shortBusinessName', () => {
  it('drops legal suffixes, parentheticals and colon/slash tails', () => {
    expect(shortBusinessName('Gardner Road Company')).toBe('Gardner Road')
    expect(shortBusinessName('Maxweld Fabrication (aluminum docks)')).toBe('Maxweld Fabrication')
    expect(shortBusinessName('MANNING BUILDCO: New Construction and Renovations')).toBe('MANNING BUILDCO')
    expect(shortBusinessName('Golden Ridge Wood Products LLC')).toBe('Golden Ridge Wood Products')
  })
  it('drops trade words only when two or more words remain', () => {
    expect(shortBusinessName('Atlantic Landscape Construction')).toBe('Atlantic Landscape')
    expect(shortBusinessName('Maine Construction Solutions')).toBe('Maine Construction Solutions')
    expect(shortBusinessName('Professional Roofing Company')).toBe('Professional Roofing')
    expect(shortBusinessName('')).toBe('there')
  })
})

describe('greetingName', () => {
  it('prefers the email-derived name, else the business name', () => {
    expect(greetingName({ email: 'justin@loring.com', businessName: 'Loring Construction LLC', names })).toBe('Justin')
    expect(greetingName({ email: 'info@loring.com', businessName: 'Loring Construction LLC', names })).toBe('Loring Construction')
  })
})

import { describe, it, expect } from 'vitest'
import { classifyReply, stripQuoted, isTerminal } from './reply-classifier.mjs'

const quoted = `Yes please\n\nOn Tue, Sep 22, 2026 at 9:02 AM Rhyan <rhyan@getacewebdesigners.com> wrote:\n> Want to see it? Reply "yes"\n> not interested is a phrase in the quote`

describe('stripQuoted', () => {
  it('drops quoted history and signatures', () => {
    expect(stripQuoted(quoted)).toBe('Yes please')
    expect(stripQuoted('Sure\n--\nTodd Hardy\nHardy Construction')).toBe('Sure')
    expect(stripQuoted('ok\nSent from my iPhone')).toBe('ok')
  })
})

describe('classifyReply', () => {
  it('recognises a clear yes', () => {
    for (const t of ['yes', 'Yes!', 'Sure, send it over', 'sounds good', 'Go ahead', "Let's see it", 'Yes, how much is it?', quoted])
      expect(classifyReply(t), t).toBe('yes')
  })
  it('recognises a soft no', () => {
    for (const t of ['Not interested', 'No thanks', 'We already have a guy', 'Not right now'])
      expect(classifyReply(t), t).toBe('no')
  })
  it('recognises remove / unsubscribe language (terminal)', () => {
    for (const t of [
      'please remove me',
      'unsubscribe',
      'Yes, take me off your list',
      'PLEASE REMOVE OUR NAME FROM YOUR LIST\n\nRay Fraser\nInside Sales',
      'spam elsewhere please',
      'Do not email me again',
    ])
      expect(classifyReply(t), t).toBe('remove')
  })
  it('recognises hostile replies (terminal, never answered)', () => {
    for (const t of ['Bug someone else. Geez. Get a life', 'This is a scam', 'Screw off', 'I will report this to the FTC'])
      expect(classifyReply(t), t).toBe('hostile')
  })
  it('recognises auto-responders', () => {
    for (const t of ['Thank you for your email. I am out of the office until Monday.', 'Automatic reply: on vacation'])
      expect(classifyReply(t), t).toBe('ooo_auto')
  })
  it('leaves anything mixed or unclear to the model', () => {
    for (const t of ['', 'Who is this?', 'How much does it cost?', 'Maybe later in the fall', 'Call me at 207-555-0100'])
      expect(classifyReply(t), t).toBe('unknown')
  })
  it('isTerminal covers no/remove/hostile only', () => {
    expect(['no', 'remove', 'hostile'].every(isTerminal)).toBe(true)
    expect(['yes', 'unknown', 'ooo_auto', 'question'].some(isTerminal)).toBe(false)
  })
})

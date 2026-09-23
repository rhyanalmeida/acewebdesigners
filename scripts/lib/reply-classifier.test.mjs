import { describe, it, expect } from 'vitest'
import { classifyReply, stripQuoted } from './reply-classifier.mjs'

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
  it('recognises a clear no', () => {
    for (const t of ['Not interested', 'No thanks', 'please remove me', 'We already have a guy', 'unsubscribe', 'Not right now'])
      expect(classifyReply(t), t).toBe('no')
  })
  it('leaves anything mixed or unclear to a human', () => {
    for (const t of ['', 'Who is this?', 'How much does it cost?', 'Yes, take me off your list', 'Maybe later in the fall', 'Call me at 207-555-0100'])
      expect(classifyReply(t), t).toBe('unknown')
  })
})

import { describe, it, expect } from 'vitest'
import {
  mapReceivedEmail,
  mapLead,
  selectNew,
  advanceWatermark,
  trimSeen,
  toWebhookBody,
  demoLinkReply,
} from './instantly-events.mjs'

const reply = {
  id: 'e1',
  ue_type: 2,
  is_auto_reply: 0,
  lead: 'Owner@Example.com ',
  campaign_id: 'c1',
  timestamp_created: '2026-09-15T10:00:00.000Z',
}

describe('mapReceivedEmail', () => {
  it('maps a genuine campaign reply', () => {
    expect(mapReceivedEmail(reply)).toMatchObject({
      event_type: 'reply',
      lead_email: 'owner@example.com',
      campaign_id: 'c1',
      key: 'reply:e1',
      ts: '2026-09-15T10:00:00.000Z',
    })
  })
  it('drops auto-replies (OOO / bounce notices)', () => {
    expect(mapReceivedEmail({ ...reply, is_auto_reply: 1 })).toBeNull()
  })
  it('drops non-campaign mail (warm-up, manual)', () => {
    expect(mapReceivedEmail({ ...reply, campaign_id: null })).toBeNull()
  })
  it('drops sent / scheduled items even if mis-filtered', () => {
    expect(mapReceivedEmail({ ...reply, ue_type: 1 })).toBeNull()
    expect(mapReceivedEmail({ ...reply, ue_type: 4 })).toBeNull()
  })
  it('falls back to from_address_email when lead is missing', () => {
    const ev = mapReceivedEmail({ ...reply, lead: undefined, from_address_email: 'X@Y.com' })
    expect(ev?.lead_email).toBe('x@y.com')
  })
  it('rejects garbage', () => {
    expect(mapReceivedEmail(null)).toBeNull()
    expect(mapReceivedEmail({})).toBeNull()
  })
})

describe('mapLead', () => {
  it('maps a bounced lead only under the bounced filter', () => {
    const lead = { email: 'A@b.com', status: -1, campaign: 'c1', timestamp_updated: 't' }
    expect(mapLead(lead, 'FILTER_VAL_BOUNCED')).toEqual({
      event_type: 'bounce',
      lead_email: 'a@b.com',
      campaign_id: 'c1',
      key: 'bounce:a@b.com',
      ts: 't',
    })
    expect(mapLead(lead, 'FILTER_VAL_UNSUBSCRIBED')).toBeNull()
  })
  it('maps an unsubscribed lead', () => {
    expect(mapLead({ email: 'u@b.com', status: -2 }, 'FILTER_VAL_UNSUBSCRIBED')?.event_type).toBe('unsubscribe')
  })
  it('never suppresses an active lead even if the page was mis-filtered', () => {
    expect(mapLead({ email: 'ok@b.com', status: 1 }, 'FILTER_VAL_BOUNCED')).toBeNull()
  })
  it('ignores leads without an email', () => {
    expect(mapLead({ status: -1 }, 'FILTER_VAL_BOUNCED')).toBeNull()
  })
})

describe('selectNew + watermark', () => {
  it('drops already-forwarded keys and records the new ones', () => {
    const seen = new Set(['reply:e1'])
    const out = selectNew([{ key: 'reply:e1' }, { key: 'reply:e2' }, { key: 'reply:e2' }], seen)
    expect(out.map((e) => e.key)).toEqual(['reply:e2'])
    expect(seen.has('reply:e2')).toBe(true)
  })
  it('advances the watermark to the newest event and never backwards', () => {
    const w = advanceWatermark('2026-09-15T10:00:00.000Z', [
      { ts: '2026-09-15T09:00:00.000Z' },
      { ts: '2026-09-15T11:00:00.000Z' },
      { ts: 'not a date' },
    ])
    expect(w).toBe('2026-09-15T11:00:00.000Z')
    expect(advanceWatermark('2026-09-15T10:00:00.000Z', [])).toBe('2026-09-15T10:00:00.000Z')
    expect(advanceWatermark(null, [])).toBeNull()
  })
  it('trims the seen set to the newest N', () => {
    expect(trimSeen(['a', 'b', 'c'], 2)).toEqual(['b', 'c'])
  })
})

describe('toWebhookBody', () => {
  it('produces the shape instantly-webhook parses', () => {
    expect(toWebhookBody({ event_type: 'bounce', lead_email: 'a@b.com', campaign_id: null })).toEqual({
      event_type: 'bounce',
      lead_email: 'a@b.com',
      campaign_id: undefined,
      source: 'instantly-poll',
    })
  })
  it('carries the reply text, email id, inbox and subject on replies so the webhook can classify + auto-send', () => {
    const ev = mapReceivedEmail({
      id: 'e1', ue_type: 2, lead: 'Todd@Hardy.com', campaign_id: 'c1', eaccount: 'rhyan@getacewebdesigners.com',
      subject: 'Re: Hardy Construction homepage?', body: { html: '<div>Yes please<br></div><blockquote>Want to see it?</blockquote>' },
    })
    expect(toWebhookBody(ev)).toMatchObject({
      event_type: 'reply', lead_email: 'todd@hardy.com', reply_text: 'Yes please', email_id: 'e1',
      eaccount: 'rhyan@getacewebdesigners.com', subject: 'Re: Hardy Construction homepage?',
    })
  })
})

describe('demoLinkReply', () => {
  it('greets by first name, falls back to business, and links exactly once', () => {
    const r = demoLinkReply({ first_name: '', business_name: 'Hardy Construction', demo_url: 'https://acewebdesigners.com/demo/abc' })
    expect(r.text.startsWith('Hi Hardy Construction,')).toBe(true)
    expect(r.text.match(/https:\/\//g)).toHaveLength(1)
    expect(r.html).toContain('<a href="https://acewebdesigners.com/demo/abc">')
  })
})

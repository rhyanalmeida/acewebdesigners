/**
 * Attribution precedence — the rule that must never regress: REAL ad params
 * always beat the hardcoded fallback, and the fallback only ever stamps values
 * that cannot go stale (no ad id, no names).
 *
 * Pure module (no Deno APIs), so it runs under the repo's vitest.
 */

import { describe, expect, it } from 'vitest'
import { mergeAttribution, parseAttribution, withDefaultAdIds } from './attribution.ts'

const CONTRACTOR_URL = 'https://acewebdesigners.com/contractorlanding?source=landing-contractors'

/** A click carrying the full url_tags template, as the paused ad's clicks did. */
const TAGGED_URL =
  CONTRACTOR_URL +
  '&utm_source=Facebook&utm_medium=Contractors%20adset&utm_campaign=Real%20Campaign' +
  '&utm_content=Real%20Ad&campaign_id=111&adset_id=222&ad_id=333'

describe('parseAttribution', () => {
  it('extracts every tracked key from a tagged landing URL', () => {
    expect(parseAttribution(TAGGED_URL)).toEqual({
      utm_source: 'Facebook',
      utm_medium: 'Contractors adset',
      utm_campaign: 'Real Campaign',
      utm_content: 'Real Ad',
      campaign_id: '111',
      adset_id: '222',
      ad_id: '333',
    })
  })

  it('returns empty for an untagged URL, and never throws on junk', () => {
    expect(parseAttribution(CONTRACTOR_URL)).toEqual({})
    expect(parseAttribution('not-a-url')).toEqual({})
    expect(parseAttribution(undefined)).toEqual({})
  })
})

describe('mergeAttribution', () => {
  it('lets the client-captured first-touch set win over the live URL', () => {
    const merged = mergeAttribution({ ad_id: 'first-touch' }, { ad_id: '333', utm_source: 'Facebook' })
    expect(merged.ad_id).toBe('first-touch')
    expect(merged.utm_source).toBe('Facebook')
  })
})

describe('withDefaultAdIds', () => {
  it('REAL params win — the fallback never overwrites a tagged click', () => {
    const real = mergeAttribution(undefined, parseAttribution(TAGGED_URL))
    const out = withDefaultAdIds(real, TAGGED_URL)

    expect(out).toEqual(real)
    expect(out.ad_id).toBe('333')
    expect(out.utm_campaign).toBe('Real Campaign')
    // The fallback marker must be absent: this row was really attributed.
    expect(out.utm_fallback).toBeUndefined()
  })

  it('stamps stable ids when a contractor click arrives with no params', () => {
    const out = withDefaultAdIds({}, CONTRACTOR_URL)

    expect(out.utm_source).toBe('Facebook')
    expect(out.campaign_id).toBe('120241554190170259')
    expect(out.adset_id).toBe('120242709687340259')
    expect(out.utm_fallback).toBe('1')
  })

  it('never emits an ad id or a name — those rot on relaunch/rename', () => {
    const out = withDefaultAdIds({}, CONTRACTOR_URL)

    expect(out.ad_id).toBeUndefined()
    expect(out.utm_content).toBeUndefined()
    expect(out.utm_medium).toBeUndefined()
    expect(out.utm_campaign).toBeUndefined()
  })

  it('does not fire for non-contractor or malformed landing URLs', () => {
    expect(withDefaultAdIds({}, 'https://acewebdesigners.com/')).toEqual({})
    expect(withDefaultAdIds({}, 'not-a-url')).toEqual({})
    expect(withDefaultAdIds({}, undefined)).toEqual({})
  })

  it('a partially-tagged click still counts as real and is left alone', () => {
    // Only campaign_id survived (e.g. a truncated template) — do not "top up"
    // with defaults, or a real click gets a fabricated fallback marker.
    const partial = { campaign_id: '999' }
    expect(withDefaultAdIds(partial, CONTRACTOR_URL)).toEqual(partial)
  })
})

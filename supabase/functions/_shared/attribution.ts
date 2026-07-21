/**
 * Attribution parsing — single source of truth for both `lead` and `book`.
 *
 * Pulls the marketing + Facebook ad identifiers out of the landing URL so every
 * funnel event (Lead, Schedule, and the replayed CompleteRegistration/Purchase)
 * carries the same high-quality attribution. fbc/fbp/fbclid travel separately as
 * Meta click ids; this is the human-readable campaign/ad context for reporting +
 * Meta custom_data.
 *
 * Matches the ad's URL-parameters template configured in Meta Ads Manager:
 *   utm_source=Facebook&utm_medium={{adset.name}}&utm_campaign={{campaign.name}}
 *   &utm_content={{ad.name}}&campaign_id={{campaign.id}}&adset_id={{adset.id}}
 *   &ad_id={{ad.id}}
 * The *_id params are only present when that template is set; absent otherwise.
 * (Note: Meta MATCH QUALITY comes from user_data — email/phone/fbc/fbp/ip/ua —
 * which every event replays; these ids are campaign/ad attribution context.)
 */

const ATTRIBUTION_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'campaign_id',
  'adset_id',
  'ad_id',
] as const

/** Extract utm_* + campaign/adset/ad ids from a landing URL (capped + sanitized). */
export function parseAttribution(url?: string): Record<string, string> {
  const out: Record<string, string> = {}
  if (!url) return out
  try {
    const sp = new URL(url).searchParams
    for (const k of ATTRIBUTION_KEYS) {
      const v = sp.get(k)
      if (v) out[k] = v.slice(0, 256)
    }
  } catch {
    /* ignore bad URL */
  }
  return out
}

/**
 * Merge a client-captured attribution map (first-touch, from sessionStorage)
 * with params parsed server-side from the landing URL. Client-captured wins for
 * keys it has (it saw the original landing), URL fills any gaps.
 */
export function mergeAttribution(
  fromClient: Record<string, unknown> | undefined,
  fromUrl: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = { ...fromUrl }
  if (fromClient) {
    for (const k of ATTRIBUTION_KEYS) {
      const v = fromClient[k]
      if (typeof v === 'string' && v) out[k] = v.slice(0, 256)
    }
  }
  return out
}

/**
 * The live contractor ad's URL carries only `source=landing-contractors` until
 * its UTM template is published in Ads Manager, so those clicks would arrive
 * with no campaign context. When that marker is present and nothing else was
 * captured, stamp the known ids of the one running ad. Real UTM params, once the
 * template is live, are present and win — this then never fires.
 *
 * ⚠️ MUST track whichever ad is ACTIVE. The 7/21 captioned ad launched WITHOUT a
 * url_tags template (verified via the Marketing API), so this fallback is what
 * attributes its leads — left pointing at the paused "funny hook" it would have
 * credited every new lead to the old creative. Re-check with `npm run meta-ads:status`
 * after any relaunch.
 */
const CONTRACTOR_AD_DEFAULTS: Record<string, string> = {
  utm_source: 'Facebook',
  utm_medium: 'Contractors — US — Advantage+ Audience — $20/day - Copy',
  utm_campaign: 'Free Website Offer For Contractors (6/1/26)',
  utm_content: 'Rhyan captioned — free site offer (7/21/26)',
  campaign_id: '120241554190170259',
  adset_id: '120242709687340259',
  ad_id: '120247255043930259',
}

export function withDefaultAdIds(
  utm: Record<string, string>,
  landingUrl?: string,
): Record<string, string> {
  if (utm.utm_source || utm.campaign_id || utm.ad_id) return utm
  try {
    if (landingUrl && new URL(landingUrl).searchParams.get('source') === 'landing-contractors') {
      return { ...CONTRACTOR_AD_DEFAULTS }
    }
  } catch {
    /* ignore bad URL */
  }
  return utm
}

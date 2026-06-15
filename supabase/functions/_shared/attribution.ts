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

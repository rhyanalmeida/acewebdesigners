// Mirror of scripts/lib/reply-classifier.mjs (vitest-covered there) — keep in sync.
//
// Hard-rule pre-pass for cold-email replies. The reply desk (reply-desk fn) runs a model
// classifier for the nuanced intents; these regexes are the safety rails that OVERRIDE it:
// a 'remove' or 'hostile' here is final (suppress, never answer), a 'no' here never becomes a
// 'yes', and a 'yes' here is only trusted when no NO-terms are present.

export type ReplySentiment =
  | 'yes'
  | 'question'
  | 'objection_price'
  | 'objection_timing'
  | 'later'
  | 'no'
  | 'remove'
  | 'hostile'
  | 'ooo_auto'
  | 'unknown'

/** What the regex pre-pass alone can decide. */
export type RuleSentiment = 'yes' | 'no' | 'remove' | 'hostile' | 'ooo_auto' | 'unknown'

export function stripQuoted(text: string | null | undefined): string {
  const lines = String(text ?? '').replace(/\r/g, '').split('\n')
  const out: string[] = []
  for (const raw of lines) {
    const l = raw.trim()
    if (/^on .{3,120} wrote:$/i.test(l)) break
    if (/^-{2,}\s*original message\s*-{2,}$/i.test(l)) break
    if (/^from:\s.+$/i.test(l) && out.length) break
    if (/^(sent from my|get outlook for)/i.test(l)) break
    if (l.startsWith('>')) continue
    if (/^--\s*$/.test(l)) break
    out.push(l)
  }
  return out.join('\n').trim()
}

const REMOVE =
  /\b(unsubscribe|remove (me|us|our (name|company|business|email))|take (me|us) off|stop (emailing|contacting|sending)|do not (email|contact)|don'?t (email|contact)|(no|not) (more )?(emails?|contact)|spam|opt ?out|cease)\b/i
const HOSTILE =
  /\b(bug someone else|get a life|f+u+c+k|screw (you|off)|piss off|go away|scam(mer)?|harass|lawyer|attorney|report(ing)? (you|this)|ftc|leave (me|us) alone)\b/i
const NO =
  /\b(not interested|no thanks?|no thank you|already have (a|someone|a guy|a website|one)|we'?re (all )?set|not (right )?now|no need|pass\b|not looking|wrong (person|number|email))\b/i
const YES =
  /\b(yes|yeah|yep|yup|sure|ok(ay)?|sounds good|go ahead|go for it|do it|build it|send it|let'?s see it|let'?s do it|i'?m interested|interested|please do|absolutely|why not|i'?d like to see|show me|make it|put it together|start|let'?s go)\b/i
const LATER =
  /\b(later|next (month|year|season|spring|summer|fall|winter)|busy season|check back|circle back|reach out (in|after)|not a good time)\b/i
const OOO =
  /\b(out of (the )?office|automatic reply|auto-?reply|autoreply|on vacation|away from (my )?(email|the office)|limited access to email|will (be )?(respond|reply|return) (on|after|when))\b/i

/**
 * Rule-only classification. 'remove' and 'hostile' are terminal; 'ooo_auto' means the
 * message is an auto-responder; 'yes'/'no' are the legacy signals; everything else is
 * 'unknown' and goes to the model.
 */
export function classifyReply(text: string | null | undefined): RuleSentiment {
  const body = stripQuoted(text)
  if (!body) return 'unknown'
  const head = body.slice(0, 400)
  if (HOSTILE.test(head)) return 'hostile'
  if (REMOVE.test(head)) return 'remove'
  if (OOO.test(head)) return 'ooo_auto'
  const no = NO.test(head)
  const later = LATER.test(head)
  const yes = YES.test(head.replace(new RegExp(NO.source, 'gi'), ' '))
  if (no && !yes) return 'no'
  if (no && yes) return 'unknown'
  if (later && !yes) return 'unknown'
  if (yes) return 'yes'
  return 'unknown'
}

/** True when the rules say this thread must never get an answer. */
export function isTerminal(s: ReplySentiment | RuleSentiment): boolean {
  return s === 'remove' || s === 'hostile' || s === 'no'
}

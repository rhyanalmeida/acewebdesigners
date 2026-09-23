// Classify a cold-email reply as 'yes' | 'no' | 'unknown'. Pure, unit-tested.
// Mirrored in supabase/functions/_shared/replyClassifier.ts — keep both in sync.
//
// Only a clear 'yes' triggers the automatic build + link send; 'no' and 'unknown'
// leave the row for a human (the GHL staff alert fires on every reply regardless).
// Conservative on purpose: "yes, but how much?" is still a yes (price is on the
// demo page); "not interested" / "remove me" / "already have someone" is a no; a
// question with no yes/no signal is unknown.

/** Strip quoted history, signatures and the unsubscribe footer so we only read what THEY typed. */
export function stripQuoted(text) {
  const lines = String(text ?? '').replace(/\r/g, '').split('\n')
  const out = []
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

const NO = /\b(not interested|no thanks?|no thank you|unsubscribe|remove me|take me off|stop emailing|don'?t (email|contact)|already have (a|someone|a guy|a website|one)|we'?re (all )?set|not (right )?now|no need|pass\b|not looking|do not (email|contact)|wrong (person|number|email)|spam)\b/i
const YES = /\b(yes|yeah|yep|yup|sure|ok(ay)?|sounds good|go ahead|go for it|do it|build it|send it|let'?s see it|let'?s do it|i'?m interested|interested|please do|absolutely|why not|i'?d like to see|show me|make it|put it together|start|let'?s go)\b/i
const LATER = /\b(later|next (month|year|season|spring|summer|fall|winter)|busy season|check back|circle back|reach out (in|after)|not a good time)\b/i

/** @returns {'yes'|'no'|'unknown'} */
export function classifyReply(text) {
  const body = stripQuoted(text)
  if (!body) return 'unknown'
  const head = body.slice(0, 400)
  const no = NO.test(head)
  const later = LATER.test(head)
  // Test "yes" on the text with the no-phrases removed, so "not interested" can't read as interest.
  const yes = YES.test(head.replace(new RegExp(NO.source, 'gi'), ' '))
  if (no && !yes) return 'no'
  if (no && yes) return 'unknown' // "yes, take me off" / "no, I'm interested" — a human reads it
  if (later && !yes) return 'unknown'
  if (yes) return 'yes'
  return 'unknown'
}

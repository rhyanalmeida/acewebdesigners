// Mirror of scripts/lib/reply-classifier.mjs (vitest-covered there) — keep in sync.
// Classifies a cold-email reply so instantly-webhook can auto-build on a clear "yes".

export type ReplySentiment = 'yes' | 'no' | 'unknown'

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

const NO = /\b(not interested|no thanks?|no thank you|unsubscribe|remove me|take me off|stop emailing|don'?t (email|contact)|already have (a|someone|a guy|a website|one)|we'?re (all )?set|not (right )?now|no need|pass\b|not looking|do not (email|contact)|wrong (person|number|email)|spam)\b/i
const YES = /\b(yes|yeah|yep|yup|sure|ok(ay)?|sounds good|go ahead|go for it|do it|build it|send it|let'?s see it|let'?s do it|i'?m interested|interested|please do|absolutely|why not|i'?d like to see|show me|make it|put it together|start|let'?s go)\b/i
const LATER = /\b(later|next (month|year|season|spring|summer|fall|winter)|busy season|check back|circle back|reach out (in|after)|not a good time)\b/i

export function classifyReply(text: string | null | undefined): ReplySentiment {
  const body = stripQuoted(text)
  if (!body) return 'unknown'
  const head = body.slice(0, 400)
  const no = NO.test(head)
  const later = LATER.test(head)
  const yes = YES.test(head.replace(new RegExp(NO.source, 'gi'), ' '))
  if (no && !yes) return 'no'
  if (no && yes) return 'unknown'
  if (later && !yes) return 'unknown'
  if (yes) return 'yes'
  return 'unknown'
}

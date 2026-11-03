# Outbound cold sequence — v5 (preview-first, 3 steps) — LIVE copy source

**Status:** v5 replaces v4 (2026-11-02, owner: "a whole plan that gets sales without me doing
anything"). v4 was reply-gated — 424 sends, 3 replies, all hostile, 0 interested — so the ask
changed from "reply yes and I'll build it" to **the preview link in every email**. The `/demo/<token>`
page builds the preview on open (fast path, under a minute, ~$0.005), so nobody who never clicks
costs anything, and the click itself is the interest signal (`prospects.demo_first_viewed_at`).
Push with `node scripts/instantly-create-campaign.mjs --update 46657029-fdd6-4567-b5fe-2165bb298367`
(the PATCH sends copy + schedule + daily cap, so the lib defaults MUST equal the live settings:
06:00–16:00 ET, `daily_limit` 60 campaign-wide = 2 inboxes × 30).

**What happens after a reply** is the reply desk (`supabase/functions/reply-desk`, runbook
`docs/OUTBOUND_FLOW.md`): hard rules suppress remove/hostile/no, a model answers questions from
the facts in `_shared/outboundFacts.ts` in-thread from the same inbox after a human-looking hold,
and anything else tags `outbound-needs-human` → staff SMS. People who open the preview and go
quiet get two in-thread nudges (`replyPolicy.ts` `nudgeText`, day +2 and +7).

**Parser notes:** `## Email N — Day D` headings + a `**Subject:**` line per email; a subject that
starts with `Re:` is sent with an EMPTY subject so Instantly threads it natively (Emails 2–3).
Bodies are written on long single lines on purpose — `unwrapSoftBreaks` would otherwise turn a
wrap before a capital/digit into a hard break.

## Rules honored (locked owner rules + CAN-SPAM)
- No invented stats, review counts, or social proof.
- Truthful preview framing: "I mocked up a homepage — it's here" is what the link delivers; the
  copy never says *when* it was made and never mentions tools, AI, automation or timings.
- Email 1's opener assumes a REDESIGN list (every prospect has a live website — check the batch's
  `website` column before sending).
- `{{demo_url}}` is the ONLY link, raw (link tracking OFF — the /demo page logs its own views).
- Instantly's unsubscribe link (`{{unsubscribe}}`) + the office postal address (30 North Main St,
  Leominster, MA 01453 — a street address per 16 CFR 316.2) in every footer.
- Plain text only. Price appears once (Email 3), same figure as `outboundPlan.ts`.

Merge fields (from `scripts/export-instantly.mjs`): `{{email}} {{first_name}} {{company_name}}
{{city}} {{state}} {{demo_url}}` — fallbacks `there` / `your area` are baked into the export, so
"Hi ," can't recur.

Cadence: **Day 0 → Day 3 → Day 7.** Stop on reply (Instantly default); replies go to the reply desk.

---

## Email 1 — Day 0 (the preview, no price)

**Subject:** {{company_name}} homepage?

Hi {{first_name}},

I came across {{company_name}} while looking at contractors in {{city}}. I design websites for contractors, and I mocked up a new homepage for you — built around your work, not a template.

It's here: {{demo_url}}

Looking is free and there's no call. If anything on it is wrong, or you'd want something changed, just reply and tell me.

Rhyan
Ace Web Designers

{{unsubscribe}}
Ace Web Designers · 30 North Main St, Leominster, MA 01453

---

## Email 2 — Day 3 (what it does for them, threaded — no price)

**Subject:** Re: {{company_name}} homepage?

Hi {{first_name}},

Adding to my last note. The homepage I put together for {{company_name}} loads fast on a phone, puts a tap-to-call button up top, and shows your best work first — built for someone looking you up from their driveway.

Have a look when you get a minute: {{demo_url}}

Tell me what you'd change and I'll take care of it.

Rhyan
Ace Web Designers

{{unsubscribe}}
Ace Web Designers · 30 North Main St, Leominster, MA 01453

---

## Email 3 — Day 7 (cost, once, threaded)

**Subject:** Re: {{company_name}} homepage?

Hi {{first_name}},

In case cost is the question: looking is free. If you like it and want it live, it's $49 a month — your own .com, hosting, and changes whenever you need them. Cancel anytime. If it's not for you, you're out nothing.

The preview is still here: {{demo_url}}

Rhyan
Ace Web Designers

{{unsubscribe}}
Ace Web Designers · 30 North Main St, Leominster, MA 01453

---

## Launch record
- [x] v4 copy approved by owner ("let's start") 2026-09-22; launched 2026-09-22.
- [x] Email 4 removed from the live campaign 2026-11-02 (3-step sequence).
- [ ] v5 pushed with `--update` (record date here when done).

# Outbound cold sequence — Restaurants v1 (preview-first, 3 steps) — LIVE copy source

**Status:** written 2026-11-03 when the owner moved the outbound funnel from contractors to local
restaurants ("stop the contractor ones, whole new plan with restaurants"). Same engine as the
contractor sequence (`OUTBOUND_COLD_SEQUENCE_DRAFT.md`): the preview link is in every email, the
`/demo/<token>` page builds the restaurant homepage on open, and the reply desk answers replies.
Plan + research: `docs/RESTAURANT_OUTBOUND_PLAN_2026-11-03.md`.

Create / update the Instantly campaign from this file:
```
node scripts/instantly-create-campaign.mjs --doc docs/OUTBOUND_COLD_SEQUENCE_RESTAURANTS.md --name "Outbound — Restaurants v1" --schedule restaurant
node scripts/instantly-create-campaign.mjs --doc docs/OUTBOUND_COLD_SEQUENCE_RESTAURANTS.md --schedule restaurant --update <campaign-id>
```
`--schedule restaurant` sends Mon–Fri 09:30–11:00 and 14:00–16:00 ET only — between the breakfast
rush and lunch, and between lunch and dinner. The hospitality benchmarks we found say operators
read email before 10 and mid-afternoon and ignore it during service.

**Parser notes:** `## Email N — Day D` headings + a `**Subject:**` line per email; a subject that
starts with `Re:` is sent with an EMPTY subject so Instantly threads it (Emails 2–3). Bodies are
long single lines on purpose (see `unwrapSoftBreaks`).

## Rules honored (locked owner rules + CAN-SPAM)
- No invented stats, review counts, or social proof. Nothing about how or when the page was made.
- The preview framing is literal: the page the link opens IS the mocked-up homepage.
- Every restaurant on the list has a website (that is where the email came from), so the copy is a
  "better one" angle and never says "you have no website".
- `{{demo_url}}` is the ONLY link, raw (link tracking OFF — the /demo page logs its own views).
- `{{unsubscribe}}` + the office postal address in every footer. Plain text. Price once (Email 3),
  same figure as `outboundPlan.ts` / `outboundFacts.ts`.
- Merge fields: `{{first_name}} {{company_name}} {{city}} {{demo_url}}` — fallbacks `there` /
  `your area` are baked into the export.

Cadence: **Day 0 → Day 3 → Day 7.** Stop on reply; replies go to the reply desk.

---

## Email 1 — Day 0 (the preview, no price)

**Subject:** {{company_name}} website?

Hi {{first_name}},

I came across {{company_name}} while looking at restaurants in {{city}}. I design websites for local restaurants, and I mocked up a new homepage for you — menu, hours and directions right up top, built to load fast on a phone.

It's here: {{demo_url}}

Looking is free and there's no call. If anything on it is wrong, or you'd want something changed, just reply and tell me.

Rhyan
Ace Web Designers

{{unsubscribe}}
Ace Web Designers · 30 North Main St, Leominster, MA 01453

---

## Email 2 — Day 3 (why it matters, threaded — no price)

**Subject:** Re: {{company_name}} website?

Hi {{first_name}},

Adding to my last note. Most people find a restaurant on their phone, usually when they're already hungry. The page I put together for {{company_name}} puts the menu, a tap-to-call button and directions at the top, so nobody has to hunt for them.

Have a look when the rush is over: {{demo_url}}

Tell me what you'd change and I'll take care of it.

Rhyan
Ace Web Designers

{{unsubscribe}}
Ace Web Designers · 30 North Main St, Leominster, MA 01453

---

## Email 3 — Day 7 (cost, once, threaded)

**Subject:** Re: {{company_name}} website?

Hi {{first_name}},

In case cost is the question: looking is free. If you like it and want it live, it's $49 a month — the domain you already have or a new one, hosting, and menu or hours changes whenever you need them. Cancel anytime. If it's not for you, you're out nothing.

The preview is still here: {{demo_url}}

Rhyan
Ace Web Designers

{{unsubscribe}}
Ace Web Designers · 30 North Main St, Leominster, MA 01453

---

## Launch record
- [x] Campaign created in Instantly 2026-11-03 — id `94ab9d2a-faac-46da-8470-7ade9c9fd55c`, NOT running until `go-live-restaurants.mjs` step 5.
- [x] First batches uploaded 2026-11-03: `2026-11-ma-restaurants` (273) + `2026-11-ma-restaurants-fb` (10 no-website restaurants reached via their Facebook page email).

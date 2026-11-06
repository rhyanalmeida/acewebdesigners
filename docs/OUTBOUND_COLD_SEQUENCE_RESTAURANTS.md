# Outbound cold sequence — Restaurants v2 (preview-first, 3 steps) — LIVE copy source

> v2 2026-11-04: each email cut to ~40 words (owner: v1 read "long and weird"); the Day-0 email no longer
> promises "hours" (the demo never lists hours — it says "Call for today's hours"). Pushed to the live
> campaign by `node scripts/go-live-restaurant-sites.mjs` (step 3; bodies only).

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

## v3 (2026-11-05, pending push) — Haiku-written opener

`scripts/enrich-haiku.mjs` reads each restaurant's own site and writes ONE opening sentence for it
(`prospects.first_line`, migration 0018) — a named dish, the cuisine, the neighborhood, their story — plain,
no flattery, no critique. `export-instantly.mjs` sends it as `{{first_line}}` and falls back to the v2
generic opener ("I design websites for restaurants around {{city}}.") when Haiku found nothing specific, so
the template can use it unconditionally. Email 1 v3 differs from v2 by its first sentence only:

```
Hi {{first_name}},

{{first_line}} I put together a new homepage for {{company_name}} — your menu, a tap-to-call button and directions right at the top, built for phones.

Take a look: {{demo_url}}

If anything's off, reply and I'll change it. No call, no charge to look.

Rhyan
Ace Web Designers
```
Push: `node scripts/instantly-create-campaign.mjs --doc docs/OUTBOUND_COLD_SEQUENCE_RESTAURANTS.md --schedule restaurant --update 94ab9d2a-faac-46da-8470-7ade9c9fd55c`
after replacing the Email 1 body below with the v3 body (the parser reads the `## Email N` sections only).
Prerequisites: `npx supabase db push` (0018), then import a Haiku-enriched CSV; leads uploaded before v3 have
no `first_line` variable → Instantly renders it empty, so push v3 only for new waves (new campaign or after
re-uploading with the variable).

---

## Email 1 — Day 0 (the preview, no price)

**Subject:** {{company_name}} website?

Hi {{first_name}},

I design websites for restaurants around {{city}}. I put together a new homepage for {{company_name}} — your menu, a tap-to-call button and directions right at the top, built for phones.

Take a look: {{demo_url}}

If anything's off, reply and I'll change it. No call, no charge to look.

Rhyan
Ace Web Designers

{{unsubscribe}}
Ace Web Designers · 30 North Main St, Leominster, MA 01453

---

## Email 2 — Day 3 (why it matters, threaded — no price)

**Subject:** Re: {{company_name}} website?

Hi {{first_name}},

Quick follow-up. Most people find a restaurant on their phone when they're already hungry — the page I made for {{company_name}} gets them to your menu and your phone number in one tap.

{{demo_url}}

Tell me what you'd change and I'll do it.

Rhyan
Ace Web Designers

{{unsubscribe}}
Ace Web Designers · 30 North Main St, Leominster, MA 01453

---

## Email 3 — Day 7 (cost, once, threaded)

**Subject:** Re: {{company_name}} website?

Hi {{first_name}},

If cost is the question: $37 a month, all in — your domain or a new one, hosting, and any menu or hours change whenever you need it. Cancel anytime.

The preview's still here: {{demo_url}}

Rhyan
Ace Web Designers

{{unsubscribe}}
Ace Web Designers · 30 North Main St, Leominster, MA 01453

---

## Launch record
- [x] Campaign created in Instantly 2026-11-03 — id `94ab9d2a-faac-46da-8470-7ade9c9fd55c`, ACTIVATED 2026-11-03 ~04:20 UTC.
- [x] First batches uploaded 2026-11-03: `2026-11-ma-restaurants` (273) + `2026-11-ma-restaurants-fb` (10 no-website restaurants reached via their Facebook page email).

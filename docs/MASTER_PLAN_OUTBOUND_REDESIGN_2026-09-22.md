# Master Plan — Outbound Redesign Cold Email (2026-09-22)

Read-only research plan. Nothing was sent, changed or written to Instantly, Supabase or GHL.
Locked decisions honored throughout: reply-gated demo (no link in any email), $49/mo, Instantly
only (never GHL / never acewebdesigners.com), 4 touches Day 0/3/7/14, plain text, and **no
invented stats** — every number below carries a source number `[n]` from §8, with date and grade
(**A** official/primary · **B** vendor report with stated sample or named practitioner data ·
**C** blog/listicle). `[uncertain]` marks anything not independently verifiable.

---

## 1. Executive summary

- **Targeting:** the current batch is mixed-trade. Rank future lists by (a) job value × website
  dependence and (b) verifiable signals we already store (`rating`, `review_count`, `website`).
  Roofing, remodel/GC and HVAC lead on job value ($8k–$100k) [12]; plumbing/electrical convert
  best from a website (12–16% / 6–9%) [12].
- **Best redesign signals** are the ones a prospect can verify in 10 seconds: site fails mobile
  Core Web Vitals (52% of mobile origins still fail [3]), Google rating < 4.5 or < 20 reviews
  (31% / 47% of consumers now screen on these [2]), and stale/absent contact details.
- **Pitch:** sell the *conversation*, not a critique. Gong's 304k-email study: interest-based CTAs
  win at the cold stage; specific time asks win later [6]. Our "reply yes" CTA is already the
  right shape.
- **Copy fixes with evidence:** replace the subject `quick question about {{company_name}}` —
  Hunter (31M emails) measured "quick question" templates at 2.5% reply vs 2.9% for alternatives,
  and 5–6-word subjects as the sweet spot [5]. Keep Email 1 under 80 words [1].
- **Cadence:** 4 touches is inside every benchmark's band (Instantly 4–7 [1]; Hunter's best was 3
  with decline at 4+ [5]; Woodpecker 3–5 follow-ups [4]). Keep Day 0/3/7/14. Do not add a fifth.
- **Sending:** 20/inbox/day on two inboxes = 40/day, ≈200/week — below every warm-domain ceiling
  found (§4). Warm-up started 2026-08-31; the 3-week floor passed 2026-09-21. Keep warm-up ON
  while sending.
- **Compliance is already met** (address, unsubscribe, no deceptive subject) — §4 has the cites.
- **Reply → build → link is a manual gap today:** /admin shows "Replied" but has no Build button
  and never displays the `/demo/<token>` URL. §5 gives the working steps and two small fixes.
- **Realistic numbers for 241 prospects:** at Belkins' 2025 construction reply rate (0.56–0.60%
  [8]) expect 1–2 replies; at Woodpecker's 200–500-list rate (~3% [4]) expect ~7. Judge on
  **positive replies per 100 sent**, not opens (open tracking is off by design).
- **Kill triggers (pre-committed, §6):** bounce ≥ 3% or any spam-complaint spike → pause that
  inbox; 200 sent with 0 replies → rewrite subject + opener before batch 2; 0 positive replies in
  400 → change the list (signals), not the copy.

✅ Executive summary done.

---

## 2. Who to target: ranked trades + qualifying signals

**Method.** Two axes: *value of one extra lead* (job value, LTV — the bigger, the more $49/mo is
a rounding error) and *how much the website does the selling* (site conversion rate). Figures
from Foundry CRO's per-trade table [12] (B, 2026-04-29), US national aggregates — ranking
evidence, not New England forecasts.

| Rank | Trade | Avg job value | Website conv. | LTV | Why it ranks here |
|---|---|---|---|---|---|
| 1 | Roofing | $8,000–15,000 | 3–5% | $12–18k | One job pays for 15+ years of $49/mo; low site conversion means design quality moves real money. |
| 2 | Remodel / general contractor | $25,000–100,000 | 2–4% | $30–75k | Highest ticket; buyers research longest, so the site is the sales deck. Current batch's default slug. |
| 3 | HVAC | $1,850 | 8–12% | $15,340 | Highest LTV of the service trades (maintenance plans); repeat customers use the site to book. |
| 4 | Plumbing | $950 | 12–16% | $8.2–12k | Best website conversion in the table — emergency intent; a fast mobile site is the whole funnel. |
| 5 | Electrical | $1,200 | 6–9% | $6.5–8k | Solid but smaller ticket. |
| — | Landscaping / cleaning | $250–1,500 | 10–18% | $3.5–8k | Cheapest CPL ($47–63) and most likely to have *no* site (25–55% [15], C) — a first-site list, not a redesign list. |

**Qualifying signals, ranked by how verifiable they are and how strongly buyers react.**
Our `prospects` table already stores `website`, `rating`, `review_count` (`0010_prospects.sql:26-29`),
so the first three can be filtered at import time with no new scraping.

1. **Reviews below the new consumer floor.** BrightLocal 2026 (n=1,002 US adults, 2026-02-11, B):
   31% will only use a business rated **4.5+** (17% a year earlier); 47% won't use one with
   **fewer than 20 reviews**; 97% read reviews [2]. A 4.3★ / 11-review contractor loses nearly half
   of searchers before the site loads, so the site must carry the trust load.
   *Filter: `rating < 4.5 OR review_count < 20`.*
2. **Fails mobile Core Web Vitals.** Web Almanac 2025 (CrUX July 2025, A): only **48%** of mobile
   origins pass all three; 44% in 2024 [3]. *Check with PageSpeed on the reply, not at import.*
3. **Missing or buried contact path.** KoMarketing 2024 via [13] (C): 44% leave a site with no
   contact info/phone; 64% want it on the homepage. Verifiable by eye.
4. **Not responsive.** 48% read a non-mobile-friendly site as "the business doesn't care" (SAG IPL
   2024 via [13], C, weak). Google still indexes desktop-only sites that *load* on mobile [16], so
   "Google won't show you" claims are false — never use them.
5. **Context.** Clutch 2025 (n=406 US owners, B): 83% have a site, 58% prioritize a full redesign
   or refresh in the next 12 months, 81% have redesigned before [9]. Redesign is an expected
   purchase; the pitch is timing, not education.

**Not a signal:** site age by WHOIS/copyright year — unverifiable at scale [uncertain].

**Applied to the current batch** (241, ME/VT/NH, mixed trades): keep it, but export in two waves —
wave 1 = `rating < 4.5 OR review_count < 20`, wave 2 = the rest. Same copy, free targeting A/B.

✅ Who to target done.

---

## 3. Redesign pitch angles (3)

v3 makes no claim that the prospect's site is bad (unverified per prospect = untruthful and
insulting). Each angle names something *true of the market or of us*, never of their site unless
staff verified it on a reply.

**Angle A — "See it before you decide" (zero-risk preview).** *This is v3 Email 1.* Interest CTAs
beat open-ended and specific meeting asks at the cold stage in Gong's 304,174-email analysis [6];
Hunter (31M) found "Can I send more info?"-style asks beat hard asks [5]; Instantly names a single
binary question as the winning shape [1]. The reply-gated demo *is* an interest CTA. Lead angle.

**Angle B — "Your reviews are doing the work your homepage should" (trust gap).** For wave-1 rows
only; the claim is about *consumers* and true for every row: "31% of people now skip anything under
4.5 stars and 47% skip businesses with under 20 reviews (BrightLocal, Feb 2026)" [2]. Answer: a
homepage with licensing, photos and the reviews you *do* have above the fold. Conversion evidence:
"specific verifiable gap" emails report 15–20% replies vs 1–3% generic — B2BLeadFinder [14], **C,
[uncertain]**; direction corroborated by Hunter's +56% from two custom attributes [5] and
Woodpecker's ~2x for advanced personalization [4].

**Angle C — "Phone-first homeowners" (mobile / speed).** Only after a reply and a PageSpeed check
of *their* site: "52% of mobile sites still fail Google's Core Web Vitals (Web Almanac 2025)" [3]
plus their measured score. Claim our preview passes CWV only after measuring one — generate-site
output is untested on PSI [uncertain].

**Retired:** "Google won't index non-mobile sites" (false [16]); "we've helped N contractors"
(owner rule); "your site looks outdated" without a reviewed example.

✅ Redesign pitch angles done.

---

## 4. Cold email playbook

**Subjects.** Hunter 2026 (31M emails, B): 5–6 words is the reply-rate sweet spot; "quick
question" templates 2.5% vs 2.9% for alternatives [5]. Woodpecker (20M, B): 36–50 characters
best; question form ~+21% [4]. Instantly 2026: reference the prospect's situation, not ours [1].
Our v3 subject `quick question about {{company_name}}` is the one measured underperformer.
Test two replacements (both truthful, both under 50 chars):
`{{company_name}} homepage — a free preview?` · `new homepage for {{company_name}}, {{city}}`.
Follow-ups 2–3 stay in-thread with an empty subject (Instantly native threading, already set —
this is *real* threading, not a fake "Re:", which EmailBison's seed test flagged in 6 of 10 Gmail
tests [27] (C, tiny n) and which would be a misleading-header risk under CAN-SPAM [10]).

**Openers.** Keep v3's "I came across {{company_name}}'s website while looking at contractors
in {{city}}" — true for every row. Two custom attributes lift replies +56% (Hunter [5]); company
+ city are the two we have. Do not add a third guessed attribute.

**Body.** Under 80 words for Email 1 (Instantly elite tier [1]; Hunter's 61–80-word band [5]).
v3 Email 1 is ~85 words — trim the second paragraph by one clause.

**Reply-gated CTA wording (locked shape, tuned copy).** Interest CTAs beat time asks at the cold
stage [6]; one binary question [1]; open-ended "can I send it?" beats hard asks [5]. Use:
Email 1 `Want me to build it? Reply "yes" and I'll send the link within a day.` (unchanged);
Email 2 `Worth a look? A one-word reply is enough.`; Email 3 keeps the price line then
`Reply "yes" and I'll start on it.`; Email 4 `If you ever want to see it, reply to this — no
rush.` Never a calendar link or a "call" ask before the preview exists.

**Cadence.** Day 0/3/7/14 stays. Instantly: 4–7 touches, step 2 formatted as a reply +~30% [1];
Hunter: 3 messages peak (6.8% vs 3.3%), decline at 4+ [5]; Woodpecker: 3–5 follow-ups 8.3%,
42% of replies from follow-ups [4]. Four is the conservative intersection. Launch waves Mon–Wed
(Instantly: Monday launch, Wednesday peak, Friday auto-reply surge [1]; Hunter found no day
effect [5]) — leave the weekday 08–17 ET window as is.

**Sending limits.** Instantly help: 30–50/day per account, warm ≥2 weeks, never switch warm-up
off, ≤3–5 inboxes per domain [21]; Hunter: 20–49 sends/day/inbox had +27% reply vs higher
volume [5]; Workspace hard cap 2,000/user/day [24], with suspension driven by complaints, not
volume [25]. Warm-up defaults stay (10/day +1, [22]). Our 20/inbox/day × 2 = 40/day is inside
every band. Open/link tracking stays OFF — vendor advice, no controlled placement study [28]. Batch size matters more than volume: Woodpecker's 200–500-contact campaigns reply
~3% vs 5.8% under 50 [4] — export in waves of ≤100 (also gives the §2 A/B).

**Compliance (all currently met):** street address in footer (16 CFR 316.2(p) [11]); opt-out
honored within 10 business days, mechanism live 30 days, no B2B exception, up to $53,088 per
email (FTC [10]); Instantly's List-Unsubscribe header covers Google/Yahoo one-click, which binds
only above 5,000/day per domain — we are ~0.8% of that [7][17][18]; SPF+DKIM+DMARC live; spam
rate <0.1% target, 0.3% ceiling [7]. Massachusetts adds nothing beyond deception rules (15 U.S.C.
7707 preemption [20]). A "reply yes" CTA raises no consent issue under an opt-out statute
[inference; no source addresses it directly].

✅ Cold email playbook done.

---

## 5. Reply → build → link workflow

**What happens automatically today** (verified in code):
1. Prospect replies → `scripts/instantly-poll.mjs` (15-min task) forwards
   `{event_type:'reply', lead_email}` to `instantly-webhook`, which stamps `prospects.replied_at`
   and fires `ghlSyncStage` → `outbound-lead` tag → GHL staff SMS + email. The reply **text is
   never stored** (`scripts/lib/instantly-events.mjs:94-101`).
2. /admin → Outbound shows the row as `Replied <ago>` but has **no Build button** for
   `site_status='none'` (Retry build only appears for failed/generating,
   `src/admin/AdminDashboard.tsx:1002-1008`) and **never shows the `/demo/<token>` URL**
   (`admin-data` omits `token`, `supabase/functions/admin-data/index.ts:247-255`).

**Manual steps, in order, per "yes" (works with zero code changes):**
1. Read the reply in the Instantly Unibox (rhyan@getacewebdesigners.com). Reply the same
   business day — Gong's follow-up-stage data says a *specific* ask now converts ~37% vs 25%
   for interest [6], so the reply that carries the link may also propose a 15-min call time.
2. Open the prospect's demo page yourself: `https://acewebdesigners.com/demo/<token>` — the
   token is in the exported CSV (`export-instantly.mjs` column `demo_url`) or via a Management-API
   read `select token from prospects where email ilike '<email>'`. Click **Build my free
   preview**: `demo-site` `{token, action:'build'}` flips `none→generating` atomically and fires
   `generate-site {prospectId}` (`supabase/functions/demo-site/index.ts:93-133`). ~$0.60–1.10,
   needs Anthropic credits (owner-deferred — without credits the page shows the `failed` copy;
   build by hand for the pilot).
3. Watch /admin Outbound → Demo site chip → `deployed`; the "open" link is `preview_url`.
   If `failed`: **Retry build** (`admin-data {action:'retryProspectSite', prospectId}`, forces).
4. Reply in-thread from the same Instantly inbox with the `/demo/<token>` page link (not the raw
   Netlify `preview_url` — the demo page carries the $49 checkout + domain picker). Plain text,
   one link, no attachment.
5. First page view stamps `demo_first_viewed_at`; the GHL tag is additive so the alert does not
   re-fire. Purchase → `stripe-webhook kind:'demo_site'` → `provision-domain` → live.

**Two small changes that remove the friction (each ≤1 h, no new auth surface):** (a) `admin-data`
selects `token`; `OutboundTab` gets a copy-link button and a **Build demo** button for
`site_status==='none'` (reuse `retryProspectSite`). (b) poll + webhook persist a reply snippet to
a new `prospects.last_reply` column and pass it as a GHL qualifier so the staff SMS says *what*
they replied. Both optional for the pilot.

✅ Reply → build → link workflow done.

---

## 6. Metrics, benchmarks and pre-committed kill triggers

Open tracking is OFF (deliberate), so **opens are not a metric**. Measure per exported wave.

| Metric | Benchmark (source) | Our target | Kill / act trigger |
|---|---|---|---|
| Hard bounce | avg 5.1%, good <2%, excellent <1.5% (Woodpecker [4]); <2% (Instantly [1]) | <2% | ≥2 hard bounces in one day on an inbox (=10% of 20) → pause that inbox, clean list; ≥3% on a wave → stop the wave [26] |
| Spam complaints | Google: <0.1% target, 0.3% ceiling [7]; Instantly pause at ≥0.3% [26] | 0 | Any complaint → pause inbox 48–72 h, re-warm at 10–20/day [26] |
| Warm-up health / inbox placement | Instantly: pause below 80–85% placement [26] | ≥85% | Below 85% on either inbox → stop sending from it until it recovers |
| Reply rate (all replies) | Construction 0.56–0.60% (Belkins, 7.5M emails, 2025 [8]); 200–500-list ~3% (Woodpecker [4]); avg 3.43% (Instantly [1]) | ≥2% | 200 sent, 0 replies → rewrite subject + opener before the next wave |
| Positive ("yes") replies | No vendor publishes a clean figure; Mailreach scales at ≥3–5% positive [23] (C) | ≥1 per 100 | 400 sent, 0 positive → change the *list* (§2 signals), not the copy |
| Yes → demo built | internal | 100% within 1 business day | Any yes unbuilt after 2 business days → process failure, fix §5 |
| Built → purchase | Launch-plan guardrail: 1 per 100 builds at $49/mo is still positive economics | ≥1 per 20 | 0 in the first 20 builds → review demo quality + demo-page copy before more builds |
| Unsubscribe | 1.6% (Hunter [5]) | <2% | >3% on a wave → copy reads as spam; rewrite |

**Sample-size honesty.** With 241 prospects the expected reply count is 1–7. Do not declare a
subject-line winner on fewer than ~100 sends per variant; change one thing per wave.

✅ Metrics, benchmarks and kill triggers done.

---

## 7. Gaps vs. current setup

| Finding | Current state | Recommended change | Effort |
|---|---|---|---|
| "quick question" subject measured below alternatives [5] | v3 Email 1 subject `quick question about {{company_name}}` | Two-variant test with the §4 subjects; keep threading on 2–3 | 15 min (doc + `--update`) — **owner approval** |
| Email 1 should be <80 words [1][5] | ~85 words | Trim one clause | 5 min |
| List-level A/B on signals is free [2] | Batch exported as one block | Wave 1 = `rating<4.5 OR review_count<20`, ≤100 rows; wave 2 later | 20 min (add a filter flag to `export-instantly.mjs` or split the batch label) |
| Mixed trades, generic copy | `general-contractor` slug for all 241 | Keep for this batch; next Apify pull = one trade, ranked per §2 (roofing / remodel / HVAC) | owner (list purchase) |
| No Build button / no demo URL in /admin | Retry build only for failed; `token` not selected | §5 changes: select `token`, copy-link + Build button | ~1 h |
| Reply text not captured | Only `replied_at` + GHL tag | Persist snippet, pass as GHL qualifier | ~1 h, optional |
| Sequence doc shows literal "Re:" subjects on Emails 2–3 | Campaign sends an empty subject (native thread) — correct | Reword the doc so nobody re-adds a literal "Re:" [27][10] | 2 min |
| Anthropic credits deferred | Builds fail → `failed` copy on the demo page | Top up before wave 1, or accept hand-built demos for the pilot only | owner |
| Kill triggers are click-based (obsolete under reply-gating) | Launch plan: "200 emailed, 0 demo-page clicks" | Replace with the §6 table (reply- and bounce-based) | 10 min doc edit |
| Warm-up | ON since 2026-08-31; 3 weeks elapsed 2026-09-21 | Keep ON permanently [21]; check placement ≥85% the morning of each wave | 0 |

No locked decision is contradicted: reply-gated demo, $49/mo, Instantly-only, 4 touches, plain
text and no invented stats all stand.

✅ Gaps vs. current setup done.

---

## 8. Sources

| # | Source | Date | Grade |
|---|---|---|---|
| 1 | Instantly — Cold Email Benchmark Report 2026 https://instantly.ai/cold-email-benchmark-report-2026 (data Jan–Dec 2025; no exact n) | 2026-01-12 | B |
| 2 | BrightLocal — Local Consumer Review Survey 2026 https://www.brightlocal.com/research/local-consumer-review-survey/ (n=1,002 US adults) | 2026-02-11 | B |
| 3 | HTTP Archive — Web Almanac 2025, Performance https://almanac.httparchive.org/en/2025/performance (CrUX July 2025) | 2026-01-15 | A |
| 4 | Woodpecker — Cold Email Statistics (20M+ emails) https://woodpecker.co/blog/cold-email-statistics/ | 2026-06-23 | B |
| 5 | Hunter — State of Email Outreach 2026 (31M emails) https://hunter.io/the-state-of-cold-email | 2026 | B |
| 6 | Gong Labs — cold email CTA study (304,174 emails) https://www.gong.io/blog/this-surprising-cold-email-cta-will-help-you-book-a-lot-more-meetings | 2020-05-27, mod. 2026-03-06 | B |
| 7 | Google — Email sender guidelines https://support.google.com/a/answer/81126 | current | A |
| 8 | Belkins — B2B cold email response rates (7,530,489 emails, 2025) https://belkins.io/blog/cold-email-response-rates | 2026-06-26 | B |
| 9 | Clutch — State of Small Business Websites 2025 (n=406) https://clutch.co/resources/state-of-small-business-websites-2025 | 2025-08-05 | B |
| 10 | FTC — CAN-SPAM Act Compliance Guide https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business | 2023-08 / penalty note 2024-01 | A |
| 11 | 16 CFR 316.2 https://www.law.cornell.edu/cfr/text/16/316.2 | current | A |
| 12 | Foundry CRO — Home Services Marketing Benchmarks by Trade https://foundrycro.com/blog/home-services-marketing-benchmarks-by-trade/ (aggregates Searchlight Digital, Invoca, ServiceTitan, CFOx) | 2026-04-29 | B |
| 13 | Hook Agency — Web Design Statistics for contractors https://hookagency.com/blog/web-design-statistics/ (secondary; cites KoMarketing, SAG IPL, Blue Corona) | 2025 | C |
| 14 | B2BLeadFinder — Cold email templates for web design agencies https://b2bleadfinder.io/blog/cold-email-templates-for-web-design-agencies-2026 ("15–20%" claim unaudited) | 2026 | C |
| 15 | B2BLeadFinder — Businesses without websites by industry https://b2bleadfinder.io/blog/list-of-businesses-without-websites | 2026 | C |
| 16 | Search Engine Land — Google won't index sites that don't load on mobile after July 5 https://searchengineland.com/google-wont-index-sites-that-do-not-work-on-mobile-devices-after-july-5th-442851 + Google mobile-first docs https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing | 2024-06 | B / A |
| 17 | Google — Sender guidelines FAQ https://support.google.com/a/answer/14229414 | current (Nov 2025 enforcement note) | A |
| 18 | Yahoo — Sender best practices https://senders.yahooinc.com/best-practices/ | 2024-02, ©2026 | A |
| 19 | Mailgun — Microsoft/Outlook high-volume sender requirements https://www.mailgun.com/blog/deliverability/microsoft-sender-requirements/ | 2025-05-01 | B |
| 20 | 15 U.S.C. 7707 (preemption) https://www.law.cornell.edu/uscode/text/15/7707 | current | A |
| 21 | Instantly Help — Cold email strategy (30–50/day, keep warm-up on) https://help.instantly.ai/en/articles/5975326-instantly-cold-email-strategy | 2026-07-15 | B |
| 22 | Instantly Help — Warmup settings https://help.instantly.ai/en/articles/7988514-warmup-settings | 2026-08-21 | B |
| 23 | Mailreach — Google Workspace sending limits / scaling rules https://www.mailreach.co/blog/google-workspace-email-sending-limits | 2026-06-04 | C |
| 24 | Google Workspace — Gmail sending limits https://knowledge.workspace.google.com/admin/gmail/gmail-sending-limits-in-google-workspace | 2026-09-18 | A |
| 25 | Google Workspace — Spam and abuse policy https://knowledge.workspace.google.com/admin/gmail/spam-and-abuse-policy-in-gmail | 2026-09-18 | A |
| 26 | Instantly — Automate cold email campaign pauses for deliverability https://instantly.ai/blog/automate-cold-email-campaign-pauses-for-deliverability/ | 2025-10-19 | B |
| 27 | EmailBison — Cold email subject lines (fake "Re:" seed test, n=10) https://emailbison.com/blogs/cold-email-subject-lines | 2026-07-12 | C |
| 28 | Instantly — Tracking pixels and inbox placement https://instantly.ai/blog/email-tracking-and-deliverability-why-tracking-pixels-can-hurt-your-inbox-placement/ | 2026-03 | C |

Not used because unverifiable: Belkins 16.5M gated PDF (figures not visible); "HTML bounces 674%
more" (Hunter 2.2M, method unclear); Hunter's "no open tracking +68% reply" (correlational —
consistent with our tracking-off setup but not load-bearing); BrightLocal 2025 edition (superseded
by [2]); Microsoft Tech Community post on Outlook requirements (not fetchable; Mailgun [19] used).

✅ Sources done.

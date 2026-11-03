# Restaurant outbound plan — 2026-11-03

Owner decision (2026-11-03): **stop the contractor campaign, run the outbound demo funnel on local
restaurants instead.** This doc is the plan, the research behind it, and the numbers we will judge it
by. Mechanics live in `docs/OUTBOUND_FLOW.md`; copy in `docs/OUTBOUND_COLD_SEQUENCE_RESTAURANTS.md`.

## 1. What we learned from contractors (why the switch)

| Contractors, 2026-09-22 → 11-03 | |
|---|---|
| Emails sent (v4 reply-gated copy) | 600 |
| Replies | 5, none interested (3 hostile) |
| Demo pages viewed | 6 |
| Sales | 0 |

Two structural problems, not a copy problem:
1. **Half the market is unreachable.** Contractors without a website have no public email (Google
   Maps publishes none; our enricher crawls their site). A $1 no-website scrape of MA returned 251
   contractors, 241 phones, **0 emails**. The "build you a site" buyer is phone-only.
2. **Everyone we CAN email already has a domain**, and checkout only registered a new .com. The one
   way to keep a domain was "email us before you check out" — a human step at the exact point of
   sale. Fixed today (§5).

## 2. Why restaurants

- **Reachable.** Nearly every restaurant has a website with a contact email: the MA scrape yielded
  752 restaurants, 707 with a real site, **298 emails** (42%) vs 274/493 (56%) for home services
  and 0 for no-site contractors. 278 imported after suppression + dedupe.
- **The product fits what they need.** The surveys we found converge on three things diners want
  from a restaurant site: the menu, a way to order/reserve, and finding it on Google. 65% of diners go
  straight to the restaurant's own website to book (Toast); 70% say they would order from the
  restaurant's own site rather than an app (Clear the Plate, 2026). Our demo puts menu, call and
  directions at the top and links out to whatever ordering they already use.
- **Price is a non-issue against the market.** Restaurant-specific platforms start at $179/mo
  (Popmenu Starter), $249–$499/mo (Owner.com), $229–$449/mo (ChowNow); DIY builders are $16–$17/mo
  but the owner does the work. **$49/mo stays.** It is a quarter of the cheapest restaurant platform
  and still "hosting + unlimited menu/hours changes handled for you". We revisit price only if demos
  get viewed and nobody buys (§6), not before — nobody has reached the price yet.
- **Caution we respect in the copy:** the James Beard / Deloitte 2026 report found 40% of
  operators who added online ordering saw lower profits. We never promise ordering, delivery or
  "more orders"; we promise a site that shows the menu and gets them found and called.

## 3. What the research says about cold-emailing restaurants

Hospitality cold-email benchmarks (vendor data, directional): 30–40% opens, **2–3.5% replies**,
0.5–1.2% meetings. Best-performing practice, which the engine already does or now does:
- **No open tracking** (+68% replies without pixels — Hunter 2026), custom sending domains, plain
  text, 75–100 words, **3-step sequence**. ✔ (`instantly-campaign.mjs`: tracking off, text_only)
- **Send outside service hours.** Operators read email before 10am and mid-afternoon; nobody reads
  during lunch or dinner. → campaign windows **Mon–Fri 09:30–11:00 and 14:00–16:00 ET**
  (`SCHEDULES.restaurant`). Monday is many restaurants' closed day, so it stays on.
- **Reply within hours.** → the reply desk answers in 20–90 min, business hours, same inbox.
- Decision maker: the owner, not a manager. Google-listed emails are mostly `info@`/`owner@`, which
  is the best we can do without paid enrichment; the first name is usually missing, so the copy's
  "Hi there" fallback stays.

## 4. The plan (what runs, in order)

1. **Contractor campaign paused** (2026-11-03 03:30 UTC, status 2). Its 596 leads keep their demo
   links; replies still route to the reply desk. Not deleted.
2. **Restaurant list:** scrape (Apify, `--website withWebsite`, $3) → `enrich-emails` ($0) →
   `import-prospects --batch 2026-11-ma-restaurants` (278) → `export-instantly` →
   `instantly-upload-leads` (**273 uploaded** to campaign `94ab9d2a-faac-46da-8470-7ade9c9fd55c`,
   131 contacts left on the Instantly plan this month).
3. **Restaurant demo build:** `generate-site` fast path now has a restaurant spec (menu highlights
   labeled as a sample, call + directions, "call for today's hours" — never invented hours or prices,
   the only rating shown is the real Google one) and a 44-photo verified food/interior library.
   Selected by `_shared/niche.ts` `isFoodBusiness(business_type)` — contractors keep the old spec.
4. **Copy:** `OUTBOUND_COLD_SEQUENCE_RESTAURANTS.md` — Day 0 / 3 / 7, preview link in every email,
   price once in E3, "the domain you already have or a new one".
5. **Reply desk:** niche-aware original-email summary; facts updated for keeping a domain and
   menu/hours updates. Same hold, same hand-off SMS.
6. **Own-domain checkout** (§5) so the restaurant keeps its domain.
7. **Go-live:** `node scripts/go-live-restaurants.mjs` (migration → functions → cron → Netlify →
   activate campaign). Everything an agent session can't confirm is in that one script.

## 5. Own-domain checkout (shipped 2026-11-03, deploy pending)

At checkout: "Already have a domain? Keep it." → type `yourrestaurant.com` → Stripe. After payment
the preview page shows the two DNS records (A @ → 75.2.60.5, CNAME www → `<site>.netlify.app`)
and offers a screen-share via hello@ for anyone who'd rather not. `provision-domain` skips Porkbun
for `domain_mode='own'`, attaches the domain to the Netlify site (`awaiting_dns`), polls SSL for an
hour, then an hourly `domain-recheck` cron flips it to `live` whenever their DNS lands. Nothing is
registered, nothing is charged beyond the subscription, and a slow customer never shows as "failed".
The welcome email's domain field says the site is waiting on their DNS instead of "live within the
hour". Registered-domain purchases are unchanged.

## 6. How we judge it (read on ~2026-11-17)

The signal is **demo views per 100 emails** (the /demo page stamps `demo_first_viewed_at`), then
sales. Replies are secondary because the point of the preview-first copy is that people click
instead of replying.

| Outcome after ~600 restaurant sends | Call |
|---|---|
| ≥5 views/100 and ≥1 sale | It works. Scale: per-inbox 40 → 50, add 2 inboxes on a 2nd domain, next state. |
| Views ≥5/100, 0 sales | Demo page or price. Look at 10 viewed demos by hand; then test $39 (needs a new Stripe price + `STRIPE_PRICE_DEMO_MONTHLY`). |
| Views <2/100 | Subject line / list. A/B the E1 subject in Instantly first (cheapest change). |

Volume lever is inboxes, not list size: 2 inboxes × 30/day = 60/day ≈ 1,300/mo; Instantly Growth
caps 5,000 emails / 1,000 contacts a month (131 contacts left this month after today's upload).

## 7. Still open

- **No-website restaurants with a Facebook page:** 44 of the 752 scraped list a Facebook page as
  their website. **Tested 2026-11-03:** Apify `facebook-pages-scraper` on those 44 pages → 10 emails
  (23%), $0.35. Imported as batch `2026-11-ma-restaurants-fb` and uploaded. So the no-website owner
  IS reachable when the listing points at a Facebook page: scrape `--website allPlaces`, take the
  `social` rows, run the Facebook scraper (`leads/restaurants-ma-facebook-2026-11-03.json` has the
  shape). Owners with no site AND no page remain phone-only.
- **$39 price:** owner is willing; held until the §6 read says price is the blocker.
- **Rotate the Instantly API key** (it was pasted into a chat transcript on 2026-11-03).
- Home-services list (`leads/home-services-ma-2026-11-03.enriched.csv`, 274 emails) is on disk,
  not imported — second niche if restaurants stall.

## Sources (read 2026-11-03; vendor data treated as directional)
- Hospitality cold email benchmarks: https://www.revenueflow.com/blog/hospitality-cold-email-benchmarks
- Hunter, The state of cold email (tracking, domains, sequence length): https://hunter.io/the-state-of-cold-email
- Cold email reply-rate benchmarks: https://www.breakcold.com/blog/cold-email-reply-rate · https://martal.ca/b2b-cold-email-statistics-lb/
- Send timing: https://www.zeliq.com/blog/best-days-email-open-rates · https://firstsales.io/sales-guide/restaurant-b2b-sales/
- Diners go to the restaurant's own site to book (65%): https://pos.toasttab.com/blog/data/restaurant-wait-times-and-reservations-data
- Direct ordering preference (70%) and 2026 trends: https://cleartheplate.com/journal/restaurant-trends-2026
- James Beard Foundation 2026 Independent Restaurant Industry Report (ordering + profits): https://www.prnewswire.com/news-releases/the-james-beard-foundation-releases-2026-independent-restaurant-industry-report-302694350.html
- Popmenu 2026 operator survey: https://www.prnewswire.com/news-releases/popmenu-releases-top-restaurant-trends-to-watch-in-2026-302692236.html
- Pricing: https://www.owner.com/pricing · https://www.owner.com/blog/how-much-does-a-restaurant-website-cost · https://emergent.sh/learn/restaurant-website-cost · https://www.menutiger.com/blog/bentobox-alternative · https://www.getsauce.com/post/bentobox-pricing-fees
- Independent restaurant count falling (Technomic via NRN): https://www.nrn.com/independent-restaurants/the-independent-restaurant-sector-shrunk-by-2-3-in-2025

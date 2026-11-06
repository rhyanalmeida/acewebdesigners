# Zokago vs. our outbound funnel — what to copy, what we already do, and the Apify replacement

Written 2026-11-05 from Gabe's walkthrough of the Zokago system (same business: cold-email → auto-built
mockup → $35/mo site; he reports consistent sales) and the `zoka-site` Claude Code skill he attached
(`~/Downloads/0-zoka-site-skill.zip`: SKILL.md, deploy.sh, scaffold/site_kit.py, validation.js, shots.js,
CHECKLIST.md). Everything below was checked against our code and runbook (`docs/OUTBOUND_FLOW.md`,
`docs/COLD_EMAIL_SALES_PLAYBOOK_2026-11-04.md`) the same day.

## 1. Step-by-step map

| # | Zokago | Ours (2026-11-05) | Verdict |
|---|---|---|---|
| 1 | Morning script pulls local businesses from Google Maps via **Apify** | Apify Starter (`apify-scrape-contractors.mjs`), $19/mo, cycle nearly exhausted (18.4 of 19 on 11-04) | **Replaced** → `scripts/scrape-places.mjs` (our Playwright, $0; §3) |
| 2 | Clean: drop already-emailed, gov/edu junk | `suppressions` + `lib/email-quality.mjs` (placeholder/font/agency/chain filters), dedupe on `gmaps_place_id` | Parity, ours stricter after the 11-04 bounce day |
| 3 | **Instantly verifies** each email; only verified move on | MillionVerifier → `import-prospects --verify` (ok only; catch-alls parked) | Parity (different verifier; ours keeps the audit CSV) |
| 4 | **4-email sequence, days 0 / 3 / 8 / 14**, morning + evening in the lead's local time | 3 steps (v2, ~40 words), Mon–Fri 07:00–11:30 + 13:30–16:30 ET | **Adopt the 4th touch at day 14** (follow-ups = 57 % of replies per the playbook's sources); our two windows already cover "morning + afternoon" |
| 5 | Script reads replies **every 5 min**, sorts real people from auto-replies | `instantly-poll` pg_cron **every 15 min** → `instantly-webhook` → reply desk classifies | **Adopt 5 min** (one line in `scripts/cron-jobs.sql`); a "yes" answered while they're still in the inbox converts better |
| 6 | On "sure, show me", an AI agent builds a **real multi-page site** at `their-name.zokago.com` and emails the link | Link goes out immediately; the **one-page** Sonnet demo builds on click (~1 min); `/demo/<token>` on acewebdesigners.com | **Adopt the believability**, keep our speed: ace-site skill (§2) for upgrades + feed real material into the fast build (§4) |
| 7 | Later replies answered by an agent that can send a **$35/mo Stripe link**; paid → won | Reply desk (facts-only) answers; `/demo` page closes itself via Stripe at **$37/mo**; own-domain or Porkbun registration; GHL onboarding | Parity-plus (we also provision the domain and take change requests) |
| — | Email alert to Gabe for every real reply; **one kill switch** for all AI sending | GHL `outbound-lead` → SMS/email; `outbound-needs-human` hand-off; `REPLY_DESK_ENABLED` | Parity |

**Bottom line:** the pipeline is the same shape and ours has more automation after the reply. The one
place Zokago is materially ahead is **step 6 — what the prospect sees**: a complete multi-page site built
from the business's own logo, photos, menu/services and information architecture, verified on a phone,
with forms that deliver. That is the whole sale, and it is where the skill's hard-won lessons live.

## 2. What was built today (all on disk, nothing deployed)

| Piece | Where | Status |
|---|---|---|
| **`ace-site` skill** — Node port of `zoka-site` for our stack | `~/.claude/skills/ace-site/` (SKILL.md, deploy.mjs, scaffold/{site-kit.mjs, validation.js, shots.js, og.mjs, images.mjs, _deps.mjs, build.example.mjs, CHECKLIST.md}) | Built; example site built + screenshotted locally; deploys to Netlify with the Zokago gates (dead-form, image, routes, live form smoke) |
| **Forms that deliver** | Netlify Forms (`data-netlify` + honeypot; `deploy.mjs` creates the owner's email notification after a smoke submission proves storage) | No relay, no secret, no app password — the Netlify choice removed Gabe's whole "form secret" step |
| **Maps scraper (Apify replacement)** | `scripts/scrape-places.mjs` + `scripts/lib/places.mjs` (12 vitest cases) + `scripts/lib/website-kind.mjs` (shared with the Apify script) | **Proven live**: 47 cards in 11.7 s; 15 Worcester restaurants → 15 phones, 15 ratings, 14 real sites, parsed city/state/zip, Google `ChIJ…` place ids, importer-ready CSV |
| **Haiku enrichment** | `scripts/enrich-haiku.mjs` (`claude-haiku-5-5`, strict tool schema, effort low) | **Proven live**: 5 sites, $0.002; owner name only with a verbatim quote, dishes verbatim, 3 emails, 4 grounded hooks |

Why the skill lives at user scope: this repo's `.gitignore` excludes `.claude/`, so a project-scope skill
would never be committed; `~/.claude/skills/` is where the other skills already live and where Gabe said to
put his. The skill references the repo by absolute path (`ACE_REPO`, default `C:/Projects/acewebdesigners`).

### Design decisions in the port (and why)
- **Netlify, not Vercel** (owner: "just stick with netlify, should be same thing" — and it is better for us):
  the auto-built demos already live on Netlify, so `deploy.mjs --prospect` deploys the hand-built upgrade
  **into the prospect's existing site** — the `/demo/<token>` link never changes and `provision-domain`
  attaches the purchased domain exactly as before. Gabe's two Vercel gotchas (static 404s, SSO wall) don't
  exist on Netlify; the gates that matter (dead form, images, routes, mobile menu, live form smoke) are kept.
- **Our design library instead of Gabe's `hallmark`** — we don't have hallmark; we do have 23 art directions
  in `_shared/designSystems.ts` with the same job. The ledger (`C:/Projects/sites/.ace-site-log.json`) forces
  cross-business variety exactly as his did.
- **Node instead of Python** — no usable Python/Pillow on this machine; Playwright, Tailwind and sharp
  (added as a dev dependency) are already in the repo. `shots.js`/`og.mjs` serve `dist/` on 127.0.0.1 only
  (Gabe found six forgotten preview servers on 0.0.0.0).
- **Forms:** his sites post to `zokago.com/api/forms/<slug>` (HMAC-signed, needs a secret he'd have sent
  separately). Ours are **Netlify Forms** — zero infrastructure: Netlify stores submissions and emails the
  owner. The dead-form gate + live smoke test are kept in spirit: Florida Hydro Works lost every estimate
  request for a day to a form that "rendered beautifully, validated beautifully, and threw every homeowner's
  request in the bin". One Netlify caveat: form detection is a per-site toggle; the smoke test reports it.
- **Truthfulness rules added** (no invented hours/history/reviews, example reviews labelled, only the real
  Google rating, never look automated) — these are owner rules the Zokago skill does not have.

### Where it plugs into the funnel
- `deploy.mjs --prospect <uuid>` reuses `prospects.netlify_site_id` and stamps `preview_url`,
  `netlify_site_id`, `site_status='deployed'` — the demo page, /admin, Stripe checkout and domain provisioning
  all keep working unchanged.
- Branded subdomains (`their-name.zokago.com`) are optional: sites go out as `<slug>.netlify.app`, the same
  class of URL the demos already use, and the sold site moves to the customer's own domain at purchase.

## 3. Apify replacement — investigation + result

**Can "a Haiku model scrape"?** Not by itself — a model has no browser. What works, and what was built:

| Job | Tool | Cost | Evidence (2026-11-05) |
|---|---|---|---|
| Find businesses on Google Maps (name, rating, reviews, category, address, website, phone) | **Our Playwright** (`scrape-places.mjs`) — the same thing Apify's actor does, from this PC | **$0** | 47 results / 11.7 s list pass; details ~1.5 s per place; 15/15 phones, 15/15 ratings |
| Find emails on their websites | `enrich-emails.mjs` (regex, mailto + visible text) — unchanged | $0 | 60 % yield on contractors, 0 junk after the 11-04 fix |
| Owner first name, cuisine, named dishes, a one-line hook, email fallback | **Haiku 5.5** reading the site (`enrich-haiku.mjs`) | **≈ $0.0004 / site** ($0.10/M in, $0.50/M out) → 1,000 sites ≈ $0.40 | 5 sites: 1 owner named *with quote*, 4 hooks, 3 emails, 0 guesses |
| Verify emails | MillionVerifier (unchanged) | $39 / 10k | — |

New pipeline: `scrape-places` → `enrich-emails` → `enrich-haiku` → `verify-emails` → `import-prospects --verify`
→ `export-instantly`. Output columns are the importer's existing contract; `owner first name` lands in the
importer's `first name` candidates, so greetings stop reading "Hi there".

**Risks and the fallback.** Google can serve a CAPTCHA at volume; at our volume (a few hundred places a
week, home IP, 1–2 s jitter, 3 tabs) it did not. The script stops and says so if it happens (`--headful`
to solve once; `--resume` keeps progress). The compliant alternative if scraping is ever blocked is the
**Google Places API (New)** — official, has a monthly free tier per SKU (check the current pricing page),
returns no emails and restricts storing place data; we have a GCP project already. Either way the scraping
exposure is the same as it was with Apify, who scraped the same pages on our behalf.

**The $200/month API credits** (owner-stated Max-plan credits; confirm the amount in the Console) cover
this many times over: demo builds are ~$0.05 each, enrichment ~$0.0004 a site, briefs ~$0.05. Apify's
$19/mo and its per-place fees go away; MillionVerifier stays.

Follow-ups to use the new data: `export-instantly.mjs` must pass `hook` / `cuisine` / `dishes` as Instantly
custom variables, and the sequence copy needs a `{{hook}}` line (playbook §5 — public-info personalization
is the top evidence-backed lever after the business name).

## 4. Adopt next (ranked by expected effect on sales)

1. **Make the one-page demo use their real material** (code change in `generate-site` fast path, $0 extra):
   before the Sonnet call, fetch `prospects.website` → real logo (header `<img>` candidates), `og:image`,
   menu/services text, socials → pass as brief + assets. This is Zokago's believability edge applied to our
   speed. Until then the ace-site skill is the manual path for anyone who replies or views.
2. **Forms on sold contractor sites must deliver.** The contractor demo's contact form "posts nowhere" by
   design; once purchased and live on the customer's domain it is a lead sink — Gabe's exact incident.
   Fix: emit the same Netlify Form markup from the contractor spec (`data-netlify` + honeypot) and create
   the owner notification in `provision-domain`, or drop the form and keep tel:. Restaurants have no form.
3. **Reply poll 15 → 5 min** (`scripts/cron-jobs.sql`). 4. **Add email 4 at day 14** (owner-run Instantly edit).
5. **Post-deploy smoke check in `generate-site`** (images 200, mobile menu present), mirroring `deploy.mjs`.

## 5. Owner setup to go live
Nothing. `deploy.mjs` uses the Netlify CLI login / `NETLIFY_AUTH_TOKEN` already on this machine. Verified
live 2026-11-05: the restaurant fixture at https://example-trattoria.netlify.app (all gates green), and a
contractor fixture whose form was detected (detection enabled by API), smoke-submitted, stored and deleted.
Known limit: Netlify form notifications can only go to team members, so leads notify hello@ (forward to the
owner); a future outgoing-webhook → GHL relay would notify the customer directly.
Say "build a website for <business>, their site is <url>" in Claude Code (inside this repo).

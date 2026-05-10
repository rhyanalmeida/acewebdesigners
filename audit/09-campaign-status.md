# Audit 09 — Facebook Ad Campaign Status

**Scope:** Determine whether the Meta ad campaign driving traffic to `/contractorlanding` caused the $150-spent / 0-leads outcome.

**Method:** Read `scripts/meta-ads-status.mjs`, `scripts/meta-ads-setup.mjs`, and `.env.local`; attempt live Marketing API call via the status script.

---

## 1. Environment (`.env.local`)

| Var | Value | Notes |
|---|---|---|
| `META_ADS_TOKEN` | `EAAJ…rwZA` (redacted) | System User token |
| `META_AD_ACCOUNT_ID` | `act_553999801104558` | OK |
| `META_DATASET_ID` | `1548487516424971` | **OLD pixel** — contractor landing fires `4230021860577001` |

---

## 2. Live API attempt

`node scripts/meta-ads-status.mjs` returned:

```
Error: 400: {"message":"Error validating access token: Session has expired
on Sunday, 26-Apr-26 10:00:00 PDT. The current time is Sunday, 10-May-26
16:54:52 PDT.","type":"OAuthException","code":190,"error_subcode":463,
"fbtrace_id":"AVy-pCEGX4TD6mcOkKy7TjO"}
```

**Token expired 2026-04-26 (~14 days ago).** No live campaign / adset / ad / insights data can be read. Any local automation, scheduled CAPI sender, or status check sharing this token has been silently failing for two weeks.

---

## 3. Campaign config (from `scripts/meta-ads-setup.mjs`)

| Field | Value |
|---|---|
| Campaign name | `Contractor Lead Gen — Free Website Offer` |
| Objective | `OUTCOME_LEADS` |
| Buying type | `AUCTION` |
| Initial status | `PAUSED` (operator must flip to ACTIVE) |
| Ad set name | `Contractors — US — Advantage+ Audience — $20/day` |
| Daily budget | `$20.00` |
| Bid strategy | `LOWEST_COST_WITHOUT_CAP` |
| Billing event | `IMPRESSIONS` |
| **Optimization goal** | **`OFFSITE_CONVERSIONS`** — correct for pixel-based lead gen |
| **`promoted_object.pixel_id`** | **`process.env.META_DATASET_ID || '4230021860577001'`** |
| `promoted_object.custom_event_type` | `LEAD` |
| Geo / Age | US, 25–65 |
| Audience | Advantage+ on; flexible_spec adds interests (Construction, Home improvement), work positions (Owner, Founder, President, CEO), behavior `6002714898572` (Small business owners) |
| Placements | FB feed/story/reels + IG stream/story/reels/explore, mobile + desktop |
| Destination URL (manual) | `https://acewebdesigners.com/contractorlanding?utm_source=meta&utm_medium=cpc&utm_campaign=contractor_leadgen` |

The destination URL and CTA ("Book Now") are *manual* operator steps — the script does not create the ad creative, so the actual ad URL cannot be confirmed without API access.

---

## 4. Pixel mismatch (root cause)

`setup.mjs`:
```
const datasetId = process.env.META_DATASET_ID || '4230021860577001'
```

The fallback is the correct contractor pixel, but `.env.local` overrides it with `META_DATASET_ID=1548487516424971` (the old pixel). If `meta-ads-setup.mjs` ran with this env, the ad set was created with:

```
promoted_object: { pixel_id: '1548487516424971', custom_event_type: 'LEAD' }
```

Meanwhile `/contractorlanding` fires its `Lead` event on pixel `4230021860577001`. **The campaign is asking Meta to optimize toward `LEAD` events on a pixel the landing page never fires.** Meta sees zero conversions, the auction algorithm never learns who converts, and no buyers are found — exactly consistent with $150 spent / 0 leads.

This cannot be confirmed live (token expired) but is the most likely failure mode given `.env.local` as written.

---

## 5. 30-day insights

| Metric | Value |
|---|---|
| impressions | unknown — token expired |
| clicks | unknown — token expired |
| spend | $150 (per user report) |
| CTR | unknown |
| `actions.lead` | 0 (per user report) |
| `cost_per_action_type.lead` | n/a |

---

## 6. Diagnosis — red flags

1. **Pixel mismatch — almost certainly the root cause of 0 leads.** `.env.local` sets `META_DATASET_ID=1548487516424971`; the landing fires `4230021860577001`. Ad set's `promoted_object.pixel_id` therefore points at the wrong pixel.
2. **Token expired (2026-04-26).** Status script and any automation tied to `META_ADS_TOKEN` have been failing ~14 days. If the same token backs server-side CAPI, events have been dropping.
3. **No live confirmation possible** of pixel id, ad URL, `effective_status`, or `issues_info` until the token is rotated. Disapproved / limited-delivery cannot be ruled out.
4. **Budget is healthy** ($20/day × ~8 days ≈ $160 — matches the $150 reported); not an under-delivery problem.
5. **Audience is broad and reasonable** (US, 25–65, Advantage+ with SMB / contractor seeds); not a narrow-audience problem.
6. **Optimization goal is correct** (`OFFSITE_CONVERSIONS` / `LEAD`) — but rendered moot by (1).

---

## 7. Verdict

**FAIL — campaign wired to wrong pixel.** Ad set's `promoted_object.pixel_id` is `1548487516424971` (via `META_DATASET_ID`), not the contractor pixel `4230021860577001` that the landing page fires. Meta has no `Lead` signal to optimize against, so $150 produced 0 attributed leads.

**Compounding finding:** `META_ADS_TOKEN` expired 2026-04-26 — any token-dependent automation has been silently failing for ~14 days.

### Recommended actions (out of scope for this read-only audit)

1. Mint a new long-lived System User token; replace `META_ADS_TOKEN` in `.env.local` and production secrets.
2. Set `META_DATASET_ID=4230021860577001` in `.env.local`.
3. Re-run `node scripts/meta-ads-status.mjs` to confirm campaign / ad set / pixel.
4. In Ads Manager, edit the ad set's `promoted_object.pixel_id` from `1548487516424971` to `4230021860577001`. (Resets learning; the $150 of training data is unavoidably lost.)
5. Verify the ad creative's destination URL is `/contractorlanding?utm_source=meta&utm_medium=cpc&utm_campaign=contractor_leadgen`.
6. Re-test end-to-end: submit a real form, confirm `Lead` lands on `4230021860577001` in Events Manager, then unpause.

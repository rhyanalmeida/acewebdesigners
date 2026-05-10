# Audit 02 — Production Deploy State

**Scope:** Confirm production-deployed code on `acewebdesigners.com` is up-to-date with `master` and includes commit `fab151d` (main-landing `event_id` dedup fix).

**Date:** 2026-05-10
**Branch:** `worktree-agent-a8dc9f1704c640d5c` (HEAD = `fab151d`)
**Repo:** `https://github.com/rhyanalmeida/acewebdesigners.git`

---

## 1. Latest 5 commits on `origin/master`

```
fab151d fix(meta): main-landing event_id dedup, webhook auth warning, dead-code sweep
2f199f6 chore(tooling): headed-Chromium scripts to verify Netlify env + GHL pixel
7310364 fix(meta): contractor pixel = 4230021860577001, drop dead Calendly, CSP+diagnostics
5554c07 fix(seo): remove static head meta tags that duplicate Helmet's per-route ones
27f2703 chore: bundle in-flight content + landing components needed for the build
```

## 2. Confirm `fab151d` is in master

```
fab151dccd498b54b70a30e7169a3143f77e7f62  fix(meta): main-landing event_id dedup, webhook auth warning, dead-code sweep  2026-05-01 11:53:44 -0400
```

`fab151d` is the **tip of `origin/master`** and **HEAD of this worktree**. It modifies `src/Landing.tsx` to call `getAttribution()` and pass `event_id` into `trackBookingComplete('main', undefined, event_id)`.

## 3. Source-side signature strings (master)

| String | File | Line | Status |
|---|---|---|---|
| `Main Landing booking detected!` | `src/Landing.tsx` | 80 | PRESENT |
| `Contractor booking detected!` | `src/LandingContractors.tsx` | 182 | PRESENT |
| `awd_attribution` (sessionStorage key) | `src/utils/attribution.ts` | 13 | PRESENT |

All three signatures exist in master source. If the production bundle was built from `fab151d` (or any descendant), they will appear in the bundled JS.

## 4. Dedup-related commit history (`--grep="event_id"`)

```
fab151d fix(meta): main-landing event_id dedup, webhook auth warning, dead-code sweep
7310364 fix(meta): contractor pixel = 4230021860577001, drop dead Calendly, CSP+diagnostics
59c844b chore(tooling): production audit harness + Meta ads runbook
bfaf548 test: add PriceCard regression test for prominent home pricing (Phase 3 / Unit 10)
143d5ea feat(landing): editorial cream conversion pages with full pixel/CAPI preservation (Phase 3 / Unit 9)
b9a2ced refactor(pages): apply DRY primitives to landings + refer (Phase 2 / Unit 4)
2c7e38c feat(ui): premium SaaS-grade overhaul with shared design system
b76cba3 chore: codebase hardening + deploy reliability fix
9fca606 feat: move Meta CAPI server-side with event_id dedup for contractor landing
834614d Enhanced Facebook Pixel CompleteRegistration with Advanced Matching ...
```

The dedup story: `9fca606` introduced server-side CAPI + `event_id` for contractor; `fab151d` (2026-05-01) closed the same gap on main-landing.

## 5. Netlify deploy config

`netlify.toml`:
- Build: `npm run build`, publish `dist/`
- Node 22, esbuild for functions
- SPA fallback `/* -> /index.html` (200) AFTER function redirects

No branch-pinning or skipped-build directives — every push to `master` triggers a Netlify build. With `fab151d` on `origin/master` since 2026-05-01 and today being 2026-05-10, a successful Netlify deploy has had ~9 days to land.

## 6. Production bundle verification

**DEFERRED** — outbound HTTP is blocked in this sandbox (`curl`, `Invoke-WebRequest`, and `WebFetch` all denied, even with `dangerouslyDisableSandbox: true`). The canonical check (grep the hashed `/assets/index-*.js` for `Main Landing booking detected`) cannot run here.

### Manual reproduction

```powershell
# 1. Pull HTML and discover bundle URL
curl -sL https://acewebdesigners.com/ -o prod-main.html
curl -sL https://acewebdesigners.com/contractorlanding -o prod-contractor.html
Select-String -Path prod-main.html       -Pattern '/assets/[^"'']+\.js'
Select-String -Path prod-contractor.html -Pattern '/assets/[^"'']+\.js'

# 2. Fetch each bundle and grep for the signatures
curl -sL https://acewebdesigners.com/assets/<hash>.js -o bundle.js
Select-String -Path bundle.js -Pattern 'Main Landing booking detected'   # PASS = fab151d deployed
Select-String -Path bundle.js -Pattern 'Contractor booking detected'     # always PASS
Select-String -Path bundle.js -Pattern 'awd_attribution'                 # always PASS

# 3. Deploy headers
curl -sI https://acewebdesigners.com/ | Select-String -Pattern 'x-nf-request-id|server|age|cache'
```

Recommendation: pair this audit with Netlify dashboard inspection — confirm the most-recent successful production deploy SHA equals or is descended from `fab151dccd498`. If the Netlify deploy SHA is older than `fab151d`, that is the smoking gun for "no leads."

---

## Verdict

**INCONCLUSIVE (sandbox-limited).**

- Master state: PASS — `fab151d` is the tip of `origin/master` (9 days old), all three signature strings present in source.
- Netlify config: PASS — auto-deploys on push to `master`, no branch-pinning, no skip directives.
- Production bundle grep: NOT VERIFIABLE — outbound HTTP blocked.

**Action for operator:** run §6 commands or check the Netlify dashboard. If the most-recent successful deploy SHA equals or descends from `fab151dccd498`, this unit becomes PASS. If the deployed SHA is older, that is the smoking gun for the missing leads.

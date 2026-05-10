# Audit Unit 10 — Production Content-Security-Policy

## Scope

Confirm the production site at `https://acewebdesigners.com/contractorlanding`
serves a CSP that does NOT block:

- Meta Pixel (`connect.facebook.net`, `www.facebook.com`)
- Meta Conversions API Gateway (`*.conversionsapigateway.com`, `*.run.app`)
- GoHighLevel booking iframe (`*.msgsndr.com`, `*.leadconnectorhq.com`)

## Environment limitation

Outbound network calls (`curl.exe`, `Invoke-WebRequest`, `WebFetch`,
`[System.Net.WebRequest]`) are blocked in this worktree. The live
`GET /contractorlanding` was not executed. Verdict below is inferred from
the deployment mechanism; re-run steps 2 and 7 from a network-enabled
shell to fully close this audit.

## Deployment mechanism

- `netlify.toml` (lines 1–20) defines only `[build]`, `[functions]`, and a
  single SPA-fallback `[[redirects]]` rule. **No `[[headers]]` block, no CSP
  header.**
- No `_headers` file exists in the repo (`Glob **/_headers` → no matches).
- Therefore Netlify is **not** injecting a Content-Security-Policy HTTP
  header. The CSP that browsers see comes exclusively from the
  `<meta http-equiv="Content-Security-Policy">` tag in `dist/index.html`,
  which Vite copies verbatim from the source `index.html`.
- Local `index.html` is at commit `fab151d` (current `HEAD`), which equals
  `origin/master` (verified via `git log -1 origin/master`). Provided
  Netlify's last build picked up `fab151d` (or `7310364` / later — both
  contain the widened CSP), production serves the policy below.

## Local CSP (verbatim from `C:\Projects\acewebdesigners\index.html` line 68)

```
default-src 'self' data: blob:;
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://connect.facebook.net https://www.facebook.com https://link.msgsndr.com https://*.msgsndr.com https://api.leadconnectorhq.com https://*.leadconnectorhq.com https://player.vimeo.com https://*.vimeo.com;
script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://connect.facebook.net https://www.facebook.com https://link.msgsndr.com https://*.msgsndr.com https://api.leadconnectorhq.com https://*.leadconnectorhq.com https://player.vimeo.com https://*.vimeo.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.leadconnectorhq.com https://*.leadconnectorhq.com https://*.msgsndr.com;
style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.leadconnectorhq.com https://*.msgsndr.com;
img-src 'self' data: blob: https://i.ibb.co https://*.ibb.co https://i.postimg.cc https://images.unsplash.com https://fast.wistia.com https://www.facebook.com https://api.leadconnectorhq.com https://*.leadconnectorhq.com https://*.msgsndr.com;
connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* wss://localhost:* https://fast.wistia.com https://*.wistia.com https://*.vimeo.com https://vimeo.com https://formspree.io https://www.facebook.com https://*.facebook.com https://www.google.com https://www.gstatic.com https://api.leadconnectorhq.com https://*.leadconnectorhq.com https://*.msgsndr.com wss://*.msgsndr.com https://*.run.app https://*.conversionsapigateway.com;
font-src 'self' data: https://fonts.gstatic.com https://*.leadconnectorhq.com https://*.msgsndr.com;
frame-src 'self' https://www.google.com https://www.recaptcha.net https://fast.wistia.com https://player.vimeo.com https://*.vimeo.com https://www.facebook.com https://api.leadconnectorhq.com https://*.leadconnectorhq.com https://*.msgsndr.com;
media-src 'self' https://player.vimeo.com https://*.vimeo.com https://fast.wistia.com https://*.leadconnectorhq.com https://*.msgsndr.com;
```

## Production CSP

- **Source mechanism:** `<meta http-equiv="Content-Security-Policy">` in the
  served HTML (no Netlify HTTP header).
- **Expected value:** Identical to local CSP above, assuming Netlify's last
  successful deploy is at or after commit `7310364` (which widened the
  policy with `*.conversionsapigateway.com` and `*.run.app`). `HEAD` =
  `fab151d` is two commits past `7310364` and `origin/master` matches, so
  the next/most-recent build should serve the same string.
- **Could not fetch live** — re-run from a network-enabled shell:
  `curl.exe -sL https://acewebdesigners.com/contractorlanding | Select-String 'Content-Security-Policy'`

## Required-domain matrix

| Domain                          | Required directive(s)                       | Present? |
|---------------------------------|---------------------------------------------|----------|
| `connect.facebook.net`          | script-src, script-src-elem                 | yes      |
| `www.facebook.com`              | script-src, script-src-elem, img-src, frame-src, connect-src | yes |
| `*.facebook.com`                | connect-src                                 | yes      |
| `*.conversionsapigateway.com`   | connect-src (CRITICAL — added in 7310364)   | yes      |
| `*.run.app`                     | connect-src (Meta CAPI Gateway hosting)     | yes      |
| `link.msgsndr.com`              | script-src, script-src-elem                 | yes      |
| `*.msgsndr.com`                 | script-src, style-src, font-src, img-src, connect-src (incl. `wss://`), frame-src, media-src | yes |
| `api.leadconnectorhq.com`       | script-src, style-src, img-src, connect-src, frame-src | yes |
| `*.leadconnectorhq.com`         | script-src, script-src-elem, style-src, style-src-elem, font-src, img-src, connect-src, frame-src, media-src | yes |

## Diff (local vs production)

None expected — the deploy serves the local meta tag verbatim. **If a live
fetch shows differences, the most likely cause is a stale Netlify build
predating `7310364`** (the commit that added `*.conversionsapigateway.com`
and `*.run.app` to `connect-src`). Trigger a rebuild from the Netlify UI
in that case.

## `report-only` check

The local CSP uses `http-equiv="Content-Security-Policy"`, **not**
`Content-Security-Policy-Report-Only`. Violations would be enforced
(blocked), not just reported. This is the desired enforcement mode.

## Sanity check — Meta pixel URL

`curl.exe -sI 'https://www.facebook.com/tr?id=4230021860577001&ev=PageView&noscript=1'`
**not executed** (network blocked in sandbox). Run manually; expect HTTP 200
or 302 with `content-type: image/gif` or similar — confirms DNS + TLS path
to Meta is reachable from the browser/server.

## DIAGNOSIS

Source-only inspection: the CSP is correctly configured and is not the
cause of the missing leads. All required Meta + GHL domains are whitelisted
in the appropriate directives. The CSP ships in every Netlify build of
`master` at or after commit `7310364`.

Risks that warrant a live re-fetch:

1. Netlify is serving a build older than `7310364` (stuck deploy, branch
   override). Confirm via live fetch + commit-hash check.
2. A future commit adds a second CSP via HTTP header. Per spec, the
   intersection of meta + header is enforced. No such header exists in
   `netlify.toml` today.

Note: the meta tag is at source line 66, well above the `form_embed.js`
and Vimeo player `<script>` tags at lines 580–581. Browser parses head
top-down, so the CSP is active before those scripts load.

## VERDICT

PASS (inferred). Local CSP whitelists every Meta + GHL domain required
for pixel and CAPI Gateway traffic; deploy mechanism (meta tag in the
build artifact, no Netlify header) means production matches as long as
the latest build is at or after `7310364`. Re-run steps 2 and 7 from a
network-enabled shell to upgrade to PASS (confirmed).

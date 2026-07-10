# Deploy procedure

## Standard deploy

```
npx netlify deploy --prod --build
```

or if the CLI launcher is on PATH:

```
acewebdesigners deploy
```

This builds locally (Vite + esbuild functions) and uploads the bundle to Netlify. Bypasses any plugin-install issues on Netlify CI. Always works.

## Git-push deploys

After the cleanup landed in [Unit 1](../.claude/plans/peppy-skipping-rainbow.md), `git push origin master` should also produce a successful Netlify CI build because:

1. `.netlify/` is no longer tracked → CI regenerates it cleanly per build
2. The duplicate `Ace Web Designers Website/` tree is removed
3. The `@netlify/plugin-emails` plugin must be removed from Netlify UI (one-time manual step below)

If a git-push deploy fails again, fall back to the local CLI command above and open an issue.

## One-time manual step required

We had `@netlify/plugin-emails` installed via the Netlify UI but never used it (no source code references the `NETLIFY_EMAILS_*` env vars). Its dependency tarballs cause sporadic `npm error code EINTEGRITY` failures during plugin install.

**Remove it:**

1. Open [https://app.netlify.com/projects/shimmering-malasada-c66a09/configuration/integrations](https://app.netlify.com/projects/shimmering-malasada-c66a09/configuration/integrations)
2. Find **`@netlify/plugin-emails`** in the installed plugins list
3. Click **Remove** / **Uninstall**
4. Trigger a deploy → it should now succeed in CI

## What's deployed

- Site: `acewebdesigners.com` (Netlify project `shimmering-malasada-c66a09`)
- Functions: **none.** Conversions moved to GHL's native "Meta Conversion API" workflow action
  (2026-06-01); the old `ghl-capi` / `attribution-stash` functions were deleted.
- Static assets: Vite build output in `dist/`

## Smoke test after every deploy

There is no server function to ping. Verify the deploy serves the SPA and the browser pixel still
fires audiences only:

```bash
node scripts/audit-production.mjs   # headed Playwright production sanity audit
```

For end-to-end conversion verification (GHL → Meta), see `docs/META_ADS.md` → Verification.
If the audit fails, roll back via the Netlify UI's deploy history.

## Rollback any deploy

Netlify keeps deploy history. To revert: open Site → Deploys → find the last-known-good deploy → "Publish deploy". Effective in seconds.

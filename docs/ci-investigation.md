# Netlify CI Build Failure Investigation

**Date:** 2026-04-23
**Site:** shimmering-malasada-c66a09 (acewebdesigners.com)
**Failing commits:** 9fca606, fbe1739 (Node 22 pin didn't help)
**Last passing GitHub-triggered deploy:** 876912b
**Branch:** master

## Evidence Gathered

- Local `npm run build` passes.
- Local `npx netlify build` passes (with a non-fatal ESM/CommonJS warning from the
  Netlify emails internal function — pre-existing, not a regression).
- Remote Netlify CI fails at stage "building site" with exit code 2.
- Netlify HTTP API does not expose full build logs (`getSiteBuild` returns only
  the generic error message; no `getSiteBuildLog` exists).
- Workaround: deploying with local `netlify deploy --prod --build` works.
- Commit 9fca606 added:
  - `netlify/functions/ghl-capi.ts` (new TS Netlify function)
  - `tsconfig.functions.json` (new; NOT referenced by root `tsconfig.json`)
  - New `[functions]` block in `netlify.toml` with `node_bundler = "esbuild"`
  - Edits to 5 files under `src/`
- Commit fbe1739 only pinned `NODE_VERSION = "22"` in `netlify.toml`.
- Root `tsconfig.json` uses `files: []` + project references to
  `tsconfig.app.json` (includes `src`) and `tsconfig.node.json` (includes only
  `vite.config.ts`). Running plain `tsc` (no `-b`) is effectively a no-op
  locally. `tsconfig.functions.json` is not referenced anywhere, so it does not
  affect `tsc`.
- Running `tsc -b --verbose` DOES surface dozens of pre-existing type errors
  across `src/` (unused React imports, missing `vitest`/`@testing-library/react`
  types in `src/test/setup.ts` and `src/components/__tests__/App.test.tsx`,
  missing `zod` and `dompurify` in `src/utils/validation.ts`, etc.). These
  errors existed before 9fca606, so they alone do not explain the regression.

## Top Hypotheses (ranked by likelihood)

### 1. The `@netlify/plugin-emails` build plugin fails on the remote build

**Why it fits:**
- The plugin is installed via the Netlify UI (see `.netlify/netlify.toml`:
  `origin = "ui"`, `package = "@netlify/plugin-emails"`).
- The committed internal function `.netlify/functions-internal/emails/index.js`
  uses CommonJS (`exports.handler = ...`) but the root `package.json` has
  `"type": "module"`. Running `netlify build` locally emits an esbuild warning:
  `The CommonJS "exports" variable is treated as a global variable in an
  ECMAScript module`.
- Locally it is a warning; on a fresh Netlify CI environment the plugin may
  regenerate this file before bundling and hit an `exports is not defined`
  error or a different path.
- This would explain: local pass, remote fail, and why pinning Node 22 did not
  help.

**Why it might not fit:**
- This setup existed before 9fca606 and deploys were succeeding. Something new
  in 9fca606 must have tripped it (e.g. the new `[functions]` block changes
  how the plugin interacts with the functions directory).

**Suggested next step:** Temporarily uninstall `@netlify/plugin-emails` via the
Netlify UI, or force-regenerate the emails function so it uses `.cjs`.
Alternatively, delete the committed `.netlify/functions-internal/emails/*` and
the `.netlify/netlify.toml` generated file and let the plugin regenerate
fresh.

### 2. The new `[functions]` block triggers a bundling step that fails on `netlify/functions/ghl-capi.ts`

**Why it fits:**
- Before 9fca606, `netlify.toml` had no `[functions]` block, so Netlify may not
  have been bundling any functions at all (despite `.netlify/functions/` being
  present in git). Adding `directory = "netlify/functions"` plus
  `node_bundler = "esbuild"` flips bundling on.
- `ghl-capi.ts` uses `import crypto from 'node:crypto'`. Under Netlify's
  esbuild-based bundler with certain Node/`@types/node` combos, this can emit
  a spurious default-import warning/error.
- `process.env` access without a `types: ["node"]` reference in any tsconfig
  compiled by the main build could cause a type error IF Netlify runs `tsc`
  over the functions directory (unlikely but possible under certain Netlify
  Build configs).

**Why it might not fit:**
- Local `netlify build` successfully bundles `ghl-capi.ts` and the zip is
  produced.
- esbuild strips types, so tsconfig misconfigurations on the function should
  not cause failures during function bundling.

**Suggested next step:** Change `import crypto from 'node:crypto'` to
`import * as crypto from 'node:crypto'` (more defensive under esbuild) and
add `@netlify/functions` as a devDependency so types are available. Add an
explicit `exclude` in `tsconfig.app.json` for `netlify/**` as belt-and-suspenders.

### 3. A build-time environment drift between CI and local (specifically around `.netlify/` being committed to git)

**Why it fits:**
- `.netlify/functions-internal/emails/index.js`, `.netlify/netlify.toml`,
  `.netlify/functions/emails.zip`, and `.netlify/plugins/*` are all tracked in
  git. On a fresh Netlify CI clone these pre-existing files conflict with what
  Netlify Build tries to regenerate.
- Netlify CI may refuse to overwrite `.netlify/netlify.toml` or fail when the
  committed `emails.zip` is stale relative to the installed plugin version.
- Adding the new function in 9fca606 caused Netlify Build to regenerate
  `.netlify/functions/manifest.json` (which IS committed) — and the version
  committed in master may now mismatch what the remote build produces.

**Why it might not fit:**
- Netlify Build typically just overwrites its own cache directory without
  error.

**Suggested next step:** Remove the entire `.netlify/` directory from git
(add to `.gitignore`) and let Netlify regenerate it fresh on each build. Also
remove the duplicate `Ace Web Designers Website/.netlify/*` tree (committed
sibling copy — almost certainly not wanted).

## What I Could Not Determine

Without access to the actual remote Netlify build log (first ~50 lines of
stderr from the failing build), I cannot pinpoint which of the three
hypotheses is correct. The Netlify public API does not expose build logs;
retrieving them requires either:
- Browser access to `https://app.netlify.com/sites/shimmering-malasada-c66a09/deploys/69eadd7eb617b3000816a7f9`
- Copying the raw log text from the Netlify UI build page and pasting it in
- Using `netlify logs:deploy` while a new failing build is actively running

## Recommended Next Step

Fetch and paste the actual Netlify build log (or screenshot) from
https://app.netlify.com/projects/shimmering-malasada-c66a09/deploys/69eadd7eb617b3000816a7f9
so the exact error line can be identified. The three hypotheses above all
have one-line fixes once the log points to the right one.

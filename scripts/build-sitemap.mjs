#!/usr/bin/env node
/**
 * Generate public/sitemap.xml at build time so <lastmod> always reflects the
 * actual build date instead of a stale hard-coded value.
 *
 * Wired in via the `prebuild` npm script — runs automatically before `vite build`.
 */
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
// Canonical host — must match `routeMeta.ts` and the `<link rel="canonical">`
// tags. Production was previously emitting `www.acewebdesigners.com` here while
// the rest of the site uses the apex; that mismatch confused crawlers.
const SITE = 'https://acewebdesigners.com'
const TODAY = new Date().toISOString().slice(0, 10)

/** Route → sitemap config. Keep priorities mirroring routeMeta importance. */
const ROUTES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/services', changefreq: 'weekly', priority: '0.9' },
  { path: '/socialmedia', changefreq: 'weekly', priority: '0.9' },
  { path: '/contractorlanding', changefreq: 'weekly', priority: '0.9' },
  { path: '/landing', changefreq: 'weekly', priority: '0.8' },
  { path: '/work', changefreq: 'weekly', priority: '0.8' },
  { path: '/reviews', changefreq: 'weekly', priority: '0.8' },
  { path: '/about', changefreq: 'monthly', priority: '0.7' },
  { path: '/contact', changefreq: 'monthly', priority: '0.7' },
  { path: '/refer', changefreq: 'monthly', priority: '0.6' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/termsofservice', changefreq: 'yearly', priority: '0.3' },
]

const urlEntry = ({ path, changefreq, priority }) => `  <url>
    <loc>${SITE}${path}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${ROUTES.map(urlEntry).join('\n')}
</urlset>
`

const outPath = resolve(__dirname, '..', 'public', 'sitemap.xml')
await writeFile(outPath, xml, 'utf8')
console.log(`✓ sitemap.xml regenerated with lastmod=${TODAY} (${ROUTES.length} URLs)`)

// Attaches to the running persistent Chromium on CDP 9222.
// Emits JSON: {url, title, pages: [{url, title}]}
// Usage: node scripts/browser-attach.mjs

import { chromium } from 'playwright'

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const contexts = browser.contexts()
const pages = contexts.flatMap((c) => c.pages())
const active = pages[0]
const info = {
  contexts: contexts.length,
  pages: pages.map((p) => ({ url: p.url(), title: '' })),
}
if (active) info.active = { url: active.url() }
console.log(JSON.stringify(info, null, 2))
await browser.close()

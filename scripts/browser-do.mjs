// Run a JS snippet against the CDP-attached Chrome (scripts/browser-launch.mjs).
//   node scripts/browser-do.mjs "<js body using page, ctx, f (the GHL workflows iframe frame, when present)>"
import { chromium } from 'playwright'
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const ctx = browser.contexts()[0]
const page = ctx.pages().find((p) => p.url().includes('gohighlevel')) || ctx.pages()[0]
let f = null
try { const fh = await page.$('iframe[src*="automation-workflows"]'); f = fh ? await fh.contentFrame() : null } catch { f = null }
const snap = async (loc, n = 6000) => { try { return (await loc.ariaSnapshot({ timeout: 15000 })).slice(0, n) } catch (e) { return 'SNAP ERR ' + e.message.slice(0, 200) } }
const fn = new Function('page', 'ctx', 'f', 'snap', `return (async () => { ${process.argv[2]} })()`)
try { const out = await fn(page, ctx, f, snap); if (out !== undefined) console.log(typeof out === 'string' ? out : JSON.stringify(out, null, 1)) }
catch (e) { console.error('ERR', e.message.slice(0, 600)); process.exitCode = 1 }
finally { await browser.close().catch(() => {}) }

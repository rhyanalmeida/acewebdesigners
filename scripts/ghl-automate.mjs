// GHL browser automation helpers + CLI.
//
// Connects to the already-running persistent Chromium on CDP (http://127.0.0.1:9222).
// Designed for GHL where the workflow builder lives inside a cross-origin iframe
// whose Playwright-reported frame name is empty, so we resolve it via
// elementHandle().contentFrame() on the iframe locator.
//
// --- Library usage ---
//   import { getPage, getFrame, goto, click, fill, evalJS, snapshot, waitMs, closeBrowser } from './ghl-automate.mjs'
//   const page = await getPage()
//   const frame = await getFrame(page, 'workflow-builder')
//   await click('button.save', { frame })
//
// --- CLI usage ---
//   node scripts/ghl-automate.mjs goto <url> [waitMs]           [--frame=<name>]
//   node scripts/ghl-automate.mjs click <selector>              [--frame=<name>]
//   node scripts/ghl-automate.mjs fill <selector> <value>       [--frame=<name>]
//   node scripts/ghl-automate.mjs eval "<js>"                   [--frame=<name>]
//   echo "<js>" | node scripts/ghl-automate.mjs eval -          [--frame=<name>]
//   node scripts/ghl-automate.mjs snapshot                      [--frame=<name>]
//   node scripts/ghl-automate.mjs wait <ms>
//   node scripts/ghl-automate.mjs attach
//
// --frame selects an iframe by:
//   * exact `name` attribute (default)
//   * a substring of the iframe's src/url
//   * raw selector if it starts with "iframe"
// Omit --frame (or pass --frame=main) to operate on the top page.

import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const CDP_URL = 'http://127.0.0.1:9222'

// --------------------------------------------------------------------------
// Library helpers
// --------------------------------------------------------------------------

let _browser = null

/** Connect to the running CDP Chromium and return the active page. */
export async function getPage() {
  if (!_browser) _browser = await chromium.connectOverCDP(CDP_URL)
  const ctx = _browser.contexts()[0]
  if (!ctx) throw new Error('No browser context found. Launch the browser first.')
  const page = ctx.pages()[0] || (await ctx.newPage())
  return page
}

/** Close the CDP connection (does NOT close the browser itself). */
export async function closeBrowser() {
  if (_browser) {
    await _browser.close()
    _browser = null
  }
}

/**
 * Resolve a child frame.
 *
 * Strategy (in order):
 *   1. If selector starts with "iframe" treat it as a raw locator selector.
 *   2. Otherwise try `iframe[name="<id>"]` via locator → elementHandle → contentFrame
 *      (works for cross-origin iframes like GHL's workflow-builder).
 *   3. Fall back to matching page.frames() by name or url substring.
 *
 * Returns the page itself (usable like a frame) when nameOrUrlSubstring is falsy
 * or the literal string "main".
 */
export async function getFrame(page, nameOrUrlSubstring, { timeoutMs = 15000, pollMs = 500 } = {}) {
  if (!nameOrUrlSubstring || nameOrUrlSubstring === 'main') return page

  const raw = nameOrUrlSubstring
  const selector = raw.startsWith('iframe') ? raw : `iframe[name="${raw}"]`
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const handle = await page.locator(selector).first().elementHandle().catch(() => null)
    if (handle) {
      const frame = await handle.contentFrame()
      if (frame) {
        // Also wait until the inner frame has a body we can query
        try {
          await frame.waitForFunction(() => document.body && document.body.children.length > 0, { timeout: 5000 })
        } catch {}
        return frame
      }
    }
    const frames = page.frames()
    const match = frames.find(
      (fr) => fr.name() === raw || (fr.url && fr.url().includes(raw)),
    )
    if (match) return match
    await page.waitForTimeout(pollMs)
  }

  throw new Error(`frame not found after ${timeoutMs}ms: ${raw}`)
}

/** Navigate the top page to a URL and wait the given ms for JS to settle. */
export async function goto(url, waitMsAfter = 3000) {
  const page = await getPage()
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  if (waitMsAfter > 0) await page.waitForTimeout(waitMsAfter)
  return { url: page.url(), title: await page.title() }
}

/** Sleep in the browser's time-base (uses Playwright's waitForTimeout on the top page). */
export async function waitMs(ms) {
  const page = await getPage()
  await page.waitForTimeout(Number(ms) || 0)
}

/** Evaluate JavaScript in the top page or a named frame. */
export async function evalJS(jsCode, { frame } = {}) {
  const target = frame || (await getPage())
  return await target.evaluate(jsCode)
}

/** Click the first element matching selector in the top page or a given frame. */
export async function click(selector, { frame } = {}) {
  const target = frame || (await getPage())
  await target.locator(selector).first().click()
  return 'ok'
}

/** Fill an input (Playwright's .fill clears and types). */
export async function fill(selector, value, { frame } = {}) {
  const target = frame || (await getPage())
  await target.locator(selector).first().fill(value)
  return 'ok'
}

/**
 * Brief DOM outline of the target. Good for quickly discovering selectors.
 * Returns a newline-joined list of `tag#id: text` entries (first 200).
 */
export async function snapshot({ frame } = {}) {
  const target = frame || (await getPage())
  return await target.evaluate(() => {
    const out = []
    document
      .querySelectorAll('h1,h2,h3,button,a,label,input,select,textarea')
      .forEach((el) => {
        const tag = el.tagName.toLowerCase()
        const txt = (el.innerText || el.value || el.placeholder || '')
          .trim()
          .slice(0, 120)
        const name = el.name || el.id || ''
        if (txt || name) out.push(`${tag}${name ? `#${name}` : ''}: ${txt}`)
      })
    return out.slice(0, 200).join('\n')
  })
}

// --------------------------------------------------------------------------
// CLI
// --------------------------------------------------------------------------

function parseArgs(argv) {
  const positional = []
  let frameArg = null
  for (const tok of argv) {
    if (tok.startsWith('--frame=')) frameArg = tok.slice('--frame='.length)
    else positional.push(tok)
  }
  return { positional, frameArg }
}

async function runCli() {
  const { positional, frameArg } = parseArgs(process.argv.slice(2))
  const [cmd, a, b] = positional

  if (!cmd) {
    console.error('Usage: node scripts/ghl-automate.mjs <cmd> [args...] [--frame=<name>]')
    console.error('Commands: goto, click, fill, eval, snapshot, wait, attach')
    process.exit(2)
  }

  if (cmd === 'attach') {
    const browser = await chromium.connectOverCDP(CDP_URL)
    const ctxs = browser.contexts()
    const pages = ctxs.flatMap((c) => c.pages())
    const info = {
      contexts: ctxs.length,
      pages: pages.map((p) => ({ url: p.url() })),
      active: pages[0] ? { url: pages[0].url() } : null,
    }
    console.log(JSON.stringify(info, null, 2))
    await browser.close()
    return
  }

  const page = await getPage()
  const frame = frameArg ? await getFrame(page, frameArg) : null

  let result
  switch (cmd) {
    case 'goto': {
      // goto bypasses frame context (navigates the page itself)
      result = await goto(a, Number(b) || 3000)
      break
    }
    case 'wait': {
      await waitMs(a)
      result = 'ok'
      break
    }
    case 'click':
      result = await click(a, { frame })
      break
    case 'fill':
      result = await fill(a, b, { frame })
      break
    case 'eval': {
      // If arg is "-" or missing, read JS from stdin
      let js = a
      if (!js || js === '-') js = readFileSync(0, 'utf8')
      result = await evalJS(js, { frame })
      break
    }
    case 'snapshot':
      result = await snapshot({ frame })
      break
    default:
      throw new Error(`unknown cmd: ${cmd}`)
  }

  console.log(typeof result === 'string' ? result : JSON.stringify(result, null, 2))
}

// Only run CLI if invoked directly (not when imported).
const isDirectRun =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}` ||
  process.argv[1]?.endsWith('ghl-automate.mjs')

if (isDirectRun) {
  try {
    await runCli()
  } finally {
    await closeBrowser()
  }
}

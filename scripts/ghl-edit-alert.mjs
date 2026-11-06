// Drive the GHL workflow editor over CDP: set trigger tag, action name + SMS text, publish.
//   node scripts/ghl-edit-alert.mjs "<workflow name>" "<tag>" "<action name>" "<message>"
import { chromium } from 'playwright'
const [name, tag, actionName, message] = process.argv.slice(2)
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const ctx = browser.contexts()[0]
const page = ctx.pages().find((p) => p.url().includes('gohighlevel')) || ctx.pages()[0]
const getF = async () => { const fh = await page.waitForSelector('iframe[src*="automation-workflows"]', { timeout: 30000 }); return await fh.contentFrame() }
const log = (m) => console.log('  ' + m)
try {
  await page.goto('https://app.gohighlevel.com/v2/location/A2zlaOOL5JLn883XGWWl/automation/workflows?listTab=all', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(6000)
  let f = await getF()
  await f.getByRole('textbox', { name: 'Search' }).fill(name.split(' ').pop())
  await page.waitForTimeout(3000)
  await f.getByRole('link', { name }).first().click()
  await page.waitForTimeout(7000)
  f = await getF()
  log('editor: ' + (await f.getByRole('heading', { level: 1 }).first().innerText()))
  // trigger
  await f.getByRole('button', { name: /^Tag added: .* Trigger$/ }).first().click()
  await page.waitForTimeout(2500)
  const sel = f.locator('div.custom-select:visible').first()
  const chips = sel.locator('div.flex-wrap > div')
  while (await chips.count()) { await chips.first().locator('svg').click(); await page.waitForTimeout(500) }
  await sel.locator('span.selected').click(); await page.waitForTimeout(800)
  await sel.locator('#uisearchselect-input-search').fill(tag); await page.waitForTimeout(1500)
  const opts = sel.locator('[role=listbox] > div')
  const exact = opts.filter({ hasText: new RegExp('^\s*' + tag + '\s*$') })
  if (await exact.count()) await exact.first().click(); else await opts.filter({ hasText: 'Add New tag' }).first().click()
  await page.waitForTimeout(1000)
  log('trigger chips: ' + JSON.stringify(await chips.allTextContents()))
  await f.getByRole('button', { name: 'Save trigger' }).click(); await page.waitForTimeout(2500)
  // action
  await f.getByRole('button', { name: 'Staff SMS — Needs a Person', exact: true }).first().click()
  await page.waitForTimeout(2500)
  await f.locator('input[type=text]:visible').first().fill(actionName)
  const ed = f.locator('[contenteditable="true"]:visible').first()
  await ed.click(); await page.keyboard.press('Control+a'); await page.keyboard.press('Backspace')
  await page.keyboard.type(message, { delay: 8 }); await page.waitForTimeout(1500)
  log('message: ' + (await ed.innerText()))
  await f.getByRole('button', { name: 'Save action' }).click(); await page.waitForTimeout(2500)
  // re-entry check + publish
  await f.getByRole('tab', { name: 'Settings' }).click(); await page.waitForTimeout(2500)
  const reentry = await f.locator('p:has-text("Allow re-entry")').locator('xpath=preceding::*[@role="switch"][1]').getAttribute('aria-checked').catch(() => '?')
  log('re-entry aria-checked: ' + reentry)
  await f.getByRole('tab', { name: 'Builder' }).click(); await page.waitForTimeout(1500)
  const sw = f.getByRole('switch', { name: 'Toggle draft publish workflow' })
  if ((await sw.getAttribute('aria-checked')) !== 'true') { await sw.click(); await page.waitForTimeout(2500) }
  const body = await f.locator('body').innerText()
  log('published: ' + /published and live|Published/.test(body) + ' · save button: ' + (await f.getByRole('button', { name: 'Save workflow button' }).isDisabled().catch(() => 'n/a')))
  const tr = await f.getByRole('button', { name: /^Tag added: .* Trigger Tag added includes/ }).first().innerText().catch(() => '')
  log('trigger now: ' + tr.replace(/\n/g, ' | '))
} catch (e) { console.error('ERR', e.message.slice(0, 500)); process.exitCode = 1 }
finally { await browser.close().catch(() => {}) }

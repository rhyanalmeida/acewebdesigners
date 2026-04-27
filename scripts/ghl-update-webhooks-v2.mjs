// v2: Direct-DOM webhook updater for the contractor appointment workflow.
// Uses in-frame evaluate() exclusively — bypasses Playwright's pointer-events
// issues with GHL's modal layers.
//
// Strategy per action: click the action card → wait → overwrite URL + existing
// custom data rows in place → add or remove rows to match target → click
// #pg-actions__btn--save-action-webhook (the correct save, NOT the delete with
// id pg-actions__btn--delete-action-webhook).

import { chromium } from 'playwright'

const WEBHOOK_URL = 'https://acewebdesigners.com/.netlify/functions/ghl-capi'
const EVENT_SOURCE_URL = 'https://acewebdesigners.com/contractorlanding'

const COMMON = [
  ['email', '{{contact.email}}'],
  ['phone', '{{contact.phone}}'],
  ['first_name', '{{contact.first_name}}'],
  ['last_name', '{{contact.last_name}}'],
  ['contact_id', '{{contact.id}}'],
  ['event_id', '{{contact.event_id}}'],
  ['fbc', '{{contact.fbc}}'],
  ['fbp', '{{contact.fbp}}'],
  ['fbclid', '{{contact.fbclid}}'],
  ['event_source_url', EVENT_SOURCE_URL],
]

const ACTIONS = [
  { cardName: 'Facebook Offline Conversion Webhook Booked', rows: [['event_type', 'lead'], ...COMMON] },
  { cardName: 'Facebook Offline Conversion Webhook Show Up', rows: [['event_type', 'show'], ...COMMON] },
  // The Purchased variant — base name with no suffix, last webhook in the tree
  { cardName: 'Facebook Offline Conversion Webhook', exactMatchOnly: true, rows: [['event_type', 'purchase'], ...COMMON, ['value', '{{opportunity.monetaryValue}}']] },
]

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const page = browser.contexts()[0].pages()[0]
const h = await page.locator('iframe[name="workflow-builder"]').first().elementHandle()
const frame = await h.contentFrame()

async function dismissModal() {
  await frame.evaluate(() => {
    document.querySelectorAll('.n-modal button, .modal button, button').forEach((b) => {
      const t = (b.innerText || '').trim()
      if (/^Cancel$|^No$|^Close$|^×$/i.test(t)) { try { b.click() } catch {} }
    })
  })
  await page.waitForTimeout(500)
}

async function openAction(cardName, exactOnly) {
  // Click the workflow node whose text matches the card name.
  await frame.evaluate(({ name, exactOnly }) => {
    const nodes = Array.from(document.querySelectorAll('.vue-flow__node'))
    let hit
    if (exactOnly) {
      // Find the node whose visible text is exactly the name (not a suffix variant)
      hit = nodes.find((n) => {
        const lines = (n.innerText || '').split('\n').map((s) => s.trim()).filter(Boolean)
        return lines.some((l) => l === name)
      })
    } else {
      hit = nodes.find((n) => (n.innerText || '').includes(name))
    }
    if (!hit) throw new Error('no node: ' + name)
    hit.click()
  }, { name: cardName, exactOnly: !!exactOnly })
  // Wait for config panel with URL input
  await frame.waitForFunction(() => !!document.querySelector('#webhook-url'), { timeout: 15000 })
  await page.waitForTimeout(800)
}

async function setValue(selector, value, { index = 0 } = {}) {
  await frame.evaluate(({ selector, value, index }) => {
    const inputs = document.querySelectorAll(selector)
    const inp = inputs[index]
    if (!inp) throw new Error('no input: ' + selector + '[' + index + ']')
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    setter.call(inp, value)
    inp.dispatchEvent(new Event('input', { bubbles: true }))
    inp.dispatchEvent(new Event('change', { bubbles: true }))
    inp.dispatchEvent(new Event('blur', { bubbles: true }))
  }, { selector, value, index })
}

async function getRowCount() {
  return await frame.evaluate(() => document.querySelectorAll('input[placeholder="Key"]').length)
}

async function addRow() {
  // Click "Add another item" — this button appears in custom-data section
  await frame.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a, [role=button]'))
    // The "Add another item" beside CUSTOM DATA header (not HEADERS)
    const cdSection = Array.from(document.querySelectorAll('*')).find((el) => el.children.length === 0 && /^CUSTOM DATA$/.test((el.innerText||'').trim()))
    if (!cdSection) throw new Error('no CUSTOM DATA section')
    // Find the closest ancestor with the Add another item button
    let scope = cdSection
    for (let i = 0; i < 10 && scope; i++) {
      const addBtn = Array.from(scope.querySelectorAll('button, a, span')).find((b) => /Add another item/i.test((b.innerText||'').trim()))
      if (addBtn) { addBtn.click(); return }
      scope = scope.parentElement
    }
    throw new Error('no Add another item')
  })
  await page.waitForTimeout(400)
}

async function removeRow(index) {
  await frame.evaluate(({ index }) => {
    const keys = document.querySelectorAll('input[placeholder="Key"]')
    const inp = keys[index]
    if (!inp) return
    // Row container: climb to `.flex.mb-2` and find its trash button
    let row = inp
    for (let i = 0; i < 5 && row; i++) {
      if (row.classList && row.classList.contains('flex') && row.classList.contains('mb-2')) break
      row = row.parentElement
    }
    if (!row) return
    // Find the last button in the row (trash is at the end)
    const btns = Array.from(row.querySelectorAll('button'))
    const trash = btns[btns.length - 1]
    trash?.click()
  }, { index })
  await page.waitForTimeout(300)
}

async function saveAction() {
  await frame.evaluate(() => {
    const save = document.querySelector('#pg-actions__btn--save-action-webhook') ||
                 document.querySelector('button[data-test-id="aside-section__save-button"]')
    if (!save) throw new Error('no save button')
    save.click()
  })
  await page.waitForTimeout(2500)
}

async function updateAction(action) {
  console.log(`\n[${action.cardName}]`)
  await dismissModal()
  await openAction(action.cardName, action.exactMatchOnly)
  console.log('  panel opened')

  // Set URL
  await setValue('#webhook-url', WEBHOOK_URL)
  console.log('  url set')

  // Match row count to target
  const target = action.rows.length
  let current = await getRowCount()
  console.log(`  rows: current=${current} target=${target}`)

  // Trim excess rows from the END
  while (current > target) {
    await removeRow(current - 1)
    current = await getRowCount()
  }
  // Add missing rows
  while (current < target) {
    await addRow()
    current = await getRowCount()
  }
  console.log(`  rows synced: ${current}`)

  // Now overwrite each row
  for (let i = 0; i < target; i++) {
    const [k, v] = action.rows[i]
    await setValue('input[placeholder="Key"]', k, { index: i })
    await setValue('input[placeholder="Value"]', v, { index: i })
  }
  console.log(`  ${target} rows filled`)

  // Save
  await saveAction()
  console.log('  saved')
}

const results = []
for (const a of ACTIONS) {
  try {
    await updateAction(a)
    results.push({ action: a.cardName, ok: true })
  } catch (err) {
    console.error(`  FAIL: ${err.message}`)
    results.push({ action: a.cardName, ok: false, error: err.message })
    await dismissModal()
  }
  await page.waitForTimeout(800)
}

console.log('\nRESULTS:', JSON.stringify(results, null, 2))

// Save the WORKFLOW (action-panel save isn't enough — the workflow header save
// commits all action changes to the backend).
console.log('\n[workflow] saving via header Save button')
await page.waitForTimeout(1500)
const saveState = await frame.evaluate(() => {
  const btn = document.querySelector('#cmp-header__btn--save-workflow')
  if (!btn) return { clicked: false, reason: 'no save button' }
  const before = (btn.innerText || '').trim()
  btn.click()
  return { clicked: true, before }
})
console.log('  save click:', JSON.stringify(saveState))
await page.waitForTimeout(3500)
const afterState = await frame.evaluate(() => {
  const btn = document.querySelector('#cmp-header__btn--save-workflow')
  return { text: (btn?.innerText || '').trim(), disabled: btn?.disabled }
})
console.log('  after save:', JSON.stringify(afterState))

console.log('\nNOT clicking Publish. Review and publish manually.')
await browser.close()

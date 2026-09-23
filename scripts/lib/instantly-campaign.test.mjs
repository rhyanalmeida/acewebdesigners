import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { parseSequenceDoc, textToHtml, buildPayload, validateSteps, isThreaded } from './instantly-campaign.mjs'

const SAMPLE = `# heading

## Email 1 — Day 0 (hook)

**Subject:** quick question about {{company_name}}

Hi {{first_name}},

Line one
line two

{{demo_url}}

{{unsubscribe}}
[OWNER: physical postal address]

---

## Email 2 — Day 3 (threaded)

**Subject:** Re: quick question about {{company_name}}

Still here: {{demo_url}}

{{unsubscribe}}

---

## Owner review checklist
- [ ] stuff
`

describe('parseSequenceDoc', () => {
  it('extracts subject, day and trimmed plain-text body per email', () => {
    const steps = parseSequenceDoc(SAMPLE)
    expect(steps).toHaveLength(2)
    expect(steps[0]).toMatchObject({ n: 1, day: 0, subject: 'quick question about {{company_name}}' })
    expect(steps[0].body.startsWith('Hi {{first_name}},')).toBe(true)
    expect(steps[0].body.endsWith('[OWNER: physical postal address]')).toBe(true)
    expect(steps[1]).toMatchObject({ n: 2, day: 3, subject: 'Re: quick question about {{company_name}}' })
    expect(steps[1].body).toBe('Still here: {{demo_url}}\n\n{{unsubscribe}}')
  })
  it('parses the real approved draft: 4 emails on day 0/3/7/14, all with CTA + unsubscribe', () => {
    const md = fs.readFileSync(path.resolve(__dirname, '../../docs/OUTBOUND_COLD_SEQUENCE_DRAFT.md'), 'utf8')
    const steps = parseSequenceDoc(md)
    expect(steps.map((s) => s.day)).toEqual([0, 3, 7, 14])
    expect(validateSteps(steps).problems).toEqual([])
    expect(steps.filter((s) => s.body.includes('$49')).map((s) => s.n)).toEqual([3])
  })
  it('throws on a doc with no email sections', () => {
    expect(() => parseSequenceDoc('# nothing')).toThrow()
  })
})

describe('textToHtml', () => {
  it('turns blank-line paragraphs into <p>, keeps hard breaks, escapes html', () => {
    expect(textToHtml('Rhyan\nAce Web Designers\n\nc <d>')).toBe('<p>Rhyan<br/>Ace Web Designers</p><p>c &lt;d&gt;</p>')
  })
  it('unwraps soft-wrapped prose lines but keeps breaks before capitals, tags and placeholders', () => {
    expect(textToHtml('which usually\nmeans customers')).toBe('<p>which usually means customers</p>')
    expect(textToHtml('covers your own\n.com domain')).toBe('<p>covers your own .com domain</p>')
    expect(textToHtml('{{unsubscribe}}\n[OWNER: addr]')).toBe('<p>{{unsubscribe}}<br/>[OWNER: addr]</p>')
    expect(textToHtml('{{unsubscribe}}\n123 Main St\nBoston, MA')).toBe('<p>{{unsubscribe}}<br/>123 Main St<br/>Boston, MA</p>')
  })
  it('leaves merge tags intact', () => {
    expect(textToHtml('{{demo_url}}')).toBe('<p>{{demo_url}}</p>')
  })
})

describe('buildPayload', () => {
  const steps = parseSequenceDoc(SAMPLE)
  const p = buildPayload(steps, { daily: 7, accounts: ['a@x.com'] })
  it('uses relative day delays and empties threaded subjects', () => {
    const [s1, s2] = p.sequences[0].steps
    expect(s1).toMatchObject({ delay: 0, delay_unit: 'days' })
    expect(s1.variants[0].subject).toBe('quick question about {{company_name}}')
    expect(s2).toMatchObject({ delay: 3, delay_unit: 'days' })
    expect(s2.variants[0].subject).toBe('')
  })
  it('locks the deliverability-sensitive settings', () => {
    expect(p).toMatchObject({
      daily_limit: 7,
      email_list: ['a@x.com'],
      text_only: true,
      stop_on_reply: true,
      link_tracking: false,
      open_tracking: false,
      insert_unsubscribe_header: true,
    })
    expect(p.campaign_schedule.schedules[0].days).toEqual({ 0: false, 1: true, 2: true, 3: true, 4: true, 5: true, 6: false })
  })
  it('rejects a non-increasing day schedule', () => {
    expect(() => buildPayload([{ n: 1, day: 0, subject: 'a', body: '' }, { n: 2, day: 0, subject: 'b', body: '' }])).toThrow()
  })
})

describe('validateSteps / isThreaded', () => {
  it('flags missing CTA or unsubscribe and counts postal placeholders', () => {
    const r = validateSteps([{ n: 1, body: 'x [OWNER: addr]' }, { n: 2, body: '{{demo_url}} {{unsubscribe}}' }])
    expect(r.problems).toEqual(['Email 1: missing CTA ({{demo_url}} or a reply ask)', 'Email 1: missing {{unsubscribe}} link'])
    expect(validateSteps([{ n: 3, body: 'Just reply "yes" {{unsubscribe}}' }]).problems).toEqual([])
    expect(r.placeholders).toBe(1)
  })
  it('treats "Re:" (any case) as threaded', () => {
    expect(isThreaded('Re: hi')).toBe(true)
    expect(isThreaded('RE:hi')).toBe(true)
    expect(isThreaded('closing the file')).toBe(false)
  })
})

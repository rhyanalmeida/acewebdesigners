// End-to-end funnel verification helper.
//   node scripts/funnel-verify.mjs <step>
// steps:
//   slots                 — GET open contractor slots (proves slots/book deployed)
//   capi-infra            — POST /capi (secret) Lead w/ test code → prove Meta accepts (events_received)
//   lead <eventId>        — POST /lead live (fires CAPI Lead + GHL funnel-lead)
//   book <eventId> <iso>  — POST /book live for slot <iso> (fires CAPI Schedule + GHL booked + appt)
//   retry <eventId>       — POST /capi {retryEventId} (secret): deduped:true => that event is status=sent
import { readFileSync } from 'node:fs'

const env = {}
for (const line of readFileSync('supabase/.env', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (!m) continue
  env[m[1]] = m[2].replace(/\s+#.*$/, '').trim().replace(/^["']|["']$/g, '')
}

const URL = 'https://dwsmrruzufqpopdzlszw.supabase.co'
const ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3c21ycnV6dWZxcG9wZHpsc3p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5Mjc2MDAsImV4cCI6MjA5NjUwMzYwMH0.YvAjmUJoYWLJPFi24dNqZXgz_1p84npo_o1mvV84dl8'

// Real test target (the user confirms receipt). Contractor-attributed (fbclid) so it lands on pixel 4230021860577001.
const LEAD = {
  calendar: 'contractor',
  firstName: 'Rhyan',
  lastName: 'TestFunnel',
  email: 'rhyanalmeida31@gmail.com',
  phone: '+17743293117',
  city: 'Leominster',
  state: 'MA',
  zip: '01453',
  country: 'US',
  fbclid: 'verify_' + '20260622',
  fbp: 'fb.1.1780000000.1234567890',
  eventSourceUrl: 'https://acewebdesigners.com/contractorlanding?source=landing-contractors',
  landingUrl: 'https://acewebdesigners.com/contractorlanding?source=landing-contractors&fbclid=verify_20260622',
  utm: {
    utm_source: 'Facebook', utm_medium: 'verify', utm_campaign: 'Contractor Lead Gen — Free Website Offer',
    utm_content: 'e2e-verify', campaign_id: '120241554190170259', adset_id: '120242709687340259', ad_id: 'verify',
  },
}

const post = (path, body, headers = {}) =>
  fetch(`${URL}/functions/v1/${path}`, {
    method: 'POST',
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })

const step = process.argv[2]
const arg1 = process.argv[3]
const arg2 = process.argv[4]

if (step === 'slots') {
  const r = await fetch(`${URL}/functions/v1/slots?calendar=contractor`, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } })
  const j = await r.json()
  console.log('status', r.status)
  const slots = j.slots || []
  console.log('open slots:', slots.length)
  console.log('first 6:', slots.slice(0, 6).map((s) => s.startISO))
} else if (step === 'capi-infra') {
  const r = await post('capi', {
    eventName: 'Lead',
    eventId: 'infra_' + arg1,
    email: LEAD.email, phone: LEAD.phone, fbp: LEAD.fbp, fbclid: LEAD.fbclid,
    testEventCode: env.META_TEST_EVENT_CODE || 'TEST',
  }, { 'x-capi-secret': env.CAPI_INTERNAL_SECRET })
  console.log('status', r.status)
  console.log(JSON.stringify(await r.json(), null, 2))
} else if (step === 'lead') {
  const r = await post('lead', { ...LEAD, eventId: arg1 })
  console.log('status', r.status)
  console.log(JSON.stringify(await r.json(), null, 2))
} else if (step === 'book') {
  const r = await post('book', { ...LEAD, eventId: arg1, startISO: arg2, tz: 'America/New_York' })
  console.log('status', r.status)
  console.log(JSON.stringify(await r.json(), null, 2))
} else if (step === 'retry') {
  const r = await post('capi', { retryEventId: arg1 }, { 'x-capi-secret': env.CAPI_INTERNAL_SECRET })
  console.log('status', r.status)
  console.log(JSON.stringify(await r.json(), null, 2))
} else {
  console.log('unknown step:', step)
}

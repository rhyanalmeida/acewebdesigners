// Mints a short-lived admin session for hello@acewebdesigners.com (via the
// service_role key fetched from the Management API) and calls an admin Edge
// Function. Nothing sensitive is persisted; the service_role key + user JWT live
// only in memory for this run.
//   node scripts/funnel-admin.mjs whoami
//   node scripts/funnel-admin.mjs result <appointmentId> showed
//   node scripts/funnel-admin.mjs result <appointmentId> purchase <upfront> <recurring> <plan>
//   node scripts/funnel-admin.mjs discard-tests   — delete all is_test appointments + capi rows
const REF = 'dwsmrruzufqpopdzlszw'
const URL = `https://${REF}.supabase.co`
const ADMIN_EMAIL = 'hello@acewebdesigners.com'
const MGMT = process.env.SUPABASE_ACCESS_TOKEN
if (!MGMT) { console.error('SUPABASE_ACCESS_TOKEN not in env'); process.exit(1) }

async function keys() {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/api-keys?reveal=true`, {
    headers: { Authorization: `Bearer ${MGMT}` },
  })
  const arr = await r.json()
  const anon = arr.find((k) => k.name === 'anon')?.api_key
  const service = arr.find((k) => k.name === 'service_role')?.api_key
  return { anon, service }
}

async function mintSession(service, anon) {
  // 1) generate a magiclink OTP for the admin (service_role only)
  const g = await fetch(`${URL}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: { apikey: service, Authorization: `Bearer ${service}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'magiclink', email: ADMIN_EMAIL }),
  })
  const gj = await g.json()
  const otp = gj.email_otp || gj.properties?.email_otp
  if (!otp) throw new Error('no email_otp from generate_link: ' + JSON.stringify(gj).slice(0, 300))
  // 2) verify the OTP → session with access_token
  const v = await fetch(`${URL}/auth/v1/verify`, {
    method: 'POST',
    headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'magiclink', email: ADMIN_EMAIL, token: otp }),
  })
  const vj = await v.json()
  if (!vj.access_token) throw new Error('no access_token from verify: ' + JSON.stringify(vj).slice(0, 300))
  return vj.access_token
}

async function callFn(path, jwt, anon, body) {
  const r = await fetch(`${URL}/functions/v1/${path}`, {
    method: 'POST',
    headers: { apikey: anon, Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return { status: r.status, json: await r.json().catch(() => null) }
}

const cmd = process.argv[2]
const { anon, service } = await keys()
const jwt = await mintSession(service, anon)

if (cmd === 'whoami') {
  // hit admin-data (verify_jwt=true, requireAdmin) to confirm the session is admin
  const out = await callFn('admin-data', jwt, anon, {})
  console.log('admin-data status:', out.status)
  console.log('keys:', out.json ? Object.keys(out.json) : null)
} else if (cmd === 'result') {
  const appointmentId = process.argv[3]
  const result = process.argv[4]
  const body = { appointmentId, result }
  if (result === 'purchase') {
    body.upfront = Number(process.argv[5] ?? 1500)
    body.recurring = Number(process.argv[6] ?? 99)
    body.recurringInterval = 'monthly'
    body.plan = process.argv[7] ?? 'Pro Care'
  }
  const out = await callFn('result', jwt, anon, body)
  console.log('result status:', out.status)
  console.log(JSON.stringify(out.json, null, 2))
} else if (cmd === 'discard-tests') {
  const out = await callFn('admin-data', jwt, anon, { action: 'discardTests' })
  console.log('discard status:', out.status)
  console.log(JSON.stringify(out.json, null, 2))
} else {
  console.log('unknown cmd', cmd)
}

# End-to-end test of the deployed lead -> book funnel (test:true → Meta Test Events,
# skips GCal/GHL). Verifies: Lead + Schedule CAPI rows + durable contact attribution.
$ErrorActionPreference = 'Stop'
$token = $env:SUPABASE_ACCESS_TOKEN
$ref = 'dwsmrruzufqpopdzlszw'

$keys = Invoke-RestMethod -Method Get -Uri "https://api.supabase.com/v1/projects/$ref/api-keys?reveal=true" -Headers @{ Authorization = "Bearer $token" }
$anon = ($keys | Where-Object { $_.name -eq 'anon' }).api_key
$base = "https://$ref.supabase.co/functions/v1"
$hdr = @{ Authorization = "Bearer $anon"; apikey = $anon; 'Content-Type' = 'application/json' }

$eid = 'e2e_' + [int][double]::Parse((Get-Date -UFormat %s))
$url = 'https://acewebdesigners.com/contractorlanding?fbclid=e2e_fbclid_123&utm_source=Facebook&utm_medium=AdSetName&utm_campaign=CampName&utm_content=AdName&campaign_id=111&adset_id=222&ad_id=333'
$utm = @{ utm_source = 'Facebook'; utm_medium = 'AdSetName'; utm_campaign = 'CampName'; utm_content = 'AdName'; campaign_id = '111'; adset_id = '222'; ad_id = '333' }
$email = "$eid@example.com"

# pick a far-future, randomized slot to avoid the appointments unique index
$start = (Get-Date).ToUniversalTime().AddDays(90).AddMinutes((Get-Random -Maximum 100000))
$startISO = $start.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$endISO = $start.AddMinutes(30).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")

Write-Output '=== LEAD ==='
$leadBody = @{ calendar = 'contractor'; firstName = 'E2E'; lastName = 'Tester'; email = $email; phone = '7745551234'; fbclid = 'e2e_fbclid_123'; eventId = ($eid + '_lead'); eventSourceUrl = $url; landingUrl = $url; utm = $utm; test = $true } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$base/lead" -Headers $hdr -Body $leadBody | ConvertTo-Json -Depth 6

Write-Output '=== BOOK (Schedule) ==='
$bookBody = @{ calendar = 'contractor'; startISO = $startISO; endISO = $endISO; tz = 'America/New_York'; firstName = 'E2E'; lastName = 'Tester'; email = $email; phone = '7745551234'; fbclid = 'e2e_fbclid_123'; eventId = ($eid + '_sched'); eventSourceUrl = $url; landingUrl = $url; utm = $utm; test = $true } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$base/book" -Headers $hdr -Body $bookBody | ConvertTo-Json -Depth 6

Start-Sleep -Seconds 2

Write-Output '=== capi_events for this test ==='
$sql = "select event_id, event_name, action_source, status, is_test, (meta_response->>'events_received') received from capi_events where event_id like '$eid%' order by sent_at;"
$body = @{ query = $sql } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "https://api.supabase.com/v1/projects/$ref/database/query" -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $body | ConvertTo-Json -Depth 6

Write-Output '=== contact attribution row ==='
$sql2 = "select first_name, last_name, email, phone, fbclid, client_ip, client_user_agent, landing_url, utm from contacts where email = '$email';"
$body2 = @{ query = $sql2 } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "https://api.supabase.com/v1/projects/$ref/database/query" -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $body2 | ConvertTo-Json -Depth 6

Write-Output "=== cleanup (remove this test contact + its appointments/events) ==="
$sql3 = "delete from contacts where email = '$email';"
$body3 = @{ query = $sql3 } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "https://api.supabase.com/v1/projects/$ref/database/query" -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $body3 | Out-Null
Write-Output "deleted test contact $email (appointments cascade; capi_events.contact_id set null)"

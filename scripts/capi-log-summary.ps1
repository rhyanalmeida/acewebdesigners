param(
  [string]$Sql = @"
select event_name,
       action_source,
       count(*) as total,
       count(*) filter (where is_test) as test_rows,
       count(*) filter (where status='sent') as sent,
       count(*) filter (where status='failed') as failed,
       count(*) filter (where status='pending') as pending,
       count(*) filter (where events_received>=1) as confirmed,
       max(created_at) as last_event
from capi_events
group by event_name, action_source
order by event_name;
"@
)

$token = $env:SUPABASE_ACCESS_TOKEN
if (-not $token) { Write-Error "SUPABASE_ACCESS_TOKEN not set"; exit 1 }
$ref = "dwsmrruzufqpopdzlszw"
$body = @{ query = $Sql } | ConvertTo-Json

try {
  $r = Invoke-RestMethod -Method Post `
    -Uri "https://api.supabase.com/v1/projects/$ref/database/query" `
    -Headers @{ Authorization = "Bearer $token" } `
    -ContentType "application/json" -Body $body
  $r | ConvertTo-Json -Depth 8
} catch {
  Write-Output ("ERR: " + $_.Exception.Message)
  if ($_.ErrorDetails.Message) { Write-Output $_.ErrorDetails.Message }
}

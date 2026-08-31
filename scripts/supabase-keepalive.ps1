# Supabase keep-alive — daily ping of the public `slots` Edge Function so the free-tier
# project (dwsmrruzufqpopdzlszw) never auto-pauses again (it sat INACTIVE ~early-Aug → 8/30
# and killed the booking funnel). Registered as the "Supabase Keep-Alive" scheduled task
# (see docs/OUTBOUND_LAUNCH_PLAN_2026-08-30.md Phase 1).
#
# The anon key is the same public value shipped in the client bundle (RLS-protected) — not a secret.

$Url = 'https://dwsmrruzufqpopdzlszw.supabase.co/functions/v1/slots?calendar=contractor'
$Anon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3c21ycnV6dWZxcG9wZHpsc3p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5Mjc2MDAsImV4cCI6MjA5NjUwMzYwMH0.YvAjmUJoYWLJPFi24dNqZXgz_1p84npo_o1mvV84dl8'
$LogPath = Join-Path $env:LOCALAPPDATA 'supabase-keepalive.log'

try {
  $r = Invoke-WebRequest -Uri $Url -Headers @{ apikey = $Anon; Authorization = "Bearer $Anon" } -UseBasicParsing -TimeoutSec 60
  $line = "$(Get-Date -Format o) OK $($r.StatusCode) bytes=$($r.Content.Length)"
} catch {
  $line = "$(Get-Date -Format o) FAIL $($_.Exception.Message)"
}

Add-Content -Path $LogPath -Value $line
# Keep the log from growing unbounded — retain the last 90 lines.
$log = Get-Content $LogPath
if ($log.Count -gt 90) { $log | Select-Object -Last 90 | Set-Content $LogPath }
Write-Output $line

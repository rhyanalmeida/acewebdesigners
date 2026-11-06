# install-auto-wave-task.ps1 — register the Windows scheduled task "Ace Auto Wave".
#
#   powershell -ExecutionPolicy Bypass -File scripts\install-auto-wave-task.ps1            # install / update
#   powershell -ExecutionPolicy Bypass -File scripts\install-auto-wave-task.ps1 -Remove    # uninstall
#
# Runs `node scripts/auto-wave.mjs --auto` every 2 hours, weekdays 06:00–20:00 (the scrape needs this PC awake
# with a real browser — Edge functions can't). Each tick refreshes the /admin "Lead pipeline" numbers and runs a
# wave ONLY when /admin queued one ("Scrape a new list") or the restaurant pool is below 7 send-days.
# Wrapped in run-hidden.vbs so no console window flashes (owner rule, see memory "scheduled-tasks-run-hidden").
# Output → leads\waves\auto-wave.log. SUPABASE_ACCESS_TOKEN is a user env var, so the task inherits it.
param([switch]$Remove)
$ErrorActionPreference = 'Stop'
$name = 'Ace Auto Wave'
$root = Split-Path -Parent $PSScriptRoot
$vbs = 'C:\Users\rhyan\Scripts\run-hidden.vbs'
$node = (Get-Command node).Source
$log = Join-Path $root 'leads\waves\auto-wave.log'
New-Item -ItemType Directory -Force (Split-Path $log) | Out-Null

if ($Remove) { Unregister-ScheduledTask -TaskName $name -Confirm:$false -ErrorAction SilentlyContinue; Write-Host "removed $name"; exit 0 }
if (-not (Test-Path $vbs)) { throw "run-hidden.vbs not found at $vbs" }

# cmd wrapper so stdout/stderr land in the log (run-hidden.vbs runs the command with window style 0)
$cmd = "cmd.exe"
$cmdArgs = "/c cd /d `"$root`" && `"$node`" scripts\auto-wave.mjs --auto >> `"$log`" 2>&1"
$action = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument "`"$vbs`" `"$cmd`" `"$cmdArgs`""
$triggers = @()
foreach ($h in 6, 8, 10, 12, 14, 16, 18, 20) {
  $triggers += New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday, Tuesday, Wednesday, Thursday, Friday -At ("{0:00}:00" -f $h)
}
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Hours 3) -MultipleInstances IgnoreNew -StartWhenAvailable -RunOnlyIfNetworkAvailable
Register-ScheduledTask -TaskName $name -Action $action -Trigger $triggers -Settings $settings -Description 'Ace Web Designers: lead-wave runner (scripts/auto-wave.mjs --auto) — refreshes /admin Lead pipeline, scrapes a new restaurant list when low or requested.' -Force | Out-Null
Write-Host "installed '$name' — weekdays every 2h 06:00–20:00, hidden; log: $log"
Write-Host "test it now:  Start-ScheduledTask -TaskName '$name'; then Get-ScheduledTaskInfo -TaskName '$name' | select LastTaskResult"

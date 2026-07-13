# Hourly preview-website builder (Windows Task Scheduler -> Claude Code headless).
# Builds queued booking preview sites via scripts/preview-site-builder-prompt.md.
# Uses the owner's Claude subscription (no API key). Logs to %LOCALAPPDATA%\ace-preview-builder.
$ErrorActionPreference = 'Continue'
$work = Join-Path $env:LOCALAPPDATA 'ace-preview-builder'
New-Item -ItemType Directory -Force -Path $work | Out-Null
$log = Join-Path $work 'builder.log'
Set-Location $work
"`n===== run $(Get-Date -Format o) =====" | Out-File -Append -Encoding utf8 $log
# Prompt is piped via stdin: passing it as an argument mangles/truncates it at the
# embedded double quotes (PowerShell native-arg quoting).
Get-Content -Raw 'C:\Projects\acewebdesigners\scripts\preview-site-builder-prompt.md' |
  & claude -p --model sonnet --allowedTools "Bash,Read,Write,Edit,Glob,Grep" 2>&1 |
  Out-File -Append -Encoding utf8 $log
"===== exit $LASTEXITCODE $(Get-Date -Format o) =====" | Out-File -Append -Encoding utf8 $log

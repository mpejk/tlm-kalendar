# Windows. Run from the project folder:   powershell -ExecutionPolicy Bypass -File start.ps1
Set-Location -Path $PSScriptRoot

$prompt = 'Continue the job described in CLAUDE.md in this folder. If PLAN.md and RUNLOG.md exist, read them and carry on from the first unfinished item. Work without asking anything and do not stop until the file DONE exists.'
$flags = @('--permission-mode', 'auto', '--permission-prompts', 'none')

if (-not (Test-Path 'CLAUDE.md')) { Write-Host 'CANNOT START: CLAUDE.md is not in this folder.'; exit 1 }
if (-not (Get-Command claude -ErrorAction SilentlyContinue)) { Write-Host 'CANNOT START: the claude command was not found.'; exit 1 }

# Keep the PC awake while it is plugged in. (Sets sleep-on-power to Never; change it back in Settings > System > Power.)
powercfg /change standby-timeout-ac 0
powercfg /change hibernate-timeout-ac 0

Write-Host 'Preflight: checking that Claude Code can work unattended here...'
if (Test-Path 'PREFLIGHT_OK') { Remove-Item 'PREFLIGHT_OK' }
$out = & claude -p 'Create a file named PREFLIGHT_OK in the current folder containing the word ok, using a shell command. Then reply with the single word ok.' @flags 2>&1 | Out-String
if (-not (Test-Path 'PREFLIGHT_OK')) {
  Write-Host 'CANNOT START: Claude Code could not run a command unattended. Its answer was:'
  Write-Host $out
  exit 1
}
Remove-Item 'PREFLIGHT_OK'
Write-Host 'STARTED. Leave this window open, the laptop plugged in and the lid open.'

$short = 0
for ($i = 1; $i -le 500; $i++) {
  if ((Test-Path 'DONE') -or (Test-Path 'STOP')) { break }
  $t0 = Get-Date
  Write-Host ('--- run {0}, {1}' -f $i, $t0)
  & claude -p $prompt @flags --output-format stream-json --verbose | Tee-Object -FilePath 'run.log' -Append
  $secs = ((Get-Date) - $t0).TotalSeconds
  # A run that ends within two minutes did no real work (usually a usage limit). After three, wait half an hour.
  if ($secs -lt 120) { $short++ } else { $short = 0 }
  if ($short -ge 3) { Start-Sleep -Seconds 1800 } else { Start-Sleep -Seconds 30 }
}

if (Test-Path 'DONE') {
  Write-Host 'FINISHED. Open REPORT.md.'
  Get-Content 'DONE'
} elseif (Test-Path 'STOP') {
  Write-Host 'STOPPED. Reason:'
  Get-Content 'STOP'
} else {
  Write-Host 'Run limit reached. Start the script again to continue.'
}

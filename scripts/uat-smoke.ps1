param(
  [string]$Url = "http://127.0.0.1:3000/",
  [string]$OutDir = ".uat-reports/current"
)

$ErrorActionPreference = "Stop"

$reportDir = Join-Path (Get-Location) $OutDir
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$domPath = Join-Path $reportDir "dom.html"

$dom = (Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 20).Content
Set-Content -Path $domPath -Value $dom -Encoding UTF8

$checks = @(
  @{ Name = "App title"; Pass = $dom -match "HK Property Design" },
  @{ Name = "No runtime error"; Pass = $dom -notmatch "Application error|Runtime Error|Cannot find module|Unhandled Runtime Error" }
)

$failed = $checks | Where-Object { -not $_.Pass }

Write-Host "UAT smoke check for $Url"
foreach ($check in $checks) {
  Write-Host (" - {0}: {1}" -f $check.Name, ($(if ($check.Pass) { "PASS" } else { "FAIL" })))
}
Write-Host "DOM saved to $domPath"

if ($failed.Count -gt 0) {
  throw ("Smoke UAT failed: " + (($failed | ForEach-Object Name) -join ", "))
}

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot

Write-Host "Refreshing the Hunter Power Index snapshot..."
& npm.cmd run refresh:hunter
if ($LASTEXITCODE -ne 0) {
    throw "Market Data refresh failed. The previous snapshot was preserved."
}

& git.exe add -- "data/hunter-power-snapshot.json"
& git.exe diff --cached --quiet -- "data/hunter-power-snapshot.json"
if ($LASTEXITCODE -eq 0) {
    Write-Host "The snapshot is already current. Nothing to commit."
    exit 0
}

$snapshot = Get-Content -Raw -Encoding UTF8 "data/hunter-power-snapshot.json" | ConvertFrom-Json
$dataDate = $snapshot.data.dataDate
& git.exe commit --only "data/hunter-power-snapshot.json" -m "Update Hunter Power Index $dataDate"
if ($LASTEXITCODE -ne 0) {
    throw "The snapshot was generated, but the Git commit failed."
}

& git.exe push origin main
if ($LASTEXITCODE -ne 0) {
    throw "The snapshot was committed, but the GitHub push failed."
}

Write-Host "Refresh complete for $dataDate. Vercel will deploy automatically."

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot

Write-Host "正在更新 Hunter Power Index 真实数据快照..."
& npm.cmd run refresh:hunter
if ($LASTEXITCODE -ne 0) {
    throw "Market Data 更新失败，旧快照已保留。"
}

& git.exe add -- "data/hunter-power-snapshot.json"
& git.exe diff --cached --quiet -- "data/hunter-power-snapshot.json"
if ($LASTEXITCODE -eq 0) {
    Write-Host "当前已经是最新数据，不需要提交。"
    exit 0
}

$snapshot = Get-Content -Raw -Encoding UTF8 "data/hunter-power-snapshot.json" | ConvertFrom-Json
$dataDate = $snapshot.data.dataDate
& git.exe commit --only "data/hunter-power-snapshot.json" -m "Update Hunter Power Index $dataDate"
if ($LASTEXITCODE -ne 0) {
    throw "快照已生成，但 Git 提交失败。"
}

& git.exe push origin main
if ($LASTEXITCODE -ne 0) {
    throw "快照已提交，但推送 GitHub 失败。"
}

Write-Host "更新完成：$dataDate。Vercel 将自动部署。"

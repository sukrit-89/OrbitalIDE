$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$clientDir = Join-Path $repoRoot 'client'
$serverDir = Join-Path $repoRoot 'server'

if (-not (Test-Path (Join-Path $clientDir 'package.json'))) {
  throw "Client package.json not found at: $clientDir"
}

if (-not (Test-Path (Join-Path $serverDir 'package.json'))) {
  throw "Server package.json not found at: $serverDir"
}

Write-Host "Starting Orbital IDE local development..." -ForegroundColor Cyan
Write-Host "Client: $clientDir" -ForegroundColor Gray
Write-Host "Server: $serverDir" -ForegroundColor Gray

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$clientDir'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$serverDir'; npm start"

Write-Host "Opened two terminals:" -ForegroundColor Green
Write-Host " - Frontend: npm run dev" -ForegroundColor Green
Write-Host " - Backend: npm start" -ForegroundColor Green

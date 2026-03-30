param(
  [string]$BaseUrl = "http://localhost:3001",
  [int]$TimeoutSec = 120
)

$ErrorActionPreference = 'Stop'

$compileSource = @'
#![no_std]
use soroban_sdk::{contract, contractimpl, Env};

#[contract]
pub struct SmokeContract;

#[contractimpl]
impl SmokeContract {
    pub fn ping(_env: Env) -> u32 {
        1
    }
}
'@

Write-Host "Backend smoke check against: $BaseUrl" -ForegroundColor Cyan

$healthUrl = "$BaseUrl/health"
$compileUrl = "$BaseUrl/compile"

try {
  $health = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 15
} catch {
  throw "Health check request failed at $healthUrl. Start backend first (`cd server; npm start`) and retry. Original error: $($_.Exception.Message)"
}

if (-not $health.ready) {
  throw "Health check failed: backend is not ready. Response status=$($health.status)"
}

Write-Host "Health OK: rust=$($health.rust), wasmTarget=$($health.wasmTarget)" -ForegroundColor Green

$payload = @{ source = $compileSource } | ConvertTo-Json -Depth 5

try {
  $compile = Invoke-RestMethod -Uri $compileUrl -Method Post -ContentType "application/json" -Body $payload -TimeoutSec $TimeoutSec
} catch {
  throw "Compile check request failed at $compileUrl. Verify Rust/Cargo/wasm toolchain and server logs, then retry. Original error: $($_.Exception.Message)"
}

if (-not $compile.wasm) {
  throw "Compile check failed: response has no wasm payload"
}

$size = [int]$compile.size
$compiledIn = [int]$compile.compiledIn

if ($size -le 0) {
  throw "Compile check failed: wasm size is invalid ($size)"
}

Write-Host "Compile OK: wasmSize=$size bytes, compiledIn=${compiledIn}ms" -ForegroundColor Green
Write-Host "Backend smoke check passed." -ForegroundColor Green

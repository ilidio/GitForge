# GitForge Test Script for PowerShell
$ErrorActionPreference = "Stop"

Write-Host "Running Client Tests..." -ForegroundColor Cyan
Set-Location gitforge-client
npm test -- --run
Set-Location ..

Write-Host "`nRunning Server Tests..." -ForegroundColor Cyan
Set-Location gitforge-server.Tests
dotnet test
Set-Location ..

Write-Host "`n✅ All tests passed!" -ForegroundColor Green

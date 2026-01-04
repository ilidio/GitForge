# GitForge Installation Script for Windows
# This script sets up the environment for running GitForge locally.

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting GitForge Setup..." -ForegroundColor Cyan

# 1. Check for Prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Cyan

function Check-Command($Command) {
    if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
        Write-Error "❌ $Command is not installed. Please install it."
        exit 1
    }
}

Check-Command "git"
Check-Command "node"
Check-Command "dotnet"

# Check for git-graph (Optional but recommended)
if (-not (Get-Command "git-graph" -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  'git-graph' CLI is not found." -ForegroundColor Yellow
    Write-Host "   Please ensure 'git-graph' is in your PATH for the best experience."
} else {
    Write-Host "✅ git-graph is installed." -ForegroundColor Green
}

# 2. Install Frontend Dependencies
Write-Host "📦 Installing Frontend Dependencies (gitforge-client)..." -ForegroundColor Cyan
Set-Location gitforge-client
npm install
Set-Location ..

# 3. Restore Backend Dependencies
Write-Host "📦 Restoring Backend Dependencies (gitforge-server)..." -ForegroundColor Cyan
Set-Location gitforge-server
dotnet restore
Set-Location ..

Write-Host "`n🎉 Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the application, run:"
Write-Host "  cd gitforge-client; npm run dev"

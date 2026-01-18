# Building GitForge Server for Windows (x64)
$ErrorActionPreference = "Stop"

Write-Host "Building GitForge Server for Windows (x64)..." -ForegroundColor Cyan

# Define paths
$SERVER_PROJECT = ".\gitforge-server\GitForge.Server.csproj"
$OUTPUT_DIR = ".\gitforge-client\server-dist"

# Clean previous build
if (Test-Path $OUTPUT_DIR) {
    Remove-Item -Path $OUTPUT_DIR -Recurse -Force
}

# Publish self-contained single-file executable
dotnet publish $SERVER_PROJECT `
  -c Release `
  -r win-x64 `
  --self-contained true `
  -p:PublishSingleFile=true `
  -p:DebugType=embedded `
  -o $OUTPUT_DIR

Write-Host "`n✅ Build complete. Server binary is located at $OUTPUT_DIR\GitForge.Server.exe" -ForegroundColor Green

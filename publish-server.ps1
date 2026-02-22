# publish-server.ps1
# A script to publish the GitForge .NET server sidecar.
$ErrorActionPreference = "Stop"

param (
    [string]$TargetOS = "win",
    [string]$TargetArch = "x64"
)

$DotnetOS = $TargetOS
if ($TargetOS -eq "mac") { $DotnetOS = "osx" }

$DotnetArch = $TargetArch
if ($TargetArch -eq "ia32") { $DotnetArch = "x86" }

$DotnetRID = "$DotnetOS-$DotnetArch"
$OutputDir = ".\gitforge-client\server-dist\$TargetOS"

Write-Host "Publishing GitForge Server for $DotnetRID..." -ForegroundColor Cyan
Write-Host "Output directory: $OutputDir" -ForegroundColor Gray

# Publish self-contained single-file executable
dotnet publish ".\gitforge-server\GitForge.Server.csproj" `
  -c Release `
  -r $DotnetRID `
  --self-contained true `
  -p:PublishSingleFile=true `
  -p:IncludeNativeLibrariesForSelfExtract=true `
  -p:DebugType=embedded `
  -o $OutputDir

Write-Host "`n✅ Build complete. Server binary is located at $OutputDir" -ForegroundColor Green

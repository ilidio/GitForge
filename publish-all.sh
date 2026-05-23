#!/bin/bash
set -e

echo "🚀 Starting Full GitForge Build..."

# 1. Build Server for all platforms
echo "📦 Building Server binaries..."

# Clean up server-dist folder first
rm -rf ./gitforge-client/server-dist

# macOS (arm64 & x64)
dotnet publish ./gitforge-server/GitForge.Server.csproj -c Release -r osx-arm64 --self-contained true -p:PublishSingleFile=true -p:PublishTrimmed=true -o ./gitforge-client/server-dist/mac/arm64
dotnet publish ./gitforge-server/GitForge.Server.csproj -c Release -r osx-x64 --self-contained true -p:PublishSingleFile=true -p:PublishTrimmed=true -o ./gitforge-client/server-dist/mac/x64

# Windows (arm64, x64, & ia32)
dotnet publish ./gitforge-server/GitForge.Server.csproj -c Release -r win-arm64 --self-contained true -p:PublishSingleFile=true -p:PublishTrimmed=true -o ./gitforge-client/server-dist/win/arm64
dotnet publish ./gitforge-server/GitForge.Server.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:PublishTrimmed=true -o ./gitforge-client/server-dist/win/x64
dotnet publish ./gitforge-server/GitForge.Server.csproj -c Release -r win-x86 --self-contained true -p:PublishSingleFile=true -p:PublishTrimmed=true -o ./gitforge-client/server-dist/win/ia32

# Linux (arm64 & x64)
dotnet publish ./gitforge-server/GitForge.Server.csproj -c Release -r linux-arm64 --self-contained true -p:PublishSingleFile=true -p:PublishTrimmed=true -o ./gitforge-client/server-dist/linux/arm64
dotnet publish ./gitforge-server/GitForge.Server.csproj -c Release -r linux-x64 --self-contained true -p:PublishSingleFile=true -p:PublishTrimmed=true -o ./gitforge-client/server-dist/linux/x64

# 2. Package with Electron Builder
echo "🏗️ Packaging Application..."
cd gitforge-client
npm run build
npx electron-builder --mac --x64 --arm64
npx electron-builder --win --x64 --arm64 --ia32
npx electron-builder --linux --x64 --arm64

echo "✅ All platforms built successfully!"

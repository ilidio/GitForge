#!/bin/bash
set -e

echo "🚀 Starting Full GitForge Build..."

# 1. Build Server for all platforms
echo "📦 Building Server binaries..."

# macOS (arm64)
dotnet publish ./gitforge-server/GitForge.Server.csproj -c Release -r osx-arm64 --self-contained true -p:PublishSingleFile=true -p:PublishTrimmed=true -o ./gitforge-client/server-dist/mac

# Windows (x64)
dotnet publish ./gitforge-server/GitForge.Server.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:PublishTrimmed=true -o ./gitforge-client/server-dist/win

# Linux (x64)
dotnet publish ./gitforge-server/GitForge.Server.csproj -c Release -r linux-x64 --self-contained true -p:PublishSingleFile=true -p:PublishTrimmed=true -o ./gitforge-client/server-dist/linux

# 2. Package with Electron Builder
echo "🏗️ Packaging Application..."
cd gitforge-client
npm run build
npx electron-builder --mac --win --linux

echo "✅ All platforms built successfully!"

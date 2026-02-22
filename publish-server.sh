#!/bin/bash
set -e

# publish-server.sh
# A script to publish the GitForge .NET server sidecar.

TARGET_OS=${1:-"mac"} # Default to mac for backward compatibility or host detection
TARGET_ARCH=${2:-"arm64"}

case "$TARGET_OS" in
    mac)   DOTNET_OS="osx" ;;
    win)   DOTNET_OS="win" ;;
    linux) DOTNET_OS="linux" ;;
    *)     echo "Unknown OS: $TARGET_OS"; exit 1 ;;
esac

case "$TARGET_ARCH" in
    x64)   DOTNET_ARCH="x64" ;;
    arm64) DOTNET_ARCH="arm64" ;;
    ia32)  DOTNET_ARCH="x86" ;;
    *)     echo "Unknown Arch: $TARGET_ARCH"; exit 1 ;;
esac

DOTNET_RID="${DOTNET_OS}-${DOTNET_ARCH}"
OUTPUT_DIR="./gitforge-client/server-dist/$TARGET_OS"

echo "Publishing GitForge Server for $DOTNET_RID..."
echo "Output directory: $OUTPUT_DIR"

# Publish self-contained single-file executable
dotnet publish "./gitforge-server/GitForge.Server.csproj" \
  -c Release \
  -r "$DOTNET_RID" \
  --self-contained true \
  -p:PublishSingleFile=true \
  -p:IncludeNativeLibrariesForSelfExtract=true \
  -p:DebugType=embedded \
  -o "$OUTPUT_DIR"

echo "Build complete. Server binary is located at $OUTPUT_DIR"

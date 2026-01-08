#!/bin/bash
set -e

echo "Building GitForge Server for macOS (arm64)..."

# Define paths
SERVER_PROJECT="./gitforge-server/GitForge.Server.csproj"
OUTPUT_DIR="./gitforge-client/server-dist"

# Clean previous build
rm -rf "$OUTPUT_DIR"

# Publish self-contained single-file executable
dotnet publish "$SERVER_PROJECT" \
  -c Release \
  -r osx-arm64 \
  --self-contained true \
  -p:PublishSingleFile=true \
  -p:DebugType=embedded \
  -o "$OUTPUT_DIR"

echo "Build complete. Server binary is located at $OUTPUT_DIR/GitForge.Server"

#!/bin/bash

# GitForge Development Entry Point
# This script starts the frontend, electron, and the backend sidecar.

set -e

echo "🚀 Starting GitForge Development Environment..."

# 1. Check if node_modules exists, if not, suggest setup
if [ ! -d "gitforge-client/node_modules" ]; then
    echo "⚠️  node_modules not found in gitforge-client."
    echo "📦 Running ./setup.sh for you..."
    ./setup.sh
fi

# 2. Start the development process
# The 'npm run dev' in gitforge-client is configured to:
# - Start Next.js (port 3000)
# - Wait for it to be ready
# - Launch Electron
# - Electron's main.js will then spawn the .NET sidecar (port 5030)
echo "📂 Navigating to gitforge-client and starting dev mode..."
cd gitforge-client
npm run dev

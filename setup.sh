#!/bin/bash

# GitForge Installation Script
# This script sets up the environment for running GitForge locally.

set -e

echo "🚀 Starting GitForge Setup..."

# 1. Check for Prerequisites
echo "🔍 Checking prerequisites..."

if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v18+)."
    exit 1
fi

if ! command -v dotnet &> /dev/null; then
    echo "❌ .NET SDK is not installed. Please install .NET 10 SDK."
    exit 1
fi

# Check for git-graph (Optional but recommended)
if ! command -v git-graph &> /dev/null; then
    echo "⚠️  'git-graph' CLI is not found."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            echo "🍺 Installing git-graph via Homebrew..."
            brew install git-graph
        else
            echo "   Please install Homebrew or manually install git-graph for Terminal View."
        fi
    else
        echo "   Please ensure 'git-graph' is in your PATH for the best experience."
    fi
else
    echo "✅ git-graph is installed."
fi

# 2. Install Frontend Dependencies
echo "📦 Installing Frontend Dependencies (gitforge-client)..."
cd gitforge-client
npm install
cd ..

# 3. Restore Backend Dependencies
echo "📦 Restoring Backend Dependencies (gitforge-server)..."
cd gitforge-server
dotnet restore
cd ..

echo "🎉 Setup Complete!"
echo ""
echo "To start the application, run:"
echo "  cd gitforge-client && npm run dev"
echo ""

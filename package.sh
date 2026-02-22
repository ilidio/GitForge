#!/bin/bash

# package.sh
# This script builds the Electron application for various platforms and architectures.

# --- Helper Functions ---

# Function to get host OS and architecture, mapping to electron-builder compatible strings
get_host_os_and_arch() {
    HOST_OS_RAW=$(uname -s)
    HOST_ARCH_RAW=$(uname -m)

    case "$HOST_OS_RAW" in
        Linux)
            HOST_OS="linux"
            ;;
        Darwin)
            HOST_OS="mac"
            ;;
        CYGWIN*|MINGW*|MSYS*)
            HOST_OS="win"
            ;;
        *)
            echo "Warning: Unknown host OS: $HOST_OS_RAW. Defaulting to linux." >&2
            HOST_OS="linux"
            ;;
    esac

    case "$HOST_ARCH_RAW" in
        x86_64)
            HOST_ARCH="x64"
            ;;
        arm64|aarch64)
            HOST_ARCH="arm64"
            ;;
        i386|i686)
            HOST_ARCH="ia32" # electron-builder uses ia32 for 32-bit x86
            ;;
        *)
            echo "Warning: Unknown host architecture: $HOST_ARCH_RAW. Defaulting to x64." >&2
            HOST_ARCH="x64"
            ;;
    esac

    echo "Detected Host OS: $HOST_OS_RAW ($HOST_OS), Host Arch: $HOST_ARCH_RAW ($HOST_ARCH)" >&2
}

# Function to display help message
display_help() {
    echo "Usage: $0 [TARGET_OS] [TARGET_ARCH]"
    echo ""
    echo "Builds the Electron application for the specified target OS and architecture."
    echo "If TARGET_OS or TARGET_ARCH are omitted, they will default to the host system's values."
    echo ""
    echo "Arguments:"
    echo "  TARGET_OS    The target operating system. Possible values: win, mac, linux"
    echo "  TARGET_ARCH  The target architecture. Possible values: x64, arm64, ia32"
    echo ""
    echo "Examples:"
    echo "  $0                  # Build for the current host OS and architecture"
    echo "  $0 mac              # Build for macOS (using host architecture)"
    echo "  $0 linux x64        # Build for Linux (x64)"
    echo "  $0 win arm64        # Build for Windows (ARM64)"
    echo "  $0 mac arm64        # Build for macOS (ARM64)"
    echo ""
    echo "Cross-compilation Notes:"
    echo "  - Building macOS apps (.dmg, .pkg) generally requires a macOS host."
    echo "  - Building Windows apps (.exe, .msi) can be done from any host, but native tools might be required for full features."
    echo "  - Building Linux apps (.AppImage, .deb, .rpm, .snap) can be done from any host."
    echo "  - Ensure you have the necessary build dependencies installed for cross-compilation (e.g., Wine for Windows from Linux)."
    echo ""
}

# --- Main Script Logic ---

# Get host OS and architecture first
get_host_os_and_arch

# Check for help argument
if [[ "$1" == "help" || "$1" == "-h" || "$1" == "--help" ]]; then
    display_help
    exit 0
fi

# Determine TARGET_OS and TARGET_ARCH
TARGET_OS=${1:-$HOST_OS}
TARGET_ARCH=${2:-$HOST_ARCH}

echo "Building for Target OS: $TARGET_OS, Target Arch: $TARGET_ARCH"

# Map TARGET_OS and TARGET_ARCH to .NET RID
case "$TARGET_OS" in
    mac)
        DOTNET_OS="osx"
        ;;
    win)
        DOTNET_OS="win"
        ;;
    linux)
        DOTNET_OS="linux"
        ;;
    *)
        echo "Error: Invalid TARGET_OS '$TARGET_OS' for .NET publish."
        exit 1
        ;;
esac

case "$TARGET_ARCH" in
    x64)
        DOTNET_ARCH="x64"
        ;;
    arm64)
        DOTNET_ARCH="arm64"
        ;;
    ia32)
        DOTNET_ARCH="x86"
        ;;
    *)
        echo "Error: Invalid TARGET_ARCH '$TARGET_ARCH' for .NET publish."
        exit 1
        ;;
esac

DOTNET_RID="${DOTNET_OS}-${DOTNET_ARCH}"
echo "Mapped .NET RID: $DOTNET_RID"

# Validation for .NET RIDs (e.g., macOS doesn't support x86 in modern .NET)
if [[ "$DOTNET_OS" == "osx" && "$DOTNET_ARCH" == "x86" ]]; then
    echo "Error: .NET does not support osx-x86. Use x64 or arm64 for macOS."
    exit 1
fi

# Cleanup previous build artifacts
echo "Cleaning up previous build artifacts..."
rm -rf gitforge-client/dist
rm -rf gitforge-client/.next/cache
rm -rf gitforge-client/out
rm -rf gitforge-client/server-dist
rm -rf gitforge-client/node_modules/.cache
rm -rf dist

# Build the .NET server sidecar
echo "Building .NET server sidecar for $DOTNET_RID..."
SERVER_OUTPUT_DIR="gitforge-client/server-dist/$TARGET_OS"
mkdir -p "$SERVER_OUTPUT_DIR"

dotnet publish gitforge-server/GitForge.Server.csproj \
    -c Release \
    -r "$DOTNET_RID" \
    --self-contained true \
    -p:PublishSingleFile=true \
    -p:DebugType=embedded \
    -o "$SERVER_OUTPUT_DIR"

if [ $? -ne 0 ]; then
    echo ".NET server build failed!"
    exit 1
fi
echo ".NET server built successfully."

# Build the Next.js frontend
echo "Building Next.js frontend..."
# Navigate to the client directory to run npm commands
(cd gitforge-client && npm install --legacy-peer-deps && npm run build)

if [ $? -ne 0 ]; then
    echo "Next.js build failed!"
    exit 1
fi

echo "Next.js frontend built successfully."

# Construct electron-builder command
BUILDER_CMD="npx electron-builder"

case "$TARGET_OS" in
    win)
        BUILDER_CMD+=" --win"
        ;;
    mac)
        BUILDER_CMD+=" --mac"
        ;;
    linux)
        BUILDER_CMD+=" --linux"
        ;;
    *)
        echo "Error: Invalid TARGET_OS '$TARGET_OS'. Must be win, mac, or linux."
        exit 1
        ;;
esac

case "$TARGET_ARCH" in
    x64)
        BUILDER_CMD+=" --x64"
        ;;
    arm64)
        BUILDER_CMD+=" --arm64"
        ;;
    ia32)
        BUILDER_CMD+=" --ia32"
        ;;
    *)
        echo "Error: Invalid TARGET_ARCH '$TARGET_ARCH'. Must be x64, arm64, or ia32."
        exit 1
        ;;
esac

echo "Executing electron-builder command: $BUILDER_CMD"
(cd gitforge-client && eval "$BUILDER_CMD")

if [ $? -ne 0 ]; then
    echo "Electron build failed!"
    exit 1
fi

echo "Electron build completed successfully."

# Post-build output to indicate where the artifacts are
echo ""
echo "--- Build Artifacts ---"
case "$TARGET_OS" in
    mac)
        echo "macOS installers (DMG, PKG) should be in: gitforge-client/dist/*.dmg, gitforge-client/dist/*.pkg"
        ls -lh gitforge-client/dist/*.dmg 2>/dev/null
        ls -lh gitforge-client/dist/*.pkg 2>/dev/null
        ;;
    win)
        echo "Windows installers (EXE, MSI) should be in: gitforge-client/dist/*.exe, gitforge-client/dist/*.msi"
        ls -lh gitforge-client/dist/*.exe 2>/dev/null
        ls -lh gitforge-client/dist/*.msi 2>/dev/null
        ;;
    linux)
        echo "Linux packages (AppImage, deb, rpm, snap) should be in: gitforge-client/dist/*.AppImage, gitforge-client/dist/*.deb, gitforge-client/dist/*.rpm, gitforge-client/dist/*.snap"
        ls -lh gitforge-client/dist/*.AppImage 2>/dev/null
        ls -lh gitforge-client/dist/*.deb 2>/dev/null
        ls -lh gitforge-client/dist/*.rpm 2>/dev/null
        ls -lh gitforge-client/dist/*.snap 2>/dev/null
        ;;
esac
echo "Check the 'gitforge-client/dist/' directory for generated files."
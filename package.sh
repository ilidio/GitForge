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
    echo "  - Building Linux apps (.AppImage, .deb, .rpm) can be done from any host."
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

# Cleanup previous build artifacts
echo "Cleaning up previous build artifacts..."
rm -rf gitforge-client/dist
rm -rf gitforge-client/.next/cache
rm -rf gitforge-client/out
rm -rf gitforge-client/server-dist
rm -rf gitforge-client/node_modules/.cache
rm -rf dist

# Build the Next.js frontend
echo "Building Next.js frontend..."
# Navigate to the client directory to run npm commands
(cd gitforge-client && npm install && npm run build)

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
eval "$BUILDER_CMD"

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
        echo "macOS installers (DMG, PKG) should be in: dist/*.dmg, dist/*.pkg"
        ls -lh dist/*.dmg 2>/dev/null
        ls -lh dist/*.pkg 2>/dev/null
        ;;
    win)
        echo "Windows installers (EXE, MSI) should be in: dist/*.exe, dist/*.msi"
        ls -lh dist/*.exe 2>/dev/null
        ls -lh dist/*.msi 2>/dev/null
        ;;
    linux)
        echo "Linux packages (AppImage, deb, rpm, snap) should be in: dist/*.AppImage, dist/*.deb, dist/*.rpm, dist/*.snap"
        ls -lh dist/*.AppImage 2>/dev/null
        ls -lh dist/*.deb 2>/dev/null
        ls -lh dist/*.rpm 2>/dev/null
        ls -lh dist/*.snap 2>/dev/null
        ;;
esac
echo "Check the 'dist/' directory for generated files."

# GitForge CI/CD with GitHub Actions

This project uses GitHub Actions for continuous integration, testing, and automated builds of installation files.

## Workflows

### 1. Build and Package (`build.yml`)
This is the main workflow that builds and packages the Electron application for Windows, macOS, and Linux.

- **Triggers:**
  - Push to `main` branch.
  - Pull Request to `main` branch.
  - Creating a new **GitHub Release**.
- **Matrix:**
  - **Windows (x64):** Builds `.exe` and `.msi` (portable and NSIS).
  - **Linux (x64):** Builds `.AppImage` and `.deb`.
  - **macOS (x64 & ARM64):** Builds `.dmg`.
- **Outputs:**
  - **Artifacts:** Uploaded to the GitHub Action run for every build.
  - **Releases:** Automatically uploads the packaged installation files to the release if it's a release event.
- **Notes:**
  - Requires a `.NET 10` SDK.
  - Requires `Node.js 20`.
  - Uses `electron-builder` for packaging.

### 2. .NET Server CI (`dotnet-server.yml`)
Focuses on the C#/.NET backend.

- **Triggers:**
  - Push to `main`.
  - Pull Request to `main`.
- **Tasks:** Restores, builds, and runs tests for the `gitforge-server`.

### 3. Node.js CI (`node-client.yml`)
Focuses on the Next.js/Electron frontend.

- **Triggers:**
  - Push to `main`.
  - Pull Request to `main`.
- **Tasks:** Installs dependencies, lints, runs Vitest tests, and performs a Next.js build.

## How to Create a New Release

To build and publish installation files for a new version:

1. Update the version in `gitforge-client/package.json`.
2. Commit and push the changes to `main`.
3. Create a new tag (e.g., `v1.0.0`) and push it, or use the GitHub UI to **Create a New Release**.
4. The `build.yml` workflow will automatically trigger, build for all platforms, and attach the installation files to the release.

## Configuration for GitHub Releases

The `build.yml` workflow uses `GITHUB_TOKEN` to publish releases. Ensure your repository settings allow GitHub Actions to write to releases.

- **Settings** -> **Actions** -> **General** -> **Workflow permissions** -> Select **Read and write permissions**.

## Code Signing (Recommended for Production)

Currently, macOS and Windows builds are **not signed**. For production releases, you should configure code signing in `electron-builder` by providing the necessary certificates as GitHub Secrets and updating the packaging step.

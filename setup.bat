@echo off
SETLOCAL

echo 🚀 Starting GitForge Setup...

echo 🔍 Checking prerequisites...

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Git is not installed. Please install Git.
    exit /b 1
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js (v18+).
    exit /b 1
)

where dotnet >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ .NET SDK is not installed. Please install .NET 10 SDK.
    exit /b 1
)

where git-graph >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  'git-graph' CLI is not found.
    echo    Please ensure 'git-graph' is in your PATH for the best experience.
) else (
    echo ✅ git-graph is installed.
)

echo 📦 Installing Frontend Dependencies (gitforge-client)...
cd gitforge-client
call npm install
if %errorlevel% neq 0 (
    echo Frontend installation failed!
    exit /b %errorlevel%
)
cd ..

echo 📦 Restoring Backend Dependencies (gitforge-server)...
cd gitforge-server
dotnet restore
if %errorlevel% neq 0 (
    echo Backend restore failed!
    exit /b %errorlevel%
)
cd ..

echo 🎉 Setup Complete!
echo.
echo To start the application, run:
echo   cd gitforge-client ^&^& npm run dev
echo.

ENDLOCAL

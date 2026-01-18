@echo off
SETLOCAL

echo Building GitForge Server for Windows (x64)...

set "SERVER_PROJECT=.\gitforge-server\GitForge.Server.csproj"
set "OUTPUT_DIR=.\gitforge-client\server-dist"

if exist "%OUTPUT_DIR%" rd /s /q "%OUTPUT_DIR%"

dotnet publish "%SERVER_PROJECT%" ^
  -c Release ^
  -r win-x64 ^
  --self-contained true ^
  -p:PublishSingleFile=true ^
  -p:DebugType=embedded ^
  -o "%OUTPUT_DIR%"

if %errorlevel% neq 0 (
    echo.
    echo ❌ Server build failed!
    exit /b %errorlevel%
)

echo.
echo ✅ Build complete. Server binary is located at %OUTPUT_DIR%\GitForge.Server.exe
ENDLOCAL

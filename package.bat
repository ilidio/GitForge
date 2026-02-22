@echo off
REM package.bat
REM This script builds the Electron application for Windows.

REM --- Helper Functions ---

REM Function to display help message
:display_help
    echo Usage: %~n0 [ARCH]
    echo.
    echo Builds the Electron application for the specified architecture.
    echo If ARCH is omitted, it will default to x64.
    echo.
    echo Arguments:
    echo   ARCH  The target architecture. Possible values: x64, arm64, ia32
    echo.
    echo Examples:
    echo   %~n0         REM Build for Windows (x64)
    echo   %~n0 arm64    REM Build for Windows (ARM64)
    echo   %~n0 ia32     REM Build for Windows (IA32)
    echo.
    echo Note: This script is intended for Windows hosts and builds only Windows targets.
    echo.
    goto :eof

REM --- Main Script Logic ---

REM Check for help argument or no arguments
if "%1"=="" goto :check_help_arg
if /i "%1"=="help" goto :help_and_exit
if /i "%1"=="-h" goto :help_and_exit
if /i "%1"=="--help" goto :help_and_exit

:check_help_arg
REM Determine TARGET_ARCH
set "TARGET_ARCH=%1"
if "%TARGET_ARCH%"=="" (
    set "TARGET_ARCH=x64"
    echo No architecture specified. Defaulting to x64.
)

echo Building for Windows, Target Arch: %TARGET_ARCH%

REM Cleanup previous build artifacts
echo Cleaning up previous build artifacts...
rd /s /q "gitforge-client\dist" 2>nul
rd /s /q "gitforge-client\.next\cache" 2>nul
rd /s /q "gitforge-client\out" 2>nul
rd /s /q "gitforge-client\server-dist" 2>nul
rd /s /q "gitforge-client
ode_modules\.cache" 2>nul
rd /s /q "dist" 2>nul

REM Build the Next.js frontend
echo Building Next.js frontend...
pushd gitforge-client
call npm install
if %errorlevel% neq 0 (
    echo Next.js npm install failed!
    popd
    exit /b 1
)
call npm run build
if %errorlevel% neq 0 (
    echo Next.js build failed!
    popd
    exit /b 1
)
popd
echo Next.js frontend built successfully.

REM Construct electron-builder command
set "BUILDER_CMD=npx electron-builder --win"

REM Append architecture flag
if /i "%TARGET_ARCH%"=="x64" (
    set "BUILDER_CMD=%BUILDER_CMD% --x64"
) else if /i "%TARGET_ARCH%"=="arm64" (
    set "BUILDER_CMD=%BUILDER_CMD% --arm64"
) else if /i "%TARGET_ARCH%"=="ia32" (
    set "BUILDER_CMD=%BUILDER_CMD% --ia32"
) else (
    echo Error: Invalid TARGET_ARCH '%TARGET_ARCH%'. Must be x64, arm64, or ia32.
    exit /b 1
)

echo Executing electron-builder command: %BUILDER_CMD%
call %BUILDER_CMD%

if %errorlevel% neq 0 (
    echo Electron build failed!
    exit /b 1
)

echo Electron build completed successfully.

REM Post-build output to indicate where the artifacts are
echo.
echo --- Build Artifacts ---
echo Windows installers (EXE, MSI) should be in: dist\*.exe, dist\*.msi
dir /b dist\*.exe 2>nul
dir /b dist\*.msi 2>nul
echo Check the 'dist' directory for generated files.
goto :eof

:help_and_exit
    call :display_help
    exit /b 0
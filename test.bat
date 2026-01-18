@echo off
SETLOCAL

echo Running Client Tests...
cd gitforge-client
call npm test -- --run
if %errorlevel% neq 0 (
    echo Client tests failed!
    exit /b %errorlevel%
)

echo.
echo Running Server Tests...
cd ..\gitforge-server.Tests
dotnet test
if %errorlevel% neq 0 (
    echo Server tests failed!
    exit /b %errorlevel%
)

echo.
echo All tests passed!
cd ..
ENDLOCAL

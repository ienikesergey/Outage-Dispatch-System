@echo off

echo ================================
echo   Starting Monitoring Server
echo ================================
echo.

cd /d "%~dp0server"

:: Check Node
where node >nul 2>&1
if %errorLevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=%PATH%;C:\Program Files\nodejs"
    )
)

:: Start server
call npm start

pause

@echo off
title StudyBuddy Launcher
cd /d "%~dp0"

echo =============================================
echo  StudyBuddy - Open http://localhost:8920
echo  Close this window to stop the server.
echo =============================================
echo.

start "StudyBuddy Server" /min cmd /k "node server.js"
timeout /t 2 /nobreak >nul
start "" "http://localhost:8920/"
pause
@echo off
REM Start all three services concurrently

setlocal enabledelayedexpansion

cd /d "%~dp0"

echo Starting Time Tracker services...

REM Backend
echo Starting backend...
start "Time Tracker Backend" cmd /k "cd backend && npm run dev"

REM Frontend
echo Starting frontend...
start "Time Tracker Frontend" cmd /k "cd frontend && npm run dev"

REM Tracker
echo Starting tracker...
start "Time Tracker Python" cmd /k "cd tracker && python main.py"

echo.
echo All services started in separate windows!

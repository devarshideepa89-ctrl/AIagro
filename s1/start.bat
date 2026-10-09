@echo off
setlocal enabledelayedexpansion
title SmartAgriCare Launcher
echo ========================================
echo   SmartAgriCare - Starting All Services
echo ========================================
echo.

:: Check for port conflicts
echo Checking for port conflicts...
netstat -ano 2>NUL | findstr ":5001 " | findstr "LISTENING" >NUL 2>&1
if !errorlevel!==0 (
    echo   WARNING: Port 5001 already in use! ML service may fail to start.
)
netstat -ano 2>NUL | findstr ":5000 " | findstr "LISTENING" >NUL 2>&1
if !errorlevel!==0 (
    echo   WARNING: Port 5000 already in use! Backend may fail to start.
)
netstat -ano 2>NUL | findstr ":8080 " | findstr "LISTENING" >NUL 2>&1
if !errorlevel!==0 (
    echo   WARNING: Port 8080 already in use! Frontend may fail to start.
)
echo.

:: 1. Start ML service (disease detection)
echo [1/3] Starting ML service on port 5001 with uvicorn...
cd /d "%~dp0ml-service"
start "SmartAgriCare-ML" cmd /c "python -m uvicorn app:app --host 0.0.0.0 --port 5001 --interface wsgi"

:: Wait for ML service to actually be ready (up to 120 seconds)
echo       Waiting for ML model to load (this may take 30-60 seconds)...
set ML_READY=0
for /L %%i in (1,1,24) do (
    if !ML_READY!==0 (
        timeout /t 5 /nobreak >NUL
        curl -s http://localhost:5001/health >NUL 2>&1
        if !errorlevel!==0 (
            set ML_READY=1
            echo       ML service is ready!
        )
    )
)
if !ML_READY!==0 (
    echo       WARNING: ML service did not respond in 120s. Disease detection may not work.
)
echo.

:: 2. Start backend
echo [2/3] Starting backend on port 5000 with nodemon (auto-restart on crash)...
cd /d "%~dp0backend"
start "SmartAgriCare-Backend" cmd /c "nodemon --delay 1 index.js"
timeout /t 3 /nobreak >NUL

:: 3. Start frontend
echo [3/3] Starting frontend with npm run run...
cd /d "%~dp0frontend"
start "SmartAgriCare-Frontend" cmd /c "npm run run"
timeout /t 3 /nobreak >NUL

echo.
echo ========================================
echo   All services started!
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:5000
echo   ML Model:  http://localhost:5001
echo   Voice AI:  Groq API (primary)
echo ========================================
echo.
echo Press any key to open in browser...
pause >NUL
start http://localhost:5173

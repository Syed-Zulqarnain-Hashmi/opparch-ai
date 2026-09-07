@echo off
title OPPARCH AI Launcher
echo ========================================================
echo               OPPARCH AI - STARTING SYSTEM
echo ========================================================
echo.

echo [1/3] Checking Ollama status...
start /B ollama serve >nul 2>&1

echo [2/3] Starting FastAPI Backend (Port 8000)...
start "OPPARCH AI Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [3/3] Starting Next.js Frontend (Port 3000)...
start "OPPARCH AI Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ========================================================
echo OPPARCH AI is launching in your browser:
echo -> App URL:      http://localhost:3000
echo -> Backend API:  http://127.0.0.1:8000
echo -> Swagger Docs: http://127.0.0.1:8000/docs
echo ========================================================
echo.

start http://localhost:3000
pause

@echo off
title Lost and Found Services Launcher
echo ===================================================
echo   Starting Lost and Found System (Local Deployment)
echo ===================================================
echo.
echo [1/3] Starting AI Service (Port 5000)...
start "AI Service" cmd /k "cd ai_service && python main.py"
echo.
echo [2/3] Starting Backend Server (Port 3000)...
start "Backend Server" cmd /k "cd server && npm start"
echo.
echo [3/3] Starting Frontend (Port 5173)...
start "Frontend" cmd /k "npm run dev"
echo.
echo ===================================================
echo   All services started!
echo   Frontent: http://localhost:5173
echo   Backend:  http://localhost:3000
echo   AI API:   http://localhost:5000
echo ===================================================
pause

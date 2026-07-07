@echo off
echo ==========================================
echo  FlowGen Development Server Launcher
echo ==========================================
echo.

REM Start AI Service (Django)
echo [1/3] Starting AI Service on port 8000...
start "FlowGen AI Service" cmd /k "cd /d "%~dp0ai-service" && python manage.py runserver 8000"

REM Wait a moment before launching next service
timeout /t 2 /nobreak >nul

REM Start Backend (Node.js)
echo [2/3] Starting Backend API on port 5000...
start "FlowGen Backend" cmd /k "cd /d "%~dp0server" && npm run dev"

REM Wait a moment before launching frontend
timeout /t 2 /nobreak >nul

REM Start Frontend (Vite)
echo [3/3] Starting Frontend on port 5173...
start "FlowGen Frontend" cmd /k "cd /d "%~dp0client" && npm run dev"

echo.
echo ==========================================
echo  All services launched in separate windows
echo ==========================================
echo.
echo  Frontend  : http://localhost:5173
echo  Backend   : http://localhost:5000
echo  AI Service: http://localhost:8000
echo  API Health: http://localhost:5000/health
echo.
echo Press any key to exit this window...
pause >nul

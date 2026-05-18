@echo off
REM SISWISP Quick Setup Script for Windows

echo.
echo ========================================
echo    SISWISP ISP Management System
echo         Setup for Windows
echo ========================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.9+
    exit /b 1
)

echo [1/4] Creating Python virtual environment...
cd siswisp_backend\backend
if not exist venv (
    python -m venv venv
)
call venv\Scripts\activate.bat
echo [✓] Virtual environment created

echo.
echo [2/4] Installing Python dependencies...
pip install -r requirements.txt -q
echo [✓] Dependencies installed

echo.
echo [3/4] Setting up database and admin user...
python create_admin_user.py
echo [✓] Database initialized
echo     Login: admin@miwisp.com
echo     Password: Wisp@2026

echo.
echo [4/4] Installing Node.js dependencies for frontend...
cd ..\..\siswisp_frontend\siswisp-frontend
call npm install --silent
echo [✓] Frontend dependencies installed

echo.
echo ========================================
echo    Setup Complete!
echo ========================================
echo.
echo To start the application:
echo.
echo Terminal 1 - Backend:
echo   cd siswisp_backend\backend
echo   venv\Scripts\activate.bat
echo   python run.py
echo.
echo Terminal 2 - Frontend:
echo   cd siswisp_frontend\siswisp-frontend
echo   npm start
echo.
echo Backend: http://localhost:10000
echo Frontend: http://localhost:3000
echo.
echo Default credentials:
echo   Email: admin@miwisp.com
echo   Password: Wisp@2026
echo.
pause

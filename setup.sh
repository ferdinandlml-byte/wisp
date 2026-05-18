#!/bin/bash

# SISWISP Quick Setup Script for Linux/Mac

echo ""
echo "========================================"
echo "   SISWISP ISP Management System"
echo "      Setup for Linux/Mac"
echo "========================================"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 not found. Please install Python 3.9+"
    exit 1
fi

echo "[1/4] Creating Python virtual environment..."
cd siswisp_backend/backend
if [ ! -d venv ]; then
    python3 -m venv venv
fi
source venv/bin/activate
echo "[✓] Virtual environment created"

echo ""
echo "[2/4] Installing Python dependencies..."
pip install -q -r requirements.txt
echo "[✓] Dependencies installed"

echo ""
echo "[3/4] Setting up database and admin user..."
python create_admin_user.py
echo "[✓] Database initialized"
echo "     Login: admin@miwisp.com"
echo "     Password: Wisp@2026"

echo ""
echo "[4/4] Installing Node.js dependencies for frontend..."
cd ../../siswisp_frontend/siswisp-frontend
npm install --silent
echo "[✓] Frontend dependencies installed"

echo ""
echo "========================================"
echo "    Setup Complete!"
echo "========================================"
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd siswisp_backend/backend"
echo "  source venv/bin/activate"
echo "  python run.py"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd siswisp_frontend/siswisp-frontend"
echo "  npm start"
echo ""
echo "Backend: http://localhost:10000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Default credentials:"
echo "  Email: admin@miwisp.com"
echo "  Password: Wisp@2026"
echo ""

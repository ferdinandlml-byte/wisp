#!/bin/bash
set -e

cd /app
export PYTHONUNBUFFERED=1
export FLASK_ENV=production
export PORT=${PORT:-10000}

echo "Python version:"
python --version
echo "Current directory:"
pwd
echo "Checking if app module exists:"
ls -la app/
echo "Starting Flask application..."

exec python -c "import os; from app.main import app; app.run(host='0.0.0.0', port=int(os.getenv('PORT', 10000)), debug=False)" 2>&1


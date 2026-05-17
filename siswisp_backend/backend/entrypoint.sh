#!/bin/bash
set -e

cd /app
export PYTHONUNBUFFERED=1
export PORT=${PORT:-10000}

echo "Starting Flask application..."
exec python -c "
import os
os.environ['FLASK_ENV'] = 'production'
from app.main import app
app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 10000)), debug=False)
"


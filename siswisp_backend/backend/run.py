#!/usr/bin/env python
"""SISWISP Backend Application Entry Point"""

import os
import sys

# Set production mode
os.environ.setdefault('FLASK_ENV', 'production')
os.environ.setdefault('PYTHONUNBUFFERED', '1')

# Simple startup - let Flask handle everything
if __name__ == '__main__':
    try:
        from app.main import app
        port = int(os.environ.get('PORT', 10000))
        app.run(host='0.0.0.0', port=port, debug=False, threaded=True, use_reloader=False)
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

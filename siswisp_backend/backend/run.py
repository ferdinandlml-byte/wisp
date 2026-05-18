#!/usr/bin/env python3
"""SISWISP Backend Application Entry Point"""

import os
import sys

if __name__ == '__main__':
    os.environ['FLASK_ENV'] = 'production'
    os.environ['PYTHONUNBUFFERED'] = '1'
    
    port = int(os.environ.get('PORT', 10000))
    
    try:
        from app.main import app
        app.run(host='0.0.0.0', port=port, debug=False, threaded=True, use_reloader=False)
    except Exception as e:
        print(f"FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

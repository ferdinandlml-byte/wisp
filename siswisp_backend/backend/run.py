#!/usr/bin/env python3
import os
import sys

os.environ['FLASK_ENV'] = 'production'
os.environ['PYTHONUNBUFFERED'] = '1'

port = int(os.environ.get('PORT', 10000))

try:
    from app.main import app
    print(f"[SISWISP] Starting Flask on 0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True, use_reloader=False)
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

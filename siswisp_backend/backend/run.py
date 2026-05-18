#!/usr/bin/env python3
import os
import sys

os.environ['FLASK_ENV'] = 'production'
os.environ['PYTHONUNBUFFERED'] = '1'

port = int(os.environ.get('PORT', 10000))

try:
    from app.main import app
    from app.core.database import Base, engine
    
    # Crear tablas en la base de datos si no existen
    print("[SISWISP] Creando tablas en la base de datos...")
    Base.metadata.create_all(bind=engine)
    print("[SISWISP] Tablas listas")
    
    print(f"[SISWISP] Iniciando Flask en 0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True, use_reloader=False)
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

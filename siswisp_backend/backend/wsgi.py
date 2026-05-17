"""
WSGI entry point para Gunicorn
"""
import sys
import os

# Asegurar que app esté en el path
sys.path.insert(0, os.path.dirname(__file__))

from app.main import app

if __name__ == "__main__":
    app.run()

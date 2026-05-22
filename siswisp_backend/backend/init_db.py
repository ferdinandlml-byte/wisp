"""
Script para inicializar/crear todas las tablas en la base de datos
Ejecutar: python init_db.py
"""
import os
import sys
from app.core.database import engine, Base
from app.models import User, Client, Plan, Payment, Device

def init_database():
    """Crear todas las tablas"""
    print("🔧 Inicializando base de datos...")
    
    # Crear todas las tablas definidas en models
    Base.metadata.create_all(bind=engine)
    
    print("✅ Base de datos inicializada correctamente")
    print("✅ Tablas creadas/verificadas:")
    print("   - users")
    print("   - plans")
    print("   - clients")
    print("   - payments")
    print("   - devices")

if __name__ == "__main__":
    init_database()

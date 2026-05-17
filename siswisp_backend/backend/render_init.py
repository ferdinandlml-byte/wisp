#!/usr/bin/env python
"""
Script para inicializar la base de datos en Render.com
Ejecuta: python render_init.py
"""
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'siswisp_backend/backend'))

from app.core.database import Base, engine
from app.models import User
from app.core.security import hash_password
from sqlalchemy.orm import sessionmaker

# Crear todas las tablas
Base.metadata.create_all(bind=engine)
print("✅ Tablas de base de datos creadas")

# Crear usuario admin
Session = sessionmaker(bind=engine)
db = Session()

try:
    admin = db.query(User).filter(User.email == "admin@miwisp.com").first()
    if not admin:
        admin_user = User(
            name="Administrador",
            email="admin@miwisp.com",
            hashed_password=hash_password("Wisp@2026"),
            is_active=True,
            is_superuser=True,
        )
        db.add(admin_user)
        db.commit()
        print("✅ Usuario admin creado: admin@miwisp.com / Wisp@2026")
    else:
        print("✅ Usuario admin ya existe")
finally:
    db.close()

print("✅ Base de datos inicializada correctamente")

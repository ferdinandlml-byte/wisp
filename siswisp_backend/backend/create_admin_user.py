#!/usr/bin/env python3
"""
Script para crear/actualizar usuario admin
Uso: python create_admin_user.py
"""

import sys
import os
from pathlib import Path

# Agregar el directorio actual al path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import engine, SessionLocal, Base
from app.models import User
from app.core.security import hash_password
from sqlalchemy.orm import Session

def create_admin_user(email: str, password: str, name: str = "Administrador"):
    """Crear o actualizar usuario admin"""
    
    # Crear tablas si no existen
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    
    try:
        # Verificar si el usuario ya existe
        user = db.query(User).filter(User.email == email).first()
        
        if user:
            print(f"✅ Usuario encontrado: {email}")
            print(f"   Actualizando contraseña...")
            user.hashed_password = hash_password(password)
            user.is_active = True
            user.is_superuser = True
        else:
            print(f"✅ Creando nuevo usuario admin: {email}")
            user = User(
                name=name,
                email=email,
                hashed_password=hash_password(password),
                is_active=True,
                is_superuser=True
            )
            db.add(user)
        
        db.commit()
        db.refresh(user)
        
        print(f"\n✅ ¡Éxito! Usuario admin configurado:")
        print(f"   Email: {user.email}")
        print(f"   Nombre: {user.name}")
        print(f"   Activo: {user.is_active}")
        print(f"   Super usuario: {user.is_superuser}")
        
        return user
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {str(e)}")
        sys.exit(1)
    finally:
        db.close()


def main():
    """Función principal con input interactivo"""
    print("\n" + "="*50)
    print("   CONFIGURAR USUARIO ADMIN - SISWISP")
    print("="*50 + "\n")
    
    # Email
    email = input("📧 Email del admin (por defecto: admin@miwisp.com): ").strip()
    if not email:
        email = "admin@miwisp.com"
    
    # Contraseña
    while True:
        password = input("🔐 Contraseña (6-72 caracteres): ").strip()
        if len(password) < 6:
            print("   ❌ La contraseña debe tener al menos 6 caracteres")
            continue
        if len(password) > 72:
            print("   ❌ La contraseña no puede exceder 72 caracteres")
            continue
        
        password_confirm = input("🔐 Confirmar contraseña: ").strip()
        if password != password_confirm:
            print("   ❌ Las contraseñas no coinciden")
            continue
        
        break
    
    # Nombre
    name = input("👤 Nombre completo (por defecto: Administrador): ").strip()
    if not name:
        name = "Administrador"
    
    print("\n⏳ Procesando...\n")
    
    # Crear usuario
    create_admin_user(email=email, password=password, name=name)
    
    print("\n" + "="*50)
    print("   ✅ LISTO PARA USAR")
    print("="*50)
    print(f"\nAccede a: http://localhost:3000/login")
    print(f"Email:    {email}")
    print(f"Contraseña: (la que acabas de configurar)")
    print("\n")


if __name__ == "__main__":
    main()

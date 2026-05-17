import bcrypt

# La contraseña que configuramos
password = "Wisp@2026"
# El hash guardado en la BD
hashed = "$2b$12$iuWIkONxdy6mabERJvwf5eypjpLYrsmJXvi/kfcm2jVc912xjpBIi"

# Verificar
try:
    result = bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    print(f"✅ Contraseña válida: {result}")
    if result:
        print("✅ El hash es correcto para la contraseña 'Wisp@2026'")
    else:
        print("❌ La contraseña NO coincide con el hash")
except Exception as e:
    print(f"❌ Error: {e}")

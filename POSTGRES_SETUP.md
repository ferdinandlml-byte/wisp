# Configurar PostgreSQL en Railway

## 🎯 Problema
SQLite se reinicia en cada deploy de Railway, eliminando todos los datos. **Necesitas una base de datos persistente.**

## ✅ Solución: PostgreSQL en Railway

Railway ofrece **PostgreSQL GRATIS** con almacenamiento persistente.

---

## Pasos para configurar

### 1️⃣ Accede a Railway
```
https://railway.app
```

### 2️⃣ En tu proyecto SISWISP, haz clic en "Create" (+ Add Plugin)

### 3️⃣ Selecciona "PostgreSQL" de la lista

### 4️⃣ Espera a que se despliegue (2-3 minutos)

### 5️⃣ Railway automáticamente crea una variable de entorno: `DATABASE_URL`
- ✅ No necesitas hacer nada, Railway la inyecta automáticamente
- ✅ El backend leerá esta URL y se conectará a PostgreSQL

### 6️⃣ Redeploy el backend
- Ve a tu servicio "siswisp_backend"
- Haz clic en "Deploy" o "Redeploy Latest"
- La app se reiniciará con PostgreSQL

---

## ¿Qué sucede automáticamente?

1. **run.py** detecta la conexión a PostgreSQL
2. Ejecuta `Base.metadata.create_all()` para crear todas las tablas
3. Tus clientes, planes y usuarios persisten en PostgreSQL
4. En cada deploy, los datos se mantienen 🎉

---

## Verificar que funciona

1. Accede a tu app: `https://wisp-wheat.vercel.app/login`
2. Inicia sesión: `admin@miwisp.com` / `Wisp@2026`
3. Crea varios clientes
4. Haz un deploy en Railway
5. Los clientes siguen ahí ✅

---

## Desarrollo local con PostgreSQL

Si quieres usar PostgreSQL localmente también:

```bash
# Con Docker Compose
docker-compose up

# Automaticamente levanta:
# - backend en puerto 5000
# - PostgreSQL en puerto 5432
```

O instala PostgreSQL manualmente:

```bash
# Windows: Descargar desde https://www.postgresql.org/download/windows/
# macOS: brew install postgresql
# Linux: sudo apt install postgresql

# Crear BD
createdb siswisp

# En .env local:
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/siswisp
```

---

## Si necesitas migrar datos de SQLite a PostgreSQL

Railway te proporciona una URL de PostgreSQL. Los datos nuevos se guardarán ahí.

**Para migrar datos antiguos de SQLite:**

1. Exporta clientes desde tu app actual (botón "📊 CSV")
2. En la nueva app con PostgreSQL, importa el CSV (botón "📁 Importar CSV")
3. Todos tus clientes están restaurados ✅

---

## Troubleshooting

### ❌ "connection refused" o error de BD
- Verifica que PostgreSQL está corriendo en Railway
- Redeploy el backend: `railway up`

### ❌ "relation does not exist"
- Las tablas no se crearon correctamente
- Revisa los logs de Railway: `railway logs`
- Redeploy otra vez

### ✅ "SISWISP Tablas listas"
- Perfecto, la BD está funcionando

---

## ¿Cuánto cuesta?

**GRATIS** 🎉
- Railway: 5GB PostgreSQL gratuito
- 100GB transferencia de datos gratuita/mes
- Perfecto para desarrollo y pequeña producción


# 🔍 GUÍA DE DIAGNÓSTICO - DISPOSITIVOS

## Problema
La página de Dispositivos se carga pero luego crashea, probablemente porque:
1. La tabla `devices` no existe en la base de datos Railway
2. La estructura de la tabla es incorrecta
3. Hay un error al conectar con la base de datos

## Solución - Paso a Paso

### OPCIÓN 1: Verificar estado de la BD (sin cambiar nada)
1. Abre navegador
2. Ve a: `https://tu-backend.railway.app/api/devices/diagnostic/status`
3. Mira la respuesta JSON
   - Si dice `"devices_table_exists": false` → Ir a OPCIÓN 2
   - Si dice `"status": "ok"` → El problema es en el frontend

**Respuesta esperada si TODO está bien:**
```json
{
  "status": "ok",
  "devices_table_exists": true,
  "device_count": 0,
  "columns": {...},
  "missing_columns": [],
  "message": "Tabla devices está lista"
}
```

### OPCIÓN 2: Crear/Reinicializar las tablas
**En producción (Railway):**
1. Ve a Railway.app → Tu proyecto
2. Ve a "Deployments"
3. Haz click en el deployment actual
4. Ve a "Logs" y busca el comando a ejecutar
5. O ejecuta manualmente en una terminal con acceso al backend:
```bash
python init_db.py
```

**Localmente (si tienes acceso local):**
```bash
cd siswisp_backend/backend
python init_db.py
```

**Resultado esperado:**
```
🔧 Inicializando base de datos...
✅ Base de datos inicializada correctamente
✅ Tablas creadas/verificadas:
   - users
   - plans
   - clients
   - payments
   - devices
```

### OPCIÓN 3: Si aún no funciona - Verificar logs en Railway
1. Railway.app → Proyecto → Backend Deployment
2. Ve a "Logs" y busca mensajes con `[Devices API]`
3. Mira cualquier error rojo
4. Comparte esos logs para diagnosticar

## ¿Qué pasó?
- El código frontend ya fue reescrito correctamente ✅
- Ahora agregamos diagnostico y reinicio automático de BD ✅
- Si la BD estaba vacía o corrupta, eso causaba el crash

## Próximos pasos
1. Verifica el estado con `/api/devices/diagnostic/status`
2. Si dice `false`, ejecuta `python init_db.py`
3. Intenta crear un nuevo dispositivo
4. Reporta si funciona o qué error aparece

## Links útiles
- Railway Logs: https://railway.app → Tu proyecto → Logs
- API Status: https://tu-backend.railway.app/api/devices/diagnostic/status
- Salud del servidor: https://tu-backend.railway.app/health

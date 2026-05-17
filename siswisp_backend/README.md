# 🌐 SISWISP — Sistema de Administración ISP

Sistema completo para proveedores de internet (ISP/WISP) construido con Python + FastAPI.

## 🚀 Stack Tecnológico (100% Gratuito)

| Servicio | Uso | Gratis |
|---|---|---|
| [Render.com](https://render.com) | Backend FastAPI + Workers | ✅ 750h/mes |
| [Supabase](https://supabase.com) | PostgreSQL | ✅ 500MB |
| [Upstash](https://upstash.com) | Redis para Celery | ✅ 10k cmd/día |
| [Vercel](https://vercel.com) | Frontend React | ✅ ilimitado |
| [GitHub](https://github.com) | Código + CI/CD | ✅ ilimitado |

## 📦 Módulos del Sistema

- **Clientes**: Alta, edición, planes, estado
- **Cobros**: Facturas automáticas mensuales, historial de pagos
- **WhatsApp**: Recordatorios, avisos de corte, confirmaciones
- **MikroTik**: Corte y reactivación remota por IP
- **Dashboard**: Métricas en tiempo real, activos, morosos, ingresos
- **Monitoreo**: Ping a clientes, estado de conexiones

## ⚙️ Instalación Local

```bash
# 1. Clonar y entrar al backend
cd backend

# 2. Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales

# 5. Ejecutar la API
uvicorn app.main:app --reload

# 6. En otra terminal: ejecutar worker Celery
celery -A app.tasks.billing.celery_app worker --loglevel=info

# 7. En otra terminal: ejecutar beat (scheduler)
celery -A app.tasks.billing.celery_app beat --loglevel=info
```

La API estará disponible en: http://localhost:8000
Documentación: http://localhost:8000/docs

## 🌐 Deploy Gratuito en Render.com

1. Sube el código a GitHub
2. Ve a [render.com](https://render.com) → New → Blueprint
3. Conecta tu repositorio
4. Render detectará el `render.yaml` automáticamente
5. Configura las variables de entorno en el dashboard

## 🔧 Configuración de MikroTik

El sistema usa la lista de firewall `clientes-suspendidos` en MikroTik.

Agrega esta regla en tu MikroTik para que funcione el corte:
```
/ip firewall filter
add chain=forward src-address-list=clientes-suspendidos action=drop comment="SISWISP: Clientes suspendidos"
```

## 📱 Configuración de WhatsApp (Evolution API)

```bash
# Instalar Evolution API con Docker (en tu servidor)
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=tu-api-key \
  atendai/evolution-api:latest
```

## 📡 Endpoints Principales

| Método | Ruta | Descripción |
|---|---|---|
| POST | /api/auth/login | Iniciar sesión |
| GET | /api/clients/ | Listar clientes |
| POST | /api/clients/ | Crear cliente |
| POST | /api/clients/{id}/suspend | Cortar servicio |
| POST | /api/clients/{id}/reactivate | Reactivar servicio |
| GET | /api/clients/{id}/ping | Verificar si está online |
| GET | /api/payments/ | Listar pagos |
| POST | /api/payments/{id}/mark-paid | Registrar pago |
| GET | /api/dashboard/stats | Estadísticas generales |

## 🔄 Tareas Automáticas (Celery)

| Tarea | Horario | Descripción |
|---|---|---|
| Recordatorios | Diario 8am | WhatsApp 3 días antes del vencimiento |
| Suspensiones | Diario 9am | Corta clientes morosos automáticamente |
| Facturas | Día 1 del mes 7am | Genera cobros para todos los clientes |

## 📁 Estructura del Proyecto

```
siswisp/
├── backend/
│   ├── app/
│   │   ├── api/routes/     # Endpoints REST
│   │   ├── core/           # Config, DB, seguridad
│   │   ├── models/         # Tablas de la BD
│   │   ├── schemas/        # Validación con Pydantic
│   │   ├── services/       # MikroTik + WhatsApp
│   │   ├── tasks/          # Tareas automáticas Celery
│   │   └── main.py         # App principal
│   ├── requirements.txt
│   └── .env.example
├── frontend/               # React (próxima fase)
└── render.yaml             # Deploy automático
```

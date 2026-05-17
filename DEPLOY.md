# 🚀 SISWISP - Sistema de Administración ISP/WISP

Sistema completo para gestionar clientes, planes, pagos y servicios de ISP/WISP.

## ✨ Características

- ✅ Autenticación JWT
- ✅ Gestión de clientes
- ✅ Planes de servicio
- ✅ Facturación automática
- ✅ Panel de administración
- ✅ Integración con MikroTik (opcional)
- ✅ Notificaciones WhatsApp (opcional)

## 🏗️ Arquitectura

### Backend
- **FastAPI** 0.111.0 - API REST moderno
- **SQLAlchemy** 2.0.30 - ORM para base de datos
- **Celery** 5.3.6 - Cola de tareas
- **Redis** - Cache y broker de mensajes
- **PostgreSQL** - Base de datos principal

### Frontend
- **React** 18.2.0 - UI moderna
- **React Router** 6.23.0 - Enrutamiento
- **Axios** 1.7.0 - Cliente HTTP
- **TailwindCSS** (si se usa) - Estilos

## 📦 Despliegue en Render.com

### Requisitos
- Cuenta en [Render.com](https://render.com) (gratuita)
- Cuenta en GitHub
- Repositorio Git con este código

### Pasos

1. **Crear repositorio en GitHub**
   ```bash
   git add .
   git commit -m "Initial SISWISP deployment"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/siswisp.git
   git push -u origin main
   ```

2. **Conectar con Render.com**
   - Ir a [https://render.com](https://render.com)
   - Crear nueva cuenta o iniciar sesión
   - Conectar con GitHub
   - Autorizar Render.com a acceder a tus repositorios

3. **Desplegar con render.yaml**
   - Render detectará automáticamente el archivo `render.yaml`
   - Hará clic en "New" → "Blueprint"
   - Selecciona tu repositorio `siswisp`
   - Render desplegará todos los servicios automáticamente

### Variables de Entorno

Las siguientes variables se configurarán automáticamente en Render:

- `DATABASE_URL` - Conexión a PostgreSQL (automática)
- `REDIS_URL` - Conexión a Redis (automática)
- `SECRET_KEY` - Generada automáticamente
- `REACT_APP_API_URL` - URL del backend (automática)

### URLs después del despliegue

- **Frontend**: `https://siswisp-frontend.onrender.com`
- **Backend API**: `https://siswisp-backend.onrender.com`
- **API Docs**: `https://siswisp-backend.onrender.com/docs`

### Credenciales por defecto

```
Email: admin@miwisp.com
Contraseña: Wisp@2026
```

⚠️ **Cambiar la contraseña después del primer login**

## 🛠️ Desarrollo Local

### Requisitos
- Python 3.13
- Node.js 20
- PostgreSQL / SQLite

### Backend
```bash
cd siswisp_backend/backend
python -m venv venv
./venv/Scripts/activate  # Windows
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd siswisp_frontend/siswisp-frontend
npm install
npm start
```

## 📝 Documentación

- [FastAPI Docs](http://localhost:8000/docs) - Swagger UI
- [React Router](https://reactrouter.com/docs) - Enrutamiento
- [SQLAlchemy](https://docs.sqlalchemy.org/) - ORM

## 📞 Soporte

Para problemas o preguntas, contacta a: [tu-email@ejemplo.com]

---

**Versión**: 1.0.0 | **Estado**: Production Ready ✅

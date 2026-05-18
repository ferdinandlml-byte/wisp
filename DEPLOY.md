# 🚀 Desplegar SISWISP en la Web

Guía paso a paso para poner tu aplicación en línea de forma **GRATIS** en 15 minutos.

## 📋 Resumen de opciones

| Plataforma | Frontend | Backend | Precio | Facilidad |
|-----------|----------|---------|--------|-----------|
| **Vercel + Railway** ⭐ | Excelente | Confiable | Gratis | Muy fácil |
| **Vercel + Fly.io** | Excelente | Muy bueno | Gratis | Fácil |
| GitHub Pages + Railway | Estático | Confiable | Gratis | Medio |

**RECOMENDADO: Vercel + Railway** ⭐

---

## ✅ OPCIÓN RECOMENDADA: Vercel + Railway

### Paso 1️⃣: Frontend en Vercel (5 minutos)

1. **Ir a [vercel.com](https://vercel.com)**
   - Click "Sign Up" → "Continue with GitHub"
   - Autoriza GitHub

2. **Importar proyecto**
   - Click "New Project"
   - Selecciona tu repo `wisp`
   - Click "Import"

3. **Configurar**
   - **Root Directory**: `siswisp_frontend/siswisp-frontend`
   - **Framework**: detecta React automáticamente
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

4. **Agregar variable de entorno**
   - En "Environment Variables":
     ```
     REACT_APP_API_URL = https://siswisp-api.railway.app
     ```
     (Cambiar con tu URL de Railway después)

5. **Deploy**
   - Click "Deploy"
   - ¡Listo! En 2-3 minutos estará en vivo

**Frontend URL**: `https://siswisp-frontend.vercel.app`

---

### Paso 2️⃣: Backend en Railway (5 minutos)

1. **Ir a [railway.app](https://railway.app)**
   - Click "Login" → "Continue with GitHub"

2. **Nuevo proyecto**
   - Click "New Project"
   - "Deploy from GitHub repo"
   - Selecciona `wisp`

3. **Railway configura automáticamente**
   - Detecta el Dockerfile
   - Comienza a hacer build

4. **Agregar variables de entorno**
   - En "Variables":
     ```
     DATABASE_URL = sqlite:///./test.db
     SECRET_KEY = tu-clave-secreta-muy-larga-aqui
     FLASK_ENV = production
     PORT = 10000
     ```

5. **Deploy**
   - Railway automáticamente despliega
   - Espera 3-5 minutos

**Backend URL**: Railway te la asigna (ej: `siswisp-api.railway.app`)

---

### Paso 3️⃣: Actualizar Frontend con URL correcta del Backend

1. Vuelve a **Vercel** → Tu proyecto
2. Settings → Environment Variables
3. Edita `REACT_APP_API_URL` con la URL correcta de Railway
4. Click "Save"
5. **Redeploy**:
   - Deployments → Click el último deploy → "Redeploy"

---

## 🌐 URLs finales

| Componente | URL | Notas |
|-----------|-----|-------|
| **Frontend** | https://siswisp-frontend.vercel.app | Clonable en Vercel |
| **Backend** | https://siswisp-api.railway.app | Railway asigna URL |
| **Health Check** | https://siswisp-api.railway.app/health | Verifica que funciona |

---

## 🔑 Login en Producción

```
Email:    admin@miwisp.com
Password: Wisp@2026
```

**Importante**: Cambiar después de primer login!

---

## ✨ ALTERNATIVA: Vercel + Fly.io

Si prefieres Fly.io para el backend:

### Instalar CLI de Fly.io

```bash
# macOS
brew install flyctl

# Windows
# Descargar desde https://fly.io/docs/hands-on/install/
# O con scoop:
scoop install flyctl

# Linux
curl -L https://fly.io/install.sh | sh
```

### Crear cuenta y desplegar

```bash
# 1. Crear cuenta
flyctl auth signup

# 2. Ir a tu proyecto
cd wisp

# 3. Desplegar
flyctl launch
# - App name: siswisp-backend
# - Region: elige cercano
# - Database: skip

# 4. Configurar variables
flyctl secrets set \
  DATABASE_URL=sqlite:///./test.db \
  SECRET_KEY=tu-clave-super-secreta \
  FLASK_ENV=production

# 5. Deploy
flyctl deploy
```

**Backend URL**: `https://siswisp-backend.fly.dev`

---

## 🐛 Troubleshooting

### ❌ CORS error en Frontend

```
XMLHttpRequest blocked by CORS
```

**Solución**:
1. Verifica que `REACT_APP_API_URL` en Vercel es correcta
2. Espera 5 minutos a que Vercel redeploy
3. Limpia caché: Ctrl+Shift+Del (o Cmd+Shift+Del en Mac)

### ❌ Backend retorna 502 Bad Gateway

```bash
# En Railway, revisar logs:
railway logs

# Recrear build:
railway up
```

### ❌ "Database not found"

**Solución**: 
- Railway crea `test.db` automáticamente en primer run
- Espera 2-3 minutos después del primer deploy

### ❌ API timeout

**Railway**: Aumentar timeout en settings
**Solución**: Es normal en free tier, esperar respuesta

---

## 📊 Costos

| Plataforma | Costo | Límites |
|-----------|-------|---------|
| **Vercel** | Gratis | Sin límite de requests |
| **Railway** | Gratis | $5/mes de créditos |
| **Fly.io** | Gratis | 3 apps máximo |

**Total de SISWISP**: **COMPLETAMENTE GRATIS** ✅

---

## ✔️ Checklist final

- [ ] Frontend en Vercel funcionando
- [ ] Backend en Railway/Fly.io funcionando
- [ ] `REACT_APP_API_URL` actualizado en Vercel
- [ ] Vercel re-deployado
- [ ] Puedo loguearme en la web
- [ ] API responde correctamente

---

## 🚀 Resumen rápido

```
1. Vercel + Railroad setup script listo ✅
2. vercel.json en frontend ✅
3. railway.toml en raíz ✅
4. Dockerfile funciona ✅

Solo sigue los 3 pasos de arriba = ¡En la web en 15 minutos!
```

---

**¡Ahora tu app estará en internet! 🎉**
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

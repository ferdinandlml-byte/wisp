# SISWISP Setup Guide

Complete setup instructions for the SISWISP ISP Management System.

## Quick Start

### Option 1: Local Development (Recommended for Testing)

#### Backend Setup
```bash
cd siswisp_backend/backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

pip install -r requirements.txt

# Create initial admin user
python create_admin_user.py
# Default: admin@miwisp.com / Wisp@2026

# Run the application
python run.py
```

Backend runs at: **http://localhost:10000**

Test the API:
```bash
curl http://localhost:10000/health
# Expected: {"status": "ok"}
```

#### Frontend Setup
```bash
cd siswisp_frontend/siswisp-frontend
npm install
npm start
```

Frontend runs at: **http://localhost:3000**

### Option 2: Docker Development

```bash
# Build Docker image
docker build -t siswisp-backend siswisp_backend/

# Run container
docker run -p 10000:10000 \
  -e DATABASE_URL=sqlite:///./test.db \
  -e SECRET_KEY=dev-secret-key \
  siswisp-backend
```

## Deployment to Render.com

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Deploy SISWISP"
git push origin main
```

### Step 2: Create Render Blueprint
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Blueprint"
3. Connect GitHub repository
4. Select this repository
5. Render automatically detects `render.yaml`

### Step 3: Configure Environment Variables
In Render Dashboard → Environment:
- `DATABASE_URL`: Leave as SQLite for free tier, or add PostgreSQL URL
- `SECRET_KEY`: Generate a strong secret key

```bash
# Generate secret key
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 4: Deploy
- Click "Deploy Blueprint"
- Wait for services to start (~5-10 minutes)

**Services Created:**
- Backend: `https://siswisp-backend.onrender.com`
- Frontend: `https://siswisp-frontend.onrender.com`

## API Authentication

### Login & Get Token
```bash
curl -X POST http://localhost:10000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@miwisp.com",
    "password": "Wisp@2026"
  }'
```

Response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@miwisp.com"
  }
}
```

### Use Token in Requests
```bash
curl -X GET http://localhost:10000/api/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Database

### Initialize Database
The database initializes automatically on first run. To reset:

```bash
# Backend directory
rm test.db  # Delete SQLite file
python run.py  # Restart, creates fresh database
```

### Create Admin User
```bash
python create_admin_user.py
```

### Database Schema
See `SISWISP/siswisp_backend/backend/app/models/__init__.py` for:
- User model
- Plan model
- Client model
- Payment model

## Troubleshooting

### Backend Not Starting
```bash
# Check Python version
python --version  # Should be 3.9+

# Check dependencies
pip list | grep -i flask

# Check port availability
netstat -an | grep 10000  # On Windows: netstat -ano | findstr :10000

# Run with verbose output
python -u run.py
```

### Frontend Connection Issues
Edit `siswisp_frontend/siswisp-frontend/.env`:
```
REACT_APP_API_URL=http://localhost:10000
```

### CORS Errors
Verify Flask CORS configuration in `siswisp_backend/backend/app/main.py`:
```python
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "PATCH"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
```

### JWT Token Issues
- Token expires after 24 hours
- Generate new token via login endpoint
- Check SECRET_KEY matches between runs

## Performance Tips

### Local Development
- Use SQLite (default) for simplicity
- Debug mode: Set `FLASK_ENV=development` in .env
- Frontend Hot Reload: Automatic with `npm start`

### Production (Render.com)
- Use PostgreSQL for persistence (recommended)
- Backend: Free tier has 50-hour/month limit with 15-minute spindown
- Frontend: Deployed alongside backend
- Monitor with Render Dashboard

## Project Structure

```
siswisp/
├── README.md               # This documentation
├── SETUP.md               # Setup instructions
├── render.yaml            # Deployment configuration
├── .gitignore             # Git ignore patterns
│
├── siswisp_backend/
│   ├── Dockerfile         # Docker configuration
│   ├── render.yaml
│   └── backend/
│       ├── app/
│       │   ├── main.py                # Flask app factory
│       │   ├── api/routes/            # API endpoints
│       │   ├── core/                  # Database, security, config
│       │   ├── models/                # ORM models
│       │   ├── schemas/               # Data validation
│       │   └── services/              # Business logic
│       ├── requirements.txt           # Python dependencies
│       ├── run.py                     # Application entry point
│       └── create_admin_user.py       # Admin user creation script
│
└── siswisp_frontend/
    └── siswisp-frontend/
        ├── package.json               # NPM dependencies
        ├── public/
        └── src/
            ├── api/                   # API client
            ├── components/            # React components
            ├── pages/                 # Page components
            ├── context/               # Context providers
            └── App.jsx                # Root component
```

## Security Checklist

- [ ] Change SECRET_KEY in production
- [ ] Use strong, unique passwords
- [ ] Keep dependencies updated
- [ ] Review CORS configuration for your domain
- [ ] Use HTTPS in production (Render provides free SSL)
- [ ] Monitor logs for suspicious activity
- [ ] Backup database regularly (if using persistent storage)

## Next Steps

1. ✅ Setup complete
2. 📝 Create your first service plan
3. 👥 Add clients
4. 💳 Manage payments
5. 📊 Monitor dashboard statistics

## Support

For issues or questions:
1. Check [GitHub Issues](https://github.com/ferdinandlml-byte/wisp/issues)
2. Review API documentation in README.md
3. Check application logs in Render Dashboard
4. Open a new GitHub Issue with details

---

**Happy managing! 🚀**

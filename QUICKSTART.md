# SISWISP Quick Start Guide

Get SISWISP running in minutes!

## ⚡ Fastest Way (5 minutes)

### Windows
```bash
git clone https://github.com/ferdinandlml-byte/wisp.git
cd wisp
setup.bat
```

### macOS/Linux
```bash
git clone https://github.com/ferdinandlml-byte/wisp.git
cd wisp
chmod +x setup.sh
./setup.sh
```

Done! The script will:
- ✅ Create Python environment
- ✅ Install dependencies
- ✅ Setup database
- ✅ Create admin user

Then start the app:
```bash
# Terminal 1: Backend
cd siswisp_backend/backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python run.py

# Terminal 2: Frontend (new terminal)
cd siswisp_frontend/siswisp-frontend
npm start
```

Visit: http://localhost:3000

---

## 🐳 Using Docker (Even Faster)

```bash
git clone https://github.com/ferdinandlml-byte/wisp.git
cd wisp
docker-compose up
```

Visit: http://localhost:3000

That's it! Both frontend and backend are running.

---

## 🔑 Default Credentials

```
Email:    admin@miwisp.com
Password: Wisp@2026
```

---

## 🚀 URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:10000
- **Health Check**: http://localhost:10000/health

---

## 📝 Next Steps

1. **Login** with admin credentials
2. **Create a plan** (Plans → Add Plan)
3. **Add clients** (Clients → Add Client)
4. **Manage payments** (Payments)
5. **Check dashboard** (Dashboard)

---

## 🆘 Troubleshooting

### "Port already in use"
```bash
# Change port in run.py or environment variable
export PORT=10001  # or set PORT=10001 on Windows
```

### "Python not found"
- Install Python 3.9+ from python.org

### "npm not found"
- Install Node.js from nodejs.org

### "Docker not found"
- Install Docker Desktop from docker.com

### "Module not found"
```bash
# Reinstall dependencies
cd siswisp_backend/backend
pip install -r requirements.txt --force-reinstall
```

---

## 📚 Learn More

- [README.md](README.md) - Full documentation
- [SETUP.md](SETUP.md) - Detailed setup guide
- [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute

---

**Happy coding! 🎉**

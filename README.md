# SISWISP - ISP Management System

A complete ISP (Internet Service Provider) management platform built with Flask backend and React frontend. Manage clients, service plans, payments, and network configurations in one unified dashboard.

## 🌟 Features

- **User Management**
  - User registration and authentication with JWT
  - Role-based access control (admin/user)
  - Secure password hashing with bcrypt

- **Client Management**
  - Create, read, update, delete client records
  - Track client status (active, suspended, cancelled)
  - Assign service plans to clients
  - Client filtering and search capabilities

- **Plans & Services**
  - Define and manage service plans
  - Track download/upload speeds
  - Set pricing per plan

- **Billing & Payments**
  - Payment tracking and management
  - Monthly billing cycle management
  - Payment status tracking (pending, paid, overdue)
  - Dashboard statistics for ISP operator

- **Dashboard**
  - Real-time statistics overview
  - Client metrics (active, suspended, cancelled)
  - Revenue tracking (monthly, pending)
  - Payment status summary

## 🏗️ Architecture

```
siswisp/
├── siswisp_backend/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── routes/          # API endpoint handlers
│   │   │   │   │   ├── flask_auth.py
│   │   │   │   │   ├── flask_clients.py
│   │   │   │   │   ├── flask_payments.py
│   │   │   │   │   └── flask_plans.py
│   │   │   │   ├── core/            # Core utilities
│   │   │   │   │   ├── config.py
│   │   │   │   │   ├── database.py
│   │   │   │   │   └── security.py
│   │   │   │   ├── models/          # SQLAlchemy ORM models
│   │   │   │   ├── schemas/         # Pydantic validation models
│   │   │   │   └── services/        # Business logic
│   │   │   └── main.py              # Flask app factory
│   │   ├── requirements.txt
│   │   ├── run.py                   # Application entry point
│   │   └── Dockerfile
│   └── render.yaml                  # Deployment config
├── siswisp_frontend/
│   └── siswisp-frontend/            # React application
│       ├── public/
│       ├── src/
│       │   ├── components/          # React components
│       │   ├── pages/               # Page components
│       │   ├── hooks/               # Custom React hooks
│       │   ├── api/                 # API client
│       │   └── context/             # Context providers
│       └── package.json
└── README.md
```

## 🔧 Technology Stack

### Backend
- **Framework**: Flask 3.0.0
- **ORM**: SQLAlchemy 2.0.30
- **Database**: SQLite (development), PostgreSQL (production)
- **Authentication**: JWT (PyJWT 2.7.0)
- **Password Hashing**: bcrypt 4.1.3
- **API Documentation**: Flask-RESTful patterns

### Frontend
- **Framework**: React 18.2.0
- **HTTP Client**: Axios
- **State Management**: React Context API
- **UI Notifications**: react-hot-toast
- **Build Tool**: Create React App

### Deployment
- **Container**: Docker
- **Platform**: Render.com
- **Infrastructure as Code**: render.yaml

## 📦 Installation

### Quick Start (Recommended)

Clone and run with a single command:

#### Windows
```bash
git clone https://github.com/ferdinandlml-byte/wisp.git
cd wisp
setup.bat
```

#### Linux/Mac
```bash
git clone https://github.com/ferdinandlml-byte/wisp.git
cd wisp
chmod +x setup.sh
./setup.sh
```

This will:
- Create Python virtual environment
- Install all dependencies (backend & frontend)
- Initialize database with admin user
- Set up environment variables

Default credentials: `admin@miwisp.com` / `Wisp@2026`

### Using Docker Compose

Start both backend and frontend with Docker:

```bash
git clone https://github.com/ferdinandlml-byte/wisp.git
cd wisp
docker-compose up
```

Then visit:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:10000

### Prerequisites
- Python 3.9+
- Node.js 16+
- Docker & Docker Compose (optional)
- pip (Python package manager)
- npm (Node package manager)

### Manual Setup

**Backend Setup:**
```bash
cd siswisp_backend/backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python create_admin_user.py
python run.py
```

**Frontend Setup:**
```bash
cd siswisp_frontend/siswisp-frontend
npm install
npm start
```

## 🚀 Deployment

### Local Development (Recommended for GitHub)

The easiest way to run SISWISP is locally using the provided setup scripts or Docker Compose:

**Quick Start:**
```bash
setup.bat  # Windows
# OR
./setup.sh  # Linux/Mac
```

**With Docker:**
```bash
docker-compose up
```

### Production Deployment

For production environments, you can deploy to:

- **Docker Container**: Use the included `Dockerfile`
- **Cloud Platforms**: AWS, Heroku, DigitalOcean, etc.
- **VPS**: Traditional virtual private servers

#### Using Docker for Production

```bash
docker build -t siswisp-backend siswisp_backend/
docker run -p 10000:10000 \
  -e DATABASE_URL=postgresql://user:pass@localhost/siswisp \
  -e SECRET_KEY=your-production-secret \
  siswisp-backend
```

#### Environment Variables for Production

```bash
# Backend
DATABASE_URL=postgresql://user:password@host:port/database
SECRET_KEY=your-very-secret-key-change-this
FLASK_ENV=production
PORT=10000

# Frontend
REACT_APP_API_URL=https://your-api-domain.com
```

### Deployment with Render.com (Optional)

If you want to deploy to Render.com:

1. Connect GitHub repository to Render
2. Use the `render.yaml` configuration
3. Set environment variables in Render dashboard
4. Push to main branch to auto-deploy

## 📚 API Documentation

### Authentication Endpoints

**Register User**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure_password123"
}
```

**Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure_password123"
}
```

Response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "is_superuser": true
  }
}
```

**Get Current User**
```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

### Client Endpoints

**List Clients**
```http
GET /api/clients?status=ACTIVE&search=name&page=1
Authorization: Bearer <access_token>
```

**Create Client**
```http
POST /api/clients
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Client Name",
  "email": "client@example.com",
  "phone": "+1234567890",
  "ip_address": "192.168.1.100",
  "plan_id": 1
}
```

### Plans Endpoints

**List Plans**
```http
GET /api/plans
Authorization: Bearer <access_token>
```

**Create Plan**
```http
POST /api/plans
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Premium Plan",
  "speed_down": 100,
  "speed_up": 50,
  "price": 99.99,
  "description": "Premium high-speed internet"
}
```

### Payments Endpoints

**List Payments**
```http
GET /api/payments?client_id=1&status=PENDING
Authorization: Bearer <access_token>
```

**Dashboard Statistics**
```http
GET /api/dashboard/stats
Authorization: Bearer <access_token>
```

Response:
```json
{
  "total_clients": 150,
  "active_clients": 120,
  "suspended_clients": 20,
  "cancelled_clients": 10,
  "pending_payments": 45,
  "overdue_payments": 12,
  "monthly_income": 12000,
  "pending_income": 4500
}
```

## 🔐 Security

- All passwords are hashed using bcrypt with 12 salt rounds
- JWT tokens expire after 24 hours
- CORS enabled for frontend communication
- Environment variables for sensitive data
- HTTPS enforced in production
- SQL injection protection via SQLAlchemy ORM

## 📝 Environment Variables

### Backend (.env)
```
DATABASE_URL=sqlite:///./test.db
SECRET_KEY=your-secret-key-change-in-production
FLASK_ENV=production
PORT=10000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:10000
```

## 🧪 Testing

### Backend Tests
```bash
cd siswisp_backend/backend
python -m pytest
```

### Frontend Tests
```bash
cd siswisp_frontend/siswisp-frontend
npm test
```

## 📊 Database Models

### User
- id (Primary Key)
- name
- email (Unique)
- hashed_password
- is_active
- is_superuser
- created_at

### Plan
- id (Primary Key)
- name
- speed_down
- speed_up
- price
- description
- is_active
- created_at

### Client
- id (Primary Key)
- name
- phone
- email
- ip_address
- status (Enum: ACTIVE, SUSPENDED, CANCELLED)
- plan_id (Foreign Key)
- billing_day
- created_at
- updated_at

### Payment
- id (Primary Key)
- client_id (Foreign Key)
- amount
- month
- year
- due_date
- paid_at
- status (Enum: PENDING, PAID, OVERDUE)
- created_at

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Support

For support, email support@siswisp.com or open an issue on GitHub.

## 🙏 Acknowledgments

- Flask documentation and community
- React documentation and best practices
- SQLAlchemy ORM framework
- Render.com deployment platform

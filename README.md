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

### Prerequisites
- Python 3.9+
- Node.js 16+
- pip (Python package manager)
- npm (Node package manager)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/ferdinandlml-byte/wisp.git
   cd wisp
   ```

2. **Create Python virtual environment**
   ```bash
   cd siswisp_backend/backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Initialize database**
   ```bash
   python create_admin_user.py  # Create initial admin user
   ```

6. **Run application**
   ```bash
   python run.py
   ```

   Backend will be available at `http://localhost:10000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd siswisp_frontend/siswisp-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set environment variables**
   ```bash
   cp .env.example .env
   # Configure REACT_APP_API_URL to point to backend
   ```

4. **Run development server**
   ```bash
   npm start
   ```

   Frontend will be available at `http://localhost:3000`

## 🚀 Deployment

### Deploy to Render.com

1. **Connect GitHub repository**
   - Link your GitHub account to Render.com
   - Select this repository

2. **Deploy using Blueprint**
   ```bash
   # render.yaml contains infrastructure as code
   # Render will automatically detect and deploy both services
   ```

3. **Configure environment variables**
   - `DATABASE_URL`: PostgreSQL connection string
   - `SECRET_KEY`: JWT secret key (generate a strong one)

4. **Deploy**
   - Push to main branch
   - Render will automatically build and deploy

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

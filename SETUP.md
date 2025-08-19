# CareLens Setup Guide

## Project Structure

```
CareLens/
├── backend/                    # FastAPI backend application
│   ├── app/                   # Application code
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables
│   └── start_backend.py       # Backend startup script
├── frontend/                  # Next.js frontend (production)
├── client/                    # Next.js frontend (development)
│   ├── app/                   # Next.js app directory
│   ├── components/            # UI components
│   ├── src/                   # Source code
│   └── package.json           # Frontend dependencies
├── docs/                      # Documentation
├── server/                    # Development proxy server
└── shared/                    # Shared types and schemas
```

## Prerequisites

- **Node.js 18+** and npm
- **Python 3.8+** with pip
- **Redis 6.0+** (optional for session management)
- **Git 2.30+**

## Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/atharhive/CareLens.git
cd CareLens
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Copy environment configuration
cp .env.example .env
# Edit .env with your settings if needed

# Start the backend server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory (choose one)
cd frontend  # or cd client

# Install dependencies (Note: Use packager_tool if in Replit environment)
npm install

# Start the frontend development server
npm run dev
```

## Development Servers

### Option 1: Run Both Services Separately (Recommended)

**Terminal 1: Backend (FastAPI)**
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2: Frontend (Next.js)**
```bash
cd client
npm run dev
```

### Option 2: Development Proxy (Alternative)
```bash
# Start the development proxy server (serves frontend only)
npm run dev
```

## Access Points

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Development Proxy**: http://localhost:5000

## Environment Configuration

### Backend (.env)
```bash
FASTAPI_ENV=development
DEBUG=true
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5000"]
REDIS_URL=redis://localhost:6379/0
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Production Deployment

### 1. Backend Deployment
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### 2. Frontend Deployment
```bash
cd frontend  # or client
npm run build
npm start
```

## Features & Testing

### Backend Features
- ✅ FastAPI application with automatic OpenAPI documentation
- ✅ Health check endpoints (`/health`)
- ✅ ML model registry and risk assessment
- ✅ Document processing and OCR
- ✅ Provider search and care finder
- ✅ Session management with privacy controls

### Frontend Features  
- ✅ Next.js application with React 19
- ✅ Backend connectivity status monitoring
- ✅ Comprehensive health assessment forms
- ✅ Risk visualization and results
- ✅ Provider search interface
- ✅ Responsive healthcare-themed UI

### Testing Backend Connection
```bash
# Test backend health
curl http://localhost:8000/health

# Test API documentation
open http://localhost:8000/docs
```

## Development Notes

- The development server at port 5000 serves as a proxy and provides basic routing
- For full functionality, run both frontend and backend separately
- The frontend automatically detects backend connectivity status
- All user data is temporarily stored and auto-deleted for privacy compliance

## Troubleshooting

### Backend Issues
- Ensure Python 3.8+ is installed
- Install dependencies: `pip install -r backend/requirements.txt`
- Check port 8000 is available
- Verify environment variables in `.env`

### Frontend Issues  
- Ensure Node.js 18+ is installed
- Install dependencies: `npm install` (in client or frontend directory)
- Check port 3000 is available
- Verify API URL in environment variables

### Connection Issues
- Backend must be running on port 8000
- Frontend will show connection status in the header
- CORS settings must include frontend URL

## Documentation

- **API Documentation**: Available at `/docs` when backend is running
- **User Guide**: See `docs/user-guide.md`
- **Developer Guide**: See `docs/developer-guide.md`
- **API Reference**: See `docs/api.md`
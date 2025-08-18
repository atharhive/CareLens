#!/bin/bash

# CareLens Setup Verification Script
echo "🔍 CareLens Setup Verification"
echo "============================"

# Check Node.js
echo "📦 Checking Node.js..."
if command -v node &> /dev/null; then
    echo "✅ Node.js version: $(node --version)"
else
    echo "❌ Node.js not found"
fi

# Check npm
echo "📦 Checking npm..."
if command -v npm &> /dev/null; then
    echo "✅ npm version: $(npm --version)"
else
    echo "❌ npm not found"
fi

# Check Python
echo "🐍 Checking Python..."
if command -v python3 &> /dev/null; then
    echo "✅ Python version: $(python3 --version)"
elif command -v python &> /dev/null; then
    echo "✅ Python version: $(python --version)"
else
    echo "❌ Python not found"
fi

# Check pip
echo "📦 Checking pip..."
if command -v pip3 &> /dev/null; then
    echo "✅ pip3 found"
elif command -v pip &> /dev/null; then
    echo "✅ pip found"
else
    echo "❌ pip not found"
fi

# Check Redis (optional)
echo "🗄️ Checking Redis..."
if command -v redis-server &> /dev/null; then
    echo "✅ Redis server found"
elif command -v redis-cli &> /dev/null; then
    echo "✅ Redis CLI found"
else
    echo "⚠️ Redis not found (optional for session management)"
fi

echo ""
echo "📁 Project Structure:"
echo "==================="

# Check directories
for dir in "backend" "client" "frontend" "docs" "server" "shared"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir/ directory exists"
    else
        echo "❌ $dir/ directory missing"
    fi
done

echo ""
echo "📄 Configuration Files:"
echo "======================"

# Check configuration files
for file in "backend/.env" "backend/.env.example" "client/.env.local" "client/.env.example" "SETUP.md"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo ""
echo "🔧 Dependencies:"
echo "==============="

# Check frontend dependencies
if [ -f "client/package.json" ]; then
    echo "📦 Frontend package.json found"
    if [ -d "client/node_modules" ]; then
        echo "✅ Frontend dependencies installed"
    else
        echo "⚠️ Frontend dependencies not installed (run: cd client && npm install)"
    fi
else
    echo "❌ Frontend package.json missing"
fi

# Check backend dependencies
if [ -f "backend/requirements.txt" ]; then
    echo "📦 Backend requirements.txt found"
    echo "⚠️ Backend dependencies status unclear (run: cd backend && pip install -r requirements.txt)"
else
    echo "❌ Backend requirements.txt missing"
fi

echo ""
echo "🚀 Quick Start Commands:"
echo "======================="
echo "1. Backend:  cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo "2. Frontend: cd client && npm run dev"
echo ""
echo "🌐 Access URLs:"
echo "=============="
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8000"
echo "Backend Docs: http://localhost:8000/docs"
echo ""
echo "📚 Documentation:"
echo "================"
echo "Setup Guide: SETUP.md"
echo "Frontend: client/README.md"
echo "Backend: backend/README.md"
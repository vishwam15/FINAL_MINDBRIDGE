#!/bin/bash
# Setup and Run Script for MindBridge with College System
# This script sets up and runs the complete application

echo "🚀 MindBridge Setup and Run Script"
echo "=================================="

# Step 1: Check Node.js and npm
echo -e "\n✓ Step 1: Checking Node.js and npm..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js from https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js $(node --version)"
echo "✅ npm $(npm --version)"

# Step 2: Navigate to project
echo -e "\n✓ Step 2: Setting up project directories..."
cd "$(dirname "$0")" || exit
echo "✅ Current directory: $(pwd)"

# Step 3: Install backend dependencies
echo -e "\n✓ Step 3: Installing backend dependencies..."
cd backend || exit
if [ ! -d "node_modules" ]; then
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Step 4: Check .env file
echo -e "\n✓ Step 4: Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating with defaults..."
    cat > .env << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=mentalhealthsys

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_this
JWT_EXPIRES_IN=7d

# Email Configuration (Optional)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Frontend URL
FRONTEND_URL=http://127.0.0.1:5500

# Google Gemini API Key (Optional)
GEMINI_API_KEY=your_api_key_here
EOF
    echo "⚠️  Created .env file - Update credentials in: backend/.env"
else
    echo "✅ .env file exists"
fi

# Step 5: Start the server
echo -e "\n✓ Step 5: Starting server..."
echo "🔄 Starting Node.js server on http://localhost:5000"
echo "📝 Press Ctrl+C to stop the server"
echo ""
node server.js

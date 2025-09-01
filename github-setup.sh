#!/bin/bash

# FlashCard Platform - GitHub Setup Script
# This script helps set up Git repositories for both frontend and backend

echo "🎓 FlashCard Platform - GitHub Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi

print_info "Setting up Git repositories..."

# Backend setup
echo ""
echo "📁 Setting up Backend Repository"
echo "--------------------------------"

cd backend

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
    git init
    print_status "Git repository initialized"
else
    print_info "Git repository already exists"
fi

# Add files
git add .
git status

echo ""
print_info "Ready to commit backend files"
print_warning "Next steps for backend:"
echo "1. git commit -m 'Initial backend setup with authentication and AI features'"
echo "2. Create a new repository on GitHub (e.g., flashcard-platform-backend)"
echo "3. git remote add origin <your-backend-repo-url>"
echo "4. git branch -M main"
echo "5. git push -u origin main"

cd ..

# Frontend setup
echo ""
echo "🎨 Setting up Frontend Repository"
echo "---------------------------------"

cd frontend

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
    git init
    print_status "Git repository initialized"
else
    print_info "Git repository already exists"
fi

# Add files
git add .
git status

echo ""
print_info "Ready to commit frontend files"
print_warning "Next steps for frontend:"
echo "1. git commit -m 'Initial frontend setup with React, Tailwind, and learning features'"
echo "2. Create a new repository on GitHub (e.g., flashcard-platform-frontend)"
echo "3. git remote add origin <your-frontend-repo-url>"
echo "4. git branch -M main"
echo "5. git push -u origin main"

cd ..

echo ""
echo "🚀 Deployment Information"
echo "========================"

print_info "Backend Deployment Options:"
echo "• Heroku: heroku create your-app-name && git push heroku main"
echo "• Railway: railway login && railway deploy"
echo "• Render: Connect GitHub repo in Render dashboard"
echo "• Vercel: vercel --prod (install vercel CLI first)"

print_info "Frontend Deployment Options:"
echo "• Vercel: vercel --prod (automatic with GitHub integration)"
echo "• Netlify: netlify deploy --prod (install netlify CLI first)"
echo "• GitHub Pages: Enable in repository settings"

echo ""
print_info "Environment Variables for Production:"
echo "Backend (.env):"
echo "• MONGO_URI=<your-mongodb-atlas-connection-string>"
echo "• JWT_SECRET=<generate-secure-secret>"
echo "• PORT=5003"

echo ""
echo "Frontend (.env):"
echo "• VITE_API_URL=<your-deployed-backend-url>"

echo ""
print_status "Setup complete! Follow the next steps above to push to GitHub."

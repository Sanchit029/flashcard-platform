#!/bin/bash

# GitHub Repository Creation Script
# This script helps create GitHub repositories and push your code

echo "🚀 GitHub Repository Setup for FlashCard Platform"
echo "================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo ""
print_info "STEP 1: Install GitHub CLI (if not already installed)"
echo "Run this command in your terminal:"
echo "brew install gh"
echo ""
print_warning "After installing, run: gh auth login"
echo ""

echo ""
print_info "STEP 2: Create and Push Backend Repository"
echo "----------------------------------------"
echo "cd /Users/sanchitbishnoi/Desktop/Project-7/backend"
echo "gh repo create flashcard-platform-backend --public --description 'Node.js/Express backend for FlashCard Learning Platform with JWT auth and AI features'"
echo "git remote add origin https://github.com/\$(gh api user --jq .login)/flashcard-platform-backend.git"
echo "git branch -M main"
echo "git push -u origin main"
echo ""

echo ""
print_info "STEP 3: Create and Push Frontend Repository"
echo "-----------------------------------------"
echo "cd /Users/sanchitbishnoi/Desktop/Project-7/frontend"
echo "gh repo create flashcard-platform-frontend --public --description 'React/Vite frontend for FlashCard Learning Platform with Tailwind CSS and 3D animations'"
echo "git remote add origin https://github.com/\$(gh api user --jq .login)/flashcard-platform-frontend.git"
echo "git branch -M main"
echo "git push -u origin main"
echo ""

print_success "After running these commands, your repositories will be available at:"
echo "• Backend: https://github.com/[your-username]/flashcard-platform-backend"
echo "• Frontend: https://github.com/[your-username]/flashcard-platform-frontend"
echo ""

print_info "ALTERNATIVE: Manual GitHub Repository Creation"
echo "=============================================="
echo ""
print_warning "If you prefer to create repositories manually:"
echo ""
echo "1. Go to https://github.com/new"
echo "2. Create repository: 'flashcard-platform-backend'"
echo "3. Make it public, don't initialize with README"
echo "4. Copy the repository URL"
echo ""
echo "Then run:"
echo "cd /Users/sanchitbishnoi/Desktop/Project-7/backend"
echo "git remote add origin [paste-your-backend-repo-url]"
echo "git branch -M main"
echo "git push -u origin main"
echo ""
echo "Repeat for frontend with repository name: 'flashcard-platform-frontend'"
echo ""

print_info "Repository Contents Ready:"
echo "• Backend: Complete Node.js API with authentication"
echo "• Frontend: Full React application with modern UI"
echo "• Documentation: Comprehensive README files"
echo "• All code committed and ready to push"

echo ""
print_success "🎯 Your FlashCard Platform is ready for GitHub!"

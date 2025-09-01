# GitHub Repository Push Commands
# Replace [YOUR-GITHUB-USERNAME] with your actual GitHub username

# ===========================================
# BACKEND REPOSITORY PUSH
# ===========================================

# 1. Navigate to backend directory
cd /Users/sanchitbishnoi/Desktop/Project-7/backend

# 2. Add your GitHub repository as remote origin
# Replace [YOUR-GITHUB-USERNAME] with your actual username
git remote add origin https://github.com/[YOUR-GITHUB-USERNAME]/flashcard-platform-backend.git

# 3. Rename branch to main (GitHub's default)
git branch -M main

# 4. Push code to GitHub
git push -u origin main

# ===========================================
# FRONTEND REPOSITORY PUSH
# ===========================================

# 1. Navigate to frontend directory
cd /Users/sanchitbishnoi/Desktop/Project-7/frontend

# 2. Add your GitHub repository as remote origin
# Replace [YOUR-GITHUB-USERNAME] with your actual username
git remote add origin https://github.com/[YOUR-GITHUB-USERNAME]/flashcard-platform-frontend.git

# 3. Rename branch to main (GitHub's default)
git branch -M main

# 4. Push code to GitHub
git push -u origin main

# ===========================================
# AFTER PUSHING - YOUR REPOSITORIES WILL BE:
# ===========================================
# Backend:  https://github.com/[YOUR-GITHUB-USERNAME]/flashcard-platform-backend
# Frontend: https://github.com/[YOUR-GITHUB-USERNAME]/flashcard-platform-frontend

# ===========================================
# VERIFICATION COMMANDS
# ===========================================
# Check if remotes are set correctly:
# cd /Users/sanchitbishnoi/Desktop/Project-7/backend && git remote -v
# cd /Users/sanchitbishnoi/Desktop/Project-7/frontend && git remote -v

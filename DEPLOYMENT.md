# 🚀 FlashCard Platform - Deployment Guide

This guide helps you deploy both the frontend and backend of the FlashCard Platform to production.

## 📋 Pre-Deployment Checklist

### ✅ Repository Setup
- [ ] Backend repository committed and ready
- [ ] Frontend repository committed and ready
- [ ] Environment variables documented
- [ ] README files updated with deployment info

### ✅ Production Requirements
- [ ] MongoDB Atlas account (for backend database)
- [ ] Secure JWT secret generated
- [ ] API endpoints tested locally
- [ ] CORS settings configured for production URLs

## 🏗️ Backend Deployment

### Option 1: Heroku (Recommended for beginners)

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   
   # Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login and create app**
   ```bash
   cd backend
   heroku login
   heroku create flashcard-platform-backend
   ```

3. **Set environment variables**
   ```bash
   heroku config:set MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/flashcard-platform
   heroku config:set JWT_SECRET=your-super-secure-jwt-secret-here
   heroku config:set PORT=5003
   ```

4. **Deploy**
   ```bash
   git push heroku main
   heroku logs --tail
   ```

5. **Your backend URL**: `https://flashcard-platform-backend.herokuapp.com`

### Option 2: Railway

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and deploy**
   ```bash
   cd backend
   railway login
   railway new
   railway up
   ```

3. **Set environment variables in Railway dashboard**

### Option 3: Render

1. Connect your GitHub repository
2. Set environment variables in dashboard
3. Deploy automatically on push

## 🎨 Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Create production environment file**
   ```bash
   cd frontend
   echo "VITE_API_URL=https://your-backend-url.herokuapp.com" > .env.production
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Or connect GitHub for automatic deployments**

### Option 2: Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build and deploy**
   ```bash
   cd frontend
   npm run build
   netlify deploy --prod --dir=dist
   ```

3. **Set environment variables in Netlify dashboard**

### Option 3: GitHub Pages

1. **Install gh-pages**
   ```bash
   cd frontend
   npm install --save-dev gh-pages
   ```

2. **Update package.json**
   ```json
   {
     "homepage": "https://yourusername.github.io/flashcard-platform-frontend",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. **Deploy**
   ```bash
   npm run deploy
   ```

## 🗄️ Database Setup (MongoDB Atlas)

1. **Create MongoDB Atlas account**
   - Go to https://cloud.mongodb.com
   - Create a free cluster

2. **Setup database access**
   ```
   Database Access → Add Database User
   Username: flashcard-user
   Password: [Generate secure password]
   ```

3. **Setup network access**
   ```
   Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)
   ```

4. **Get connection string**
   ```
   Clusters → Connect → Connect your application
   Copy: mongodb+srv://username:password@cluster.mongodb.net/flashcard-platform
   ```

## 🔐 Environment Variables

### Backend (.env for production)
```env
NODE_ENV=production
PORT=5003
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/flashcard-platform
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

### Frontend (.env.production)
```env
VITE_API_URL=https://your-backend-domain.herokuapp.com
```

## 🔧 Production Configuration

### Update CORS for production
In `backend/index.js`:
```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-frontend-domain.vercel.app',
    'https://your-frontend-domain.netlify.app'
  ],
  credentials: true
}));
```

### Update API base URL
In `frontend/src/utils/api.js`:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';
```

## 📊 Post-Deployment Testing

### 1. Test Backend API
```bash
# Test health endpoint
curl https://your-backend-url.herokuapp.com/health

# Test authentication
curl -X POST https://your-backend-url.herokuapp.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"password123"}'
```

### 2. Test Frontend
- [ ] Registration/Login works
- [ ] PDF upload processes correctly
- [ ] Flashcards generate and display
- [ ] Quiz functionality works
- [ ] Dashboard saves/loads data

### 3. Test Integration
- [ ] Frontend connects to backend
- [ ] Authentication persists across sessions
- [ ] Data saves to database
- [ ] CORS allows frontend requests

## 🚨 Troubleshooting

### Common Issues

**CORS Errors**
- Add frontend URL to backend CORS configuration
- Check environment variables are set correctly

**Database Connection Failed**
- Verify MongoDB Atlas connection string
- Check IP whitelist includes 0.0.0.0/0
- Ensure database user has read/write permissions

**Build Failures**
- Check Node.js version compatibility
- Verify all dependencies are installed
- Review build logs for specific errors

**Authentication Issues**
- Verify JWT_SECRET is set and secure
- Check token storage in localStorage
- Ensure API endpoints match frontend calls

### Logs and Monitoring

**Heroku Logs**
```bash
heroku logs --tail --app your-app-name
```

**Vercel Logs**
- Check dashboard for function logs
- Monitor performance metrics

**Database Monitoring**
- Use MongoDB Atlas monitoring
- Set up alerts for high usage

## 🎯 Performance Optimization

### Backend
- Use MongoDB indexes for frequent queries
- Implement request rate limiting
- Add response caching for static data
- Optimize file upload size limits

### Frontend
- Enable Vite build optimizations
- Use React.memo for heavy components
- Implement code splitting with React.lazy
- Optimize images and assets

## 🔄 Continuous Deployment

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run deploy
```

## 📈 Monitoring and Analytics

### Backend Monitoring
- Set up error tracking (Sentry)
- Monitor API response times
- Track database performance

### Frontend Analytics
- Add Google Analytics (optional)
- Monitor user interactions
- Track conversion rates

---

**🚀 Your FlashCard Platform is ready for production!**

After deployment, share your live URLs:
- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-api.herokuapp.com

**Happy Learning! 🎓**

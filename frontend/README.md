# 🎓 FlashCard Platform - Frontend

React.js frontend application for the FlashCard Learning Platform.

## 🌟 Features

- **Modern React 18** with Hooks and Context
- **Vite** for fast development and building
- **Tailwind CSS** for responsive, utility-first styling
- **React Router** for client-side navigation
- **Axios** for API communication
- **JWT Authentication** with automatic token management

## 🛠️ Technology Stack

- **React.js 18.2.0** - UI framework
- **Vite 7.1.3** - Build tool and dev server
- **React Router DOM 6+** - Routing
- **Tailwind CSS 3+** - Styling
- **Axios** - HTTP client
- **PostCSS** - CSS processing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Build for production**
   ```bash
   npm run build
   ```

4. **Preview production build**
   ```bash
   npm run preview
   ```

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── auth/            # Authentication components
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── dashboard/       # Dashboard components
│   │   └── Dashboard.jsx
│   ├── learning/        # Learning components
│   │   ├── Flashcard.jsx
│   │   ├── FlashcardSet.jsx
│   │   ├── Quiz.jsx
│   │   └── StudyCards.jsx
│   ├── upload/          # Upload components
│   │   └── Upload.jsx
│   └── shared/          # Shared components
│       └── Navbar.jsx
├── utils/               # Utility functions
│   └── api.js          # API configuration
├── styles/              # Styling
│   └── index.css       # Global styles + Tailwind
├── App.jsx             # Main app component
└── main.jsx            # Entry point
```

## 🎨 Component Overview

### Authentication Flow
- **Login.jsx** - User login with JWT
- **Register.jsx** - User registration
- **Protected Routes** - Auth-based navigation

### Learning Experience
- **Upload.jsx** - Content upload (text/PDF)
- **Flashcard.jsx** - Individual flip card
- **FlashcardSet.jsx** - Flashcard collection with navigation
- **Quiz.jsx** - MCQ quiz with timer and scoring
- **StudyCards.jsx** - Study mode for saved cards

### Dashboard
- **Dashboard.jsx** - Main user dashboard
- **Card Management** - View, edit, delete flashcard sets

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root:
```env
VITE_API_BASE_URL=http://localhost:5003
```

### API Configuration
The app communicates with the backend API at `localhost:5003` by default.

### Tailwind CSS
- Configured with PostCSS
- Custom animations for flip cards
- Responsive design utilities
- Custom color schemes

## 🎯 Key Features

### Interactive UI
- **3D Flip Animations** for flashcards
- **Smooth Transitions** between states
- **Loading States** with spinners
- **Error Handling** with user feedback

### Responsive Design
- **Mobile-first** approach
- **Tablet optimization**
- **Desktop enhancement**
- **Cross-browser compatibility**

### User Experience
- **Intuitive Navigation** with React Router
- **Auto-saving** of user progress
- **Real-time Updates** during quiz
- **Accessibility** considerations

## 📊 Available Scripts

```bash
# Development
npm run dev          # Start dev server

# Building
npm run build        # Build for production
npm run preview      # Preview production build

# Linting
npm run lint         # Run ESLint
```

## 🔗 API Integration

### Authentication
```javascript
// Login user
const response = await authAPI.login(credentials);

// Register user
const response = await authAPI.register(userData);
```

### Flashcard Management
```javascript
// Get all flashcard sets
const sets = await flashcardAPI.getAll();

// Create simple flashcards
const result = await flashcardAPI.createSimple(data);

// Create MCQ quiz
const result = await flashcardAPI.create(data);
```

### Content Processing
```javascript
// Generate flashcards from text
const cards = await aiAPI.generateFlashcards(text);

// Upload and process PDF
const result = await aiAPI.uploadPDF(file);
```

## 🎨 Styling Guide

### Tailwind Classes
- **Colors**: Blue theme with gradients
- **Spacing**: Consistent padding/margins
- **Typography**: Clear hierarchy with good contrast
- **Components**: Reusable button and card styles

### Custom CSS
- **3D Transforms** for card flips
- **Animations** for smooth interactions
- **Responsive Breakpoints** for all devices

## 🚀 Deployment

### Build Process
```bash
npm run build
```

### Deployment Platforms
- **Vercel** (recommended)
- **Netlify**
- **GitHub Pages**
- **Firebase Hosting**

### Environment Setup
Update API URLs for production deployment.

## 🐛 Troubleshooting

### Common Issues
1. **CORS Errors** - Check backend CORS configuration
2. **Build Failures** - Clear node_modules and reinstall
3. **API Connection** - Verify backend is running on correct port

### Development Tips
- Use React Developer Tools
- Check browser console for errors
- Verify API responses in Network tab

## 📱 Browser Support

- **Chrome** 90+
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+

## 🤝 Contributing

1. Follow React best practices
2. Use functional components with hooks
3. Implement proper error boundaries
4. Write meaningful component names
5. Add proper PropTypes or TypeScript

---

**Frontend Repository for FlashCard Learning Platform**

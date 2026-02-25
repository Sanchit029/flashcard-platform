#  FlashCard Learning Platform

## Live Link
[Demo Link](https://flashcard-platform-8cgf.vercel.app/)

A full-stack AI-powered web application that transforms text content and PDF documents into interactive learning materials with intelligent difficulty levels, OCR support, and beautiful modern UI.

![FlashCard Platform](https://img.shields.io/badge/React-19.1.1-blue) ![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![MongoDB](https://img.shields.io/badge/MongoDB-6.0-brightgreen) ![JWT](https://img.shields.io/badge/JWT-Auth-orange) ![AI](https://img.shields.io/badge/AI-Hugging%20Face-yellow)

##  What's New (v2.0)

 **Premium UI Redesign** - Stunning glassmorphism login/register screens with gradient backgrounds  
 **AI Difficulty Levels** - Easy, Medium, Hard, and Mixed question generation  
 **OCR Fallback** - Automatic text extraction from image-based PDFs using Tesseract.js  
 **Enhanced Quiz Tracking** - Per-question timing and comprehensive summaries  
 **Progress Analytics** - Detailed mastery tracking and quiz history storage

##  Core Features

###  Modern Visual Design
- **Glassmorphism UI**: Premium login/register screens with animated gradients
- **Responsive Design**: Perfect on desktop, tablet, and mobile
- **Smooth Animations**: Fade-in, shake, pulse effects for delightful UX
- **Icon-Enhanced Forms**: Visual labels with password visibility toggles
- **Gradient Buttons**: Eye-catching CTAs with hover effects

###  Content Upload & Processing
- **Text Input**: Direct text input for quick flashcard generation
- **PDF Upload**: Extract text from PDF documents automatically
- **OCR Support**: Fallback to Tesseract.js for image-based PDFs
- **AI Processing**: Generate flashcards and quizzes from any content
- **Difficulty Selection**: Choose Easy, Medium, Hard, or Mixed questions

###  Interactive Learning
- **Flashcard Study Mode**: Beautiful flip animations with question/answer cards
- **Quiz Mode**: Timed multiple-choice quizzes with per-question tracking
- **Progress Tracking**: Score analytics, mastery levels, and performance feedback
- **Edit & Regenerate**: Modify AI-generated content or regenerate with AI
- **Quiz History**: Automatic saving of all quiz attempts with detailed metrics

###  User Management
- **Authentication**: Secure JWT-based login/registration
- **Personal Dashboard**: Save and organize learning sets
- **CRUD Operations**: Create, read, update, delete flashcard sets
- **Progress Persistence**: Track your learning journey over time

###  AI-Powered Intelligence
- **Hugging Face Integration**: State-of-the-art NLP models
- **Smart Difficulty**: Algorithmic complexity analysis for questions
- **Multiple Models**: BART (summarization), T5 (questions), RoBERTa (answers)
- **Fallback Systems**: Pattern-based generation when AI unavailable

##  Technology Stack

### Frontend
- **React.js 19** - Modern UI framework with latest hooks
- **Vite 7** - Lightning-fast build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS 4** - Utility-first CSS framework
- **Axios** - HTTP client for API calls

### Backend
- **Node.js** - JavaScript runtime
- **Express.js 5** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose 8** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Multer 2** - File upload handling
- **pdf-parse** - PDF text extraction
- **Tesseract.js 5** - OCR for image-based PDFs
- **Hugging Face Inference** - AI model API

##  Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB running locally or MongoDB Atlas account
- Git for version control

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Project-7/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the backend directory:
   ```env
   PORT=5003
   MONGO_URI=mongodb://localhost:27017/flashcard-platform
   JWT_SECRET=your-super-secure-jwt-secret-key-here
   ```

4. **Start the server**
   ```bash
   npm start
   # OR for development
   npm run dev
   ```

   Backend will run on `http://localhost:5003`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   Frontend will run on `http://localhost:5173`

##  Application Flow

### 1. Authentication
- **Register**: Create new account with username, email, password
- **Login**: Secure authentication with JWT tokens
- **Auto-redirect**: Seamless navigation based on auth state

### 2. Content Upload
- **Text Mode**: Paste or type content directly
- **PDF Mode**: Upload PDF files for automatic text extraction
- **Validation**: File type checking and error handling

### 3. AI Processing
- **Flashcard Generation**: Create Q/A pairs from content
- **Quiz Generation**: Generate MCQs with multiple options
- **Summary Creation**: Extract key points and summaries

### 4. Interactive Learning
- **Study Mode**: Flip through flashcards with animations
- **Quiz Mode**: Timed MCQ tests with scoring
- **Navigation**: Jump between questions, track progress

### 5. Dashboard Management
- **Save Sets**: Store generated content for later use
- **Organize**: View all saved flashcard sets and quizzes
- **Analytics**: Track scores and learning progress

##  API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Content Processing
- `POST /api/ai/upload/text` - Process text content
- `POST /api/ai/upload/pdf` - Extract text from PDF
- `POST /api/ai/generate-flashcards` - Generate Q/A flashcards
- `POST /api/ai/generate-mcqs` - Generate MCQ questions

### Flashcard Management
- `GET /api/flashcard-sets` - Get user's flashcard sets
- `POST /api/flashcard-sets` - Create MCQ flashcard set
- `POST /api/flashcard-sets/simple` - Create Q/A flashcard set
- `GET /api/flashcard-sets/:id` - Get specific flashcard set
- `PUT /api/flashcard-sets/:id` - Update flashcard set
- `DELETE /api/flashcard-sets/:id` - Delete flashcard set

##  Component Architecture

### Core Components
- **App.jsx** - Main application with routing
- **Navbar.jsx** - Navigation bar with auth controls
- **Dashboard.jsx** - User's main dashboard
- **Upload.jsx** - Content upload interface

### Learning Components
- **Flashcard.jsx** - Individual flip card component
- **FlashcardSet.jsx** - Collection of flashcards with navigation
- **Quiz.jsx** - MCQ quiz interface with timer and scoring
- **StudyCards.jsx** - Study mode for saved flashcards

### Auth Components
- **Login.jsx** - User login form
- **Register.jsx** - User registration form

##  Development Features

### Code Quality
- **ESLint** - Code linting and formatting
- **Error Handling** - Comprehensive error boundaries
- **Loading States** - User feedback during operations
- **Responsive Design** - Mobile-first approach

### Performance
- **Lazy Loading** - Components loaded on demand
- **Optimized Images** - Efficient asset loading
- **Fast Build** - Vite for quick development cycles

##  Testing the Application

### Complete Workflow Test
1. **Start both servers** (backend on :5003, frontend on :5173)
2. **Register** a new account
3. **Upload** a PDF or enter text content
4. **Generate** flashcards and view them with flip animations
5. **Create** a quiz from MCQ content
6. **Take** the timed quiz and view results
7. **Save** flashcard sets to dashboard
8. **Manage** saved sets (view, edit, delete)

### Sample Test Content
```text
Artificial Intelligence (AI) is a branch of computer science that aims to create intelligent machines. Machine learning is a subset of AI that enables computers to learn without being explicitly programmed. Deep learning uses neural networks to model and understand complex patterns in data.
```

##  Deployment

### Backend Deployment (Heroku/Railway)
1. Set environment variables in platform
2. Configure MongoDB Atlas connection
3. Deploy with automatic builds

### Frontend Deployment (Vercel/Netlify)
1. Build production version: `npm run build`
2. Deploy to platform of choice
3. Update API endpoints for production

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Open a Pull Request

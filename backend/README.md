# 🎓 FlashCard Platform - Backend API

Node.js/Express backend API for the FlashCard Learning Platform.

## 🌟 Features

- **RESTful API** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT Authentication** with bcrypt password hashing
- **File Upload** with PDF text extraction
- **AI Content Processing** for flashcard generation
- **CORS** enabled for frontend integration

## 🛠️ Technology Stack

- **Node.js 18+** - JavaScript runtime
- **Express.js 5+** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for auth
- **bcryptjs** - Password hashing
- **Multer** - File upload middleware
- **pdf-parse** - PDF text extraction
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variables

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file:
   ```env
   PORT=5003
   MONGO_URI=mongodb://localhost:27017/flashcard-platform
   JWT_SECRET=your-super-secure-jwt-secret-key-here
   ```

3. **Start the server**
   ```bash
   npm start
   # OR for development with nodemon
   npm run dev
   ```

   Server will run on `http://localhost:5003`

## 📁 Project Structure

```
backend/
├── models/              # Database models
│   ├── User.js         # User schema
│   └── FlashcardSet.js # Flashcard set schema
├── routes/              # API routes
│   ├── auth.js         # Authentication routes
│   ├── aiController.js # AI processing routes
│   └── flashcardSetController.js # Flashcard CRUD
├── services/            # Business logic
│   └── aiService.js    # AI content processing
├── middleware/          # Custom middleware
│   └── authMiddleware.js # JWT verification
├── .env                # Environment variables
├── index.js            # Server entry point
└── package.json        # Dependencies
```

## 🔗 API Endpoints

### Authentication
```
POST /api/auth/register  # User registration
POST /api/auth/login     # User login
```

### Content Processing
```
POST /api/ai/upload/text        # Process text content
POST /api/ai/upload/pdf         # Extract text from PDF
POST /api/ai/generate-flashcards # Generate Q/A flashcards
POST /api/ai/generate-mcqs      # Generate MCQ questions
POST /api/ai/summarize          # Generate text summary
```

### Flashcard Management
```
GET    /api/flashcard-sets      # Get user's flashcard sets
POST   /api/flashcard-sets      # Create MCQ flashcard set
POST   /api/flashcard-sets/simple # Create Q/A flashcard set
GET    /api/flashcard-sets/:id  # Get specific flashcard set
PUT    /api/flashcard-sets/:id  # Update flashcard set
DELETE /api/flashcard-sets/:id  # Delete flashcard set
POST   /api/flashcard-sets/sample-mcq # Create sample quiz
```

## 🗄️ Database Models

### User Schema
```javascript
{
  username: String (required, unique),
  email: String (required, unique),
  password: String (required, hashed),
  createdAt: Date,
  updatedAt: Date
}
```

### FlashcardSet Schema
```javascript
{
  user: ObjectId (ref: User),
  title: String (required),
  type: String (enum: ['mcq', 'simple']),
  
  // For MCQ type
  questions: [{
    questionText: String,
    options: [String],
    correctAnswer: String
  }],
  sourceText: String,
  summary: {
    short: String,
    keyPoints: [String]
  },
  
  // For simple type
  flashcards: [{
    question: String,
    answer: String
  }],
  
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Authentication

### JWT Implementation
- **Registration**: Hash password with bcrypt, create JWT
- **Login**: Verify password, return JWT token
- **Protected Routes**: Middleware verifies JWT on each request
- **Token Storage**: Frontend stores JWT in localStorage

### Password Security
- **bcrypt hashing** with salt rounds
- **Password validation** on registration
- **Secure token generation** with strong secrets

## 📤 File Upload & Processing

### PDF Processing
```javascript
// Upload PDF file
const upload = multer({ storage: multer.memoryStorage() });
app.post('/api/ai/upload/pdf', upload.single('pdf'), async (req, res) => {
  const data = await pdfParse(req.file.buffer);
  res.json({ extractedText: data.text });
});
```

### Text Processing
- **Content validation** before processing
- **AI generation** of flashcards and quizzes
- **Error handling** for malformed content

## 🤖 AI Services

### Flashcard Generation
```javascript
// Generate Q/A flashcards from text
export async function generateFlashcardsFromText(text) {
  const concepts = splitTextIntoConcepts(text);
  return concepts.map(concept => ({
    question: `What is ${concept}?`,
    answer: concept
  }));
}
```

### MCQ Generation
```javascript
// Generate multiple choice questions
export async function generateMCQsFromText(text) {
  const sentences = text.split('.').filter(Boolean);
  return sentences.map((sentence, i) => ({
    questionText: `What is the main idea of: "${sentence}"?`,
    options: [`Option A`, `Option B`, `Option C`, `Option D`],
    correctAnswer: `Option A`
  }));
}
```

## 🛡️ Security Features

### CORS Configuration
```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
```

### Input Validation
- **Request body validation**
- **File type checking** for uploads
- **Authentication middleware** for protected routes
- **Error handling** with proper status codes

## 🔧 Environment Configuration

### Required Variables
```env
PORT=5003                                    # Server port
MONGO_URI=mongodb://localhost:27017/flashcard # Database connection
JWT_SECRET=your-secret-key                   # JWT signing secret
```

### Optional Variables
```env
NODE_ENV=development                         # Environment mode
CORS_ORIGIN=http://localhost:5173           # Frontend URL
```

## 📊 Available Scripts

```bash
# Development
npm run dev          # Start with nodemon
npm start           # Start production server

# Database
npm run db:seed     # Seed sample data (if available)
npm run db:reset    # Reset database (if available)
```

## 🚀 Deployment

### Production Setup
1. **Environment Variables** - Set in hosting platform
2. **MongoDB Atlas** - Use cloud database
3. **JWT Secret** - Generate secure secret
4. **CORS Origins** - Update for production URLs

### Hosting Platforms
- **Heroku** with MongoDB Atlas
- **Railway** with built-in database
- **DigitalOcean** with MongoDB service
- **AWS** with DocumentDB

### Health Check
```
GET /health  # Server health status
```

## 🐛 Error Handling

### Standard Error Responses
```javascript
// 400 Bad Request
{ message: "Validation error message" }

// 401 Unauthorized
{ message: "Invalid credentials" }

// 404 Not Found
{ message: "Resource not found" }

// 500 Internal Server Error
{ message: "Server error" }
```

### Logging
- **Console logging** for development
- **Error tracking** for production
- **Request logging** middleware

## 🧪 Testing

### Manual Testing
1. **Authentication Flow** - Register/login
2. **File Upload** - PDF processing
3. **Content Generation** - Flashcards/quizzes
4. **CRUD Operations** - Create/read/update/delete

### API Testing Tools
- **Postman** collections
- **Thunder Client** (VS Code)
- **curl** commands
- **Frontend integration** testing

## 📊 Performance

### Database Optimization
- **Mongoose indexes** on frequently queried fields
- **Connection pooling** for MongoDB
- **Query optimization** with proper projections

### Request Optimization
- **Middleware caching** for static responses
- **File size limits** for uploads
- **Request rate limiting** (if needed)

## 🤝 Contributing

1. Follow Node.js best practices
2. Use async/await for promises
3. Implement proper error handling
4. Add input validation
5. Write meaningful commit messages

---

**Backend API for FlashCard Learning Platform**
npm start
# or for development with nodemon
npm run dev
```

## API Routes

### Authentication

#### Register User
- **POST** `/api/auth/register`
- **Body:**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "yourpassword"
}
```
- **Response:** `{ "message": "User registered successfully" }`

#### Login User
- **POST** `/api/auth/login`
- **Body:**
```json
{
  "email": "test@example.com",
  "password": "yourpassword"
}
```
- **Response:** `{ "token": "jwt_token_here" }`

### AI Processing (Protected Routes)

> **Note:** All AI routes require JWT token in header: `Authorization: Bearer <token>`

#### Generate MCQs
- **POST** `/api/ai/generate-mcqs`
- **Body:**
```json
{
  "text": "Your source text here"
}
```
- **Response:** Array of MCQ objects with questions, options, and correct answers

#### Generate Summary
- **POST** `/api/ai/summarize`
- **Body:**
```json
{
  "text": "Your source text here"
}
```
- **Response:** `{ "shortSummary": "...", "keyPoints": ["..."] }`

#### Generate Flashcards
- **POST** `/api/ai/generate-flashcards`
- **Body:**
```json
{
  "text": "Your source text here"
}
```
- **Response:** Array of flashcard objects with questions and answers

#### Upload Text
- **POST** `/api/ai/upload/text`
- **Body:**
```json
{
  "text": "Raw text content"
}
```
- **Response:** `{ "extractedText": "..." }`

#### Upload PDF
- **POST** `/api/ai/upload/pdf`
- **Form Data:** `pdf` (PDF file)
- **Response:** `{ "extractedText": "..." }`

### Flashcard Sets (Protected Routes)

#### Create Flashcard Set
- **POST** `/api/flashcard-sets`
- **Body:**
```json
{
  "title": "My Study Set",
  "text": "Source text for generating flashcards and quiz"
}
```
- **Response:** Complete flashcard set object with generated MCQs and summary

#### Get All User's Flashcard Sets
- **GET** `/api/flashcard-sets`
- **Response:** Array of flashcard sets belonging to the authenticated user

#### Get Specific Flashcard Set
- **GET** `/api/flashcard-sets/:id`
- **Response:** Single flashcard set object

## Testing Flow

### 1. Register/Login
```bash
# Register
curl -X POST http://localhost:5003/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Login (save the token)
curl -X POST http://localhost:5003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 2. Upload & Process Text
```bash
# Upload text and generate flashcard set
curl -X POST http://localhost:5003/api/flashcard-sets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"title":"Test Set","text":"Photosynthesis is the process by which plants convert sunlight into energy."}'
```

### 3. Fetch Saved Sets
```bash
# Get all flashcard sets
curl -X GET http://localhost:5003/api/flashcard-sets \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Data Models

### User
- `username` (String, unique)
- `email` (String, unique)
- `password` (String, hashed)

### FlashcardSet
- `user` (ObjectId, ref to User)
- `title` (String)


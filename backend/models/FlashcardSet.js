import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true },
});

const simpleFlashcardSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  // Progress tracking
  timesStudied: { type: Number, default: 0 },
  timesCorrect: { type: Number, default: 0 },
  lastStudied: { type: Date },
  masteryLevel: { 
    type: String, 
    enum: ['new', 'review', 'mastered'], 
    default: 'new' 
  },
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'], 
    default: 'medium' 
  }
});

const flashcardSetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'simple'], default: 'mcq' },
  // For MCQ type flashcards
  questions: [questionSchema],
  sourceText: { type: String },
  summary: {
    short: { type: String },
    keyPoints: [{ type: String }],
  },
  // For simple Q/A type flashcards
  flashcards: [simpleFlashcardSchema],
  // Overall set progress tracking
  totalStudySessions: { type: Number, default: 0 },
  lastStudied: { type: Date },
  averageScore: { type: Number, default: 0 },
  // Study preferences
  studySettings: {
    showHints: { type: Boolean, default: true },
    autoFlip: { type: Boolean, default: false },
    shuffleCards: { type: Boolean, default: false }
  }
}, { timestamps: true });

export default mongoose.model('FlashcardSet', flashcardSetSchema);
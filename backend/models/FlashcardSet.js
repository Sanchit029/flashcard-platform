import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true },
});

const simpleFlashcardSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
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
}, { timestamps: true });

export default mongoose.model('FlashcardSet', flashcardSetSchema);
import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  flashcardSetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FlashcardSet',
    required: true
  },
  setTitle: {
    type: String,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  correctAnswers: {
    type: Number,
    required: true
  },
  scorePercentage: {
    type: Number,
    required: true
  },
  totalTimeSpent: {
    type: Number,
    default: 0
  },
  averageTimePerQuestion: {
    type: Number,
    default: 0
  },
  timerUsed: {
    type: Boolean,
    default: false
  },
  timePerQuestion: {
    type: Number,
    default: null
  },
  answers: [{
    questionId: String,
    questionText: String,
    userAnswer: String,
    correctAnswer: String,
    isCorrect: Boolean,
    timeSpent: Number
  }],
  settings: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
quizAttemptSchema.index({ user: 1, completedAt: -1 });
quizAttemptSchema.index({ flashcardSetId: 1 });

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);

export default QuizAttempt;

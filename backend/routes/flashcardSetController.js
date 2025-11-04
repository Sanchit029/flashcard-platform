import express from 'express';
import FlashcardSet from '../models/FlashcardSet.js';
import QuizAttempt from '../models/QuizAttempt.js';
import { generateMCQsFromText, generateSummariesFromText } from '../services/aiService.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST /api/flashcard-sets/sample-mcq
// @desc    Create a sample MCQ flashcard set for testing
// @access  Private
router.post('/sample-mcq', authMiddleware, async (req, res) => {
  try {
    const sampleQuestions = [
      {
        questionText: "What is the capital of France?",
        options: ["Paris", "London", "Berlin", "Madrid"],
        correctAnswer: "Paris"
      },
      {
        questionText: "Which planet is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        correctAnswer: "Mars"
      },
      {
        questionText: "What is 2 + 2?",
        options: ["3", "4", "5", "6"],
        correctAnswer: "4"
      },
      {
        questionText: "Who wrote 'Romeo and Juliet'?",
        options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
        correctAnswer: "William Shakespeare"
      },
      {
        questionText: "What is the largest ocean on Earth?",
        options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
        correctAnswer: "Pacific Ocean"
      }
    ];

    const newSet = new FlashcardSet({
      user: req.user.id,
      title: "Sample Quiz - General Knowledge",
      type: 'mcq',
      questions: sampleQuestions,
      sourceText: "Sample text for general knowledge quiz covering various topics including geography, science, mathematics, literature, and nature.",
      summary: {
        short: "A sample quiz covering basic general knowledge topics",
        keyPoints: ["Geography", "Science", "Mathematics", "Literature", "Nature"]
      }
    });

    const savedSet = await newSet.save();
    res.status(201).json(savedSet);
  } catch (error) {
    console.error('Error creating sample MCQ set:', error);
    res.status(500).json({ message: 'Server error while creating sample MCQ set.' });
  }
});

// @route   POST /api/flashcard-sets/simple
// @desc    Create a simple Q/A flashcard set
// @access  Private
router.post('/simple', authMiddleware, async (req, res) => {
  try {
    const { flashcards, title } = req.body;

    if (!flashcards || !Array.isArray(flashcards) || flashcards.length === 0) {
      return res.status(400).json({ message: 'No flashcards provided.' });
    }
    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'A title is required for the set.' });
    }

    // Validate flashcard structure
    for (const card of flashcards) {
      if (!card.question || !card.answer) {
        return res.status(400).json({ message: 'Each flashcard must have both question and answer.' });
      }
    }

    const newSet = new FlashcardSet({
      user: req.user.id,
      title,
      flashcards: flashcards,
      type: 'simple', // Mark as simple Q/A type
    });

    const savedSet = await newSet.save();

    res.status(201).json(savedSet);
  } catch (error) {
    console.error('Error creating simple flashcard set:', error);
    res.status(500).json({ message: 'Server error while creating flashcard set.' });
  }
});

// @route   POST /api/flashcard-sets/mcq
// @desc    Create an MCQ flashcard set with pre-generated questions
// @access  Private
router.post('/mcq', authMiddleware, async (req, res) => {
  try {
    const { questions, title, summary } = req.body;

    console.log('📝 Creating MCQ flashcard set:', {
      title,
      questionsCount: questions?.length,
      hasSummary: !!summary,
      userId: req.user?.id
    });

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      console.error('❌ No questions provided');
      return res.status(400).json({ message: 'No questions provided.' });
    }
    if (!title || title.trim() === '') {
      console.error('❌ No title provided');
      return res.status(400).json({ message: 'A title is required for the set.' });
    }

    // Validate question structure
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question.questionText || !question.options || !question.correctAnswer) {
        console.error(`❌ Question ${i + 1} missing required fields:`, question);
        return res.status(400).json({ 
          message: `Question ${i + 1} must have questionText, options, and correctAnswer.`,
          invalidQuestion: question
        });
      }
      if (!Array.isArray(question.options) || question.options.length < 2) {
        console.error(`❌ Question ${i + 1} has invalid options:`, question.options);
        return res.status(400).json({ 
          message: `Question ${i + 1} must have at least 2 options.`,
          options: question.options
        });
      }
    }

    const newSet = new FlashcardSet({
      user: req.user.id,
      title,
      questions: questions,
      type: 'mcq',
      summary: summary || {},
      sourceText: summary?.detailed || summary?.short || 'AI-generated quiz'
    });

    const savedSet = await newSet.save();
    console.log('✅ MCQ flashcard set created successfully:', savedSet._id);

    res.status(201).json(savedSet);
  } catch (error) {
    console.error('❌ Error creating MCQ flashcard set:', error);
    res.status(500).json({ message: 'Server error while creating MCQ flashcard set.', error: error.message });
  }
});

// @route   POST /api/flashcard-sets
// @desc    Create a flashcard set from text
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { text, title } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'No text provided.' });
    }
    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'A title is required for the set.' });
    }

    const [questions, summary] = await Promise.all([
      generateMCQsFromText(text),
      generateSummariesFromText(text),
    ]);

    const newSet = new FlashcardSet({
      user: req.user.id,
      title,
      questions,
      sourceText: text,
      summary: {
        short: summary.shortSummary,
        keyPoints: summary.keyPoints,
      },
    });

    const savedSet = await newSet.save();

    res.status(201).json(savedSet);
  } catch (error) {
    console.error('Error creating flashcard set:', error);
    res.status(500).json({ message: 'Server error while creating flashcard set.' });
  }
});

// @route   GET /api/flashcard-sets
// @desc    Get all flashcard sets for the logged-in user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const sets = await FlashcardSet.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(sets);
  } catch (error) {
    console.error('Error fetching flashcard sets:', error);
    res.status(500).json({ message: 'Server error while fetching flashcard sets.' });
  }
});

// @route   GET /api/flashcard-sets/:id
// @desc    Get a single flashcard set by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const set = await FlashcardSet.findById(req.params.id);

    if (!set) {
      return res.status(404).json({ message: 'Flashcard set not found.' });
    }

    // Ensure the set belongs to the user requesting it
    if (set.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to view this set.' });
    }

    res.json(set);
  } catch (error) {
    console.error('Error fetching single flashcard set:', error);
    // Handle CastError for invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Flashcard set not found.' });
    }
    res.status(500).json({ message: 'Server error while fetching set.' });
  }
});

// @route   DELETE /api/flashcard-sets/:id
// @desc    Delete a flashcard set by ID
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const flashcardSet = await FlashcardSet.findById(req.params.id);

    if (!flashcardSet) {
      return res.status(404).json({ message: 'Flashcard set not found' });
    }

    // Check if the flashcard set belongs to the logged-in user
    if (flashcardSet.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this flashcard set' });
    }

    await FlashcardSet.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Flashcard set deleted successfully' });
  } catch (error) {
    console.error('Error deleting flashcard set:', error);
    res.status(500).json({ message: 'Server error while deleting flashcard set' });
  }
});

// @route   PUT /api/flashcard-sets/:id
// @desc    Update a flashcard set by ID
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Title is required' });
    }

    const flashcardSet = await FlashcardSet.findById(req.params.id);

    if (!flashcardSet) {
      return res.status(404).json({ message: 'Flashcard set not found' });
    }

    // Check if the flashcard set belongs to the logged-in user
    if (flashcardSet.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this flashcard set' });
    }

    flashcardSet.title = title;
    const updatedSet = await flashcardSet.save();

    res.status(200).json(updatedSet);
  } catch (error) {
    console.error('Error updating flashcard set:', error);
    res.status(500).json({ message: 'Server error while updating flashcard set' });
  }
});

// @route   POST /api/flashcard-sets/:id/study
// @desc    Update flashcard progress after study session
// @access  Private
router.post('/:id/study', authMiddleware, async (req, res) => {
  try {
    const { cardId, correct, difficulty, timeTaken } = req.body;

    const flashcardSet = await FlashcardSet.findById(req.params.id);

    if (!flashcardSet) {
      return res.status(404).json({ message: 'Flashcard set not found' });
    }

    if (flashcardSet.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this flashcard set' });
    }

    const card = flashcardSet.flashcards.id(cardId);
    if (!card) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }

    card.timesStudied += 1;
    card.lastStudied = new Date();
    
    if (correct) {
      card.timesCorrect += 1;
    }

    if (difficulty) {
      card.difficulty = difficulty;
    }

    if (correct) {
      card.masteryLevel = 'mastered';
    } else {
      card.masteryLevel = 'review';
    }

    flashcardSet.totalStudySessions += 1;
    flashcardSet.lastStudied = new Date();
    
    const totalCorrect = flashcardSet.flashcards.reduce((sum, card) => sum + card.timesCorrect, 0);
    const totalStudied = flashcardSet.flashcards.reduce((sum, card) => sum + card.timesStudied, 0);
    flashcardSet.averageScore = totalStudied > 0 ? Math.round((totalCorrect / totalStudied) * 100) : 0;

    await flashcardSet.save();

    const masteredCards = flashcardSet.flashcards.filter(card => card.masteryLevel === 'mastered').length;
    const totalCards = flashcardSet.flashcards.length;
    
    // Calculate accuracy for this specific card
    const cardAccuracy = card.timesStudied > 0 ? (card.timesCorrect / card.timesStudied) : 0;

    res.status(200).json({
      message: 'Progress updated successfully',
      progress: {
        masteredCards,
        totalCards,
        masteryPercentage: Math.round((masteredCards / totalCards) * 100),
        averageScore: flashcardSet.averageScore,
        totalStudySessions: flashcardSet.totalStudySessions
      },
      card: {
        id: card._id,
        masteryLevel: card.masteryLevel,
        timesStudied: card.timesStudied,
        timesCorrect: card.timesCorrect,
        accuracy: Math.round(cardAccuracy * 100)
      }
    });

  } catch (error) {
    console.error('❌ Error updating flashcard progress:', error);
    res.status(500).json({ message: 'Server error while updating progress' });
  }
});

// @route   GET /api/flashcard-sets/:id/progress
// @desc    Get detailed progress statistics for a flashcard set
// @access  Private
router.get('/:id/progress', authMiddleware, async (req, res) => {
  try {
    const flashcardSet = await FlashcardSet.findById(req.params.id);

    if (!flashcardSet) {
      return res.status(404).json({ message: 'Flashcard set not found' });
    }

    // Check if the flashcard set belongs to the logged-in user
    if (flashcardSet.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this flashcard set' });
    }

    // Calculate progress statistics
    const totalCards = flashcardSet.flashcards.length;
    const masteredCards = flashcardSet.flashcards.filter(card => card.masteryLevel === 'mastered').length;
    const reviewCards = flashcardSet.flashcards.filter(card => card.masteryLevel === 'review').length;
    const newCards = flashcardSet.flashcards.filter(card => card.masteryLevel === 'new').length;

    // Cards by difficulty
    const easyCards = flashcardSet.flashcards.filter(card => card.difficulty === 'easy').length;
    const mediumCards = flashcardSet.flashcards.filter(card => card.difficulty === 'medium').length;
    const hardCards = flashcardSet.flashcards.filter(card => card.difficulty === 'hard').length;

    // Recent activity
    const recentlyStudied = flashcardSet.flashcards
      .filter(card => card.lastStudied)
      .sort((a, b) => new Date(b.lastStudied) - new Date(a.lastStudied))
      .slice(0, 5);

    res.status(200).json({
      setInfo: {
        id: flashcardSet._id,
        title: flashcardSet.title,
        totalCards,
        lastStudied: flashcardSet.lastStudied,
        totalStudySessions: flashcardSet.totalStudySessions,
        averageScore: flashcardSet.averageScore
      },
      masteryBreakdown: {
        mastered: masteredCards,
        review: reviewCards,
        new: newCards,
        masteryPercentage: Math.round((masteredCards / totalCards) * 100)
      },
      difficultyBreakdown: {
        easy: easyCards,
        medium: mediumCards,
        hard: hardCards
      },
      recentActivity: recentlyStudied.map(card => ({
        id: card._id,
        question: card.question.substring(0, 50) + (card.question.length > 50 ? '...' : ''),
        masteryLevel: card.masteryLevel,
        lastStudied: card.lastStudied,
        accuracy: card.timesStudied > 0 ? Math.round((card.timesCorrect / card.timesStudied) * 100) : 0
      }))
    });

  } catch (error) {
    console.error('Error fetching flashcard progress:', error);
    res.status(500).json({ message: 'Server error while fetching progress' });
  }
});

// @route   POST /api/flashcard-sets/:id/quiz-attempt
// @desc    Save quiz attempt results
// @access  Private
router.post('/:id/quiz-attempt', authMiddleware, async (req, res) => {
  try {
    const { 
      totalQuestions,
      correctAnswers,
      scorePercentage,
      totalTimeSpent,
      averageTimePerQuestion,
      timerUsed,
      timePerQuestion,
      answers,
      settings
    } = req.body;

    const flashcardSet = await FlashcardSet.findById(req.params.id);

    if (!flashcardSet) {
      return res.status(404).json({ message: 'Flashcard set not found' });
    }

    // Check if the flashcard set belongs to the logged-in user
    if (flashcardSet.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to submit quiz for this set' });
    }

    const quizAttempt = new QuizAttempt({
      user: req.user.id,
      flashcardSetId: req.params.id,
      setTitle: flashcardSet.title,
      totalQuestions,
      correctAnswers,
      scorePercentage,
      totalTimeSpent,
      averageTimePerQuestion,
      timerUsed: timerUsed || false,
      timePerQuestion: timePerQuestion || null,
      answers,
      settings: settings || {}
    });

    await quizAttempt.save();

    res.status(201).json({
      message: 'Quiz attempt saved successfully',
      attemptId: quizAttempt._id,
      summary: {
        score: `${correctAnswers}/${totalQuestions}`,
        percentage: scorePercentage,
        totalTime: totalTimeSpent,
        averageTime: averageTimePerQuestion
      }
    });

  } catch (error) {
    console.error('Error saving quiz attempt:', error);
    res.status(500).json({ message: 'Server error while saving quiz attempt' });
  }
});

// @route   GET /api/flashcard-sets/:id/quiz-history
// @desc    Get quiz history for a specific flashcard set
// @access  Private
router.get('/:id/quiz-history', authMiddleware, async (req, res) => {
  try {
    const flashcardSet = await FlashcardSet.findById(req.params.id);

    if (!flashcardSet) {
      return res.status(404).json({ message: 'Flashcard set not found' });
    }

    // Check if the flashcard set belongs to the logged-in user
    if (flashcardSet.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view quiz history for this set' });
    }

    const quizHistory = await QuizAttempt.find({
      user: req.user.id,
      flashcardSetId: req.params.id
    })
    .sort({ createdAt: -1 })
    .limit(50) // Limit to last 50 attempts
    .select('-answers'); // Exclude detailed answers for overview

    // Calculate statistics
    const totalAttempts = quizHistory.length;
    const bestScore = totalAttempts > 0 ? Math.max(...quizHistory.map(attempt => attempt.scorePercentage)) : 0;
    const averageScore = totalAttempts > 0 ? Math.round(quizHistory.reduce((sum, attempt) => sum + attempt.scorePercentage, 0) / totalAttempts) : 0;
    const recentImprovement = totalAttempts >= 2 ? 
      quizHistory[0].scorePercentage - quizHistory[1].scorePercentage : 0;

    res.status(200).json({
      setInfo: {
        id: flashcardSet._id,
        title: flashcardSet.title,
        totalQuestions: flashcardSet.questions?.length || 0
      },
      statistics: {
        totalAttempts,
        bestScore,
        averageScore,
        recentImprovement,
        lastAttempt: totalAttempts > 0 ? quizHistory[0].createdAt : null
      },
      history: quizHistory.map(attempt => ({
        id: attempt._id,
        date: attempt.createdAt,
        score: attempt.correctAnswers,
        total: attempt.totalQuestions,
        percentage: attempt.scorePercentage,
        totalTime: attempt.totalTimeSpent,
        averageTime: attempt.averageTimePerQuestion,
        timerUsed: attempt.timerUsed
      }))
    });

  } catch (error) {
    console.error('Error fetching quiz history:', error);
    res.status(500).json({ message: 'Server error while fetching quiz history' });
  }
});

// @route   GET /api/flashcard-sets/quiz-attempt/:attemptId
// @desc    Get detailed quiz attempt results
// @access  Private
router.get('/quiz-attempt/:attemptId', authMiddleware, async (req, res) => {
  try {
    const quizAttempt = await QuizAttempt.findById(req.params.attemptId);

    if (!quizAttempt) {
      return res.status(404).json({ message: 'Quiz attempt not found' });
    }

    // Check if the quiz attempt belongs to the logged-in user
    if (quizAttempt.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this quiz attempt' });
    }

    res.status(200).json(quizAttempt);

  } catch (error) {
    console.error('Error fetching quiz attempt details:', error);
    res.status(500).json({ message: 'Server error while fetching quiz attempt details' });
  }
});

// @route   GET /api/quiz-history
// @desc    Get all quiz history for the user (across all sets)
// @access  Private
router.get('/quiz-history/all', authMiddleware, async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const quizHistory = await QuizAttempt.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select('-answers'); // Exclude detailed answers for overview

    const totalAttempts = await QuizAttempt.countDocuments({ user: req.user.id });

    res.status(200).json({
      history: quizHistory,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalAttempts / limit),
        totalAttempts,
        hasMore: skip + quizHistory.length < totalAttempts
      }
    });

  } catch (error) {
    console.error('Error fetching user quiz history:', error);
    res.status(500).json({ message: 'Server error while fetching quiz history' });
  }
});

// @route   PUT /api/flashcard-sets/:id/flashcard/:cardId
// @desc    Edit a specific flashcard in a set
// @access  Private
router.put('/:id/flashcard/:cardId', authMiddleware, async (req, res) => {
  try {
    const { question, answer } = req.body;
    const { id: setId, cardId } = req.params;

    // Validate input
    if (!question || !answer || question.trim() === '' || answer.trim() === '') {
      return res.status(400).json({ message: 'Both question and answer are required' });
    }

    // Find the flashcard set
    const flashcardSet = await FlashcardSet.findById(setId);

    if (!flashcardSet) {
      return res.status(404).json({ message: 'Flashcard set not found' });
    }

    // Check authorization
    if (flashcardSet.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this flashcard set' });
    }

    // Find and update the specific flashcard
    let cardFound = false;
    
    if (flashcardSet.type === 'flashcard') {
      // For regular flashcards
      flashcardSet.flashcards = flashcardSet.flashcards.map(card => {
        if (card._id.toString() === cardId) {
          cardFound = true;
          return {
            ...card.toObject(),
            question: question.trim(),
            answer: answer.trim(),
            lastModified: new Date()
          };
        }
        return card;
      });
    } else if (flashcardSet.type === 'mcq') {
      // For MCQ questions - only allow editing the question text
      // Note: Editing MCQ answers is complex as it involves options and correct answers
      flashcardSet.questions = flashcardSet.questions.map(mcqQuestion => {
        if (mcqQuestion._id.toString() === cardId) {
          cardFound = true;
          return {
            ...mcqQuestion.toObject(),
            questionText: question.trim(),
            // Keep existing options and correctAnswer unchanged for MCQs
            lastModified: new Date()
          };
        }
        return mcqQuestion;
      });
    }

    if (!cardFound) {
      return res.status(404).json({ message: 'Flashcard not found in this set' });
    }

    // Update the set's last modified date
    flashcardSet.updatedAt = new Date();

    // Save the updated set
    const updatedSet = await flashcardSet.save();

    res.status(200).json({
      message: 'Flashcard updated successfully',
      flashcardSet: updatedSet
    });

  } catch (error) {
    console.error('Error updating flashcard:', error);
    res.status(500).json({ message: 'Server error while updating flashcard' });
  }
});

// @route   POST /api/flashcard-sets/:id/flashcard/:cardId/regenerate
// @desc    Regenerate a specific flashcard using AI
// @access  Private
router.post('/:id/flashcard/:cardId/regenerate', authMiddleware, async (req, res) => {
  try {
    const { id: setId, cardId } = req.params;

    // Find the flashcard set
    const flashcardSet = await FlashcardSet.findById(setId);

    if (!flashcardSet) {
      return res.status(404).json({ message: 'Flashcard set not found' });
    }

    // Check authorization
    if (flashcardSet.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this flashcard set' });
    }

    // For regeneration, we need the original source text
    if (!flashcardSet.sourceText) {
      return res.status(400).json({ message: 'Cannot regenerate: original source text not available' });
    }

    let cardFound = false;
    let updatedSet;

    if (flashcardSet.type === 'flashcard') {
      // Generate new flashcard from the source text
      const { generateFlashcardsFromText } = await import('../services/aiService.js');
      const newFlashcards = await generateFlashcardsFromText(flashcardSet.sourceText, 1);
      
      if (newFlashcards && newFlashcards.length > 0) {
        const newCard = newFlashcards[0];
        
        // Replace the specific flashcard
        flashcardSet.flashcards = flashcardSet.flashcards.map(card => {
          if (card._id.toString() === cardId) {
            cardFound = true;
            return {
              ...card.toObject(),
              question: newCard.question,
              answer: newCard.answer,
              lastModified: new Date(),
              regenerated: true
            };
          }
          return card;
        });
      }
    } else if (flashcardSet.type === 'mcq') {
      // Generate new MCQ from the source text
      const newQuestions = await generateMCQsFromText(flashcardSet.sourceText, 1);
      
      if (newQuestions && newQuestions.length > 0) {
        const newQuestion = newQuestions[0];
        
        // Replace the specific question
        flashcardSet.questions = flashcardSet.questions.map(question => {
          if (question._id.toString() === cardId) {
            cardFound = true;
            return {
              ...question.toObject(),
              questionText: newQuestion.questionText,
              options: newQuestion.options,
              correctAnswer: newQuestion.correctAnswer,
              explanation: newQuestion.explanation,
              lastModified: new Date(),
              regenerated: true
            };
          }
          return question;
        });
      }
    }

    if (!cardFound) {
      return res.status(404).json({ message: 'Flashcard not found in this set' });
    }

    // Update the set's last modified date
    flashcardSet.updatedAt = new Date();

    // Save the updated set
    updatedSet = await flashcardSet.save();

    res.status(200).json({
      message: 'Flashcard regenerated successfully',
      flashcardSet: updatedSet
    });

  } catch (error) {
    console.error('Error regenerating flashcard:', error);
    res.status(500).json({ message: 'Server error while regenerating flashcard' });
  }
});

export default router;
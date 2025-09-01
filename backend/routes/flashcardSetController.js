import express from 'express';
import FlashcardSet from '../models/FlashcardSet.js';
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

export default router;
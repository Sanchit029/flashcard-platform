import express from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { generateMCQsFromText, generateSummariesFromText } from '../services/aiService.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// @route   POST /api/ai/generate-mcqs
// @desc    Generate MCQs from text
// @access  Private
router.post('/generate-mcqs', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'No text provided.' });
    }

    const mcqs = await generateMCQsFromText(text);

    res.status(200).json(mcqs);
  } catch (error) {
    console.error('Error generating MCQs:', error);
    res.status(500).json({ message: 'Server error while generating MCQs.' });
  }
});

// @route   POST /api/ai/summarize
// @desc    Generate a summary from text
// @access  Private
router.post('/summarize', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'No text provided.' });
    }

    const summaries = await generateSummariesFromText(text);

    res.status(200).json(summaries);
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ message: 'Server error while generating summary.' });
  }
});

// @route   POST /api/ai/upload/text
// @desc    Process raw text for quiz generation
// @access  Private
router.post('/upload/text', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'No text provided' });
    res.json({ extractedText: text });
  } catch (err) {
    console.error('Error processing text:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/ai/upload/pdf
// @desc    Upload PDF and extract text for quiz generation
// @access  Private
router.post('/upload/pdf', authMiddleware, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No PDF uploaded' });
    const data = await pdfParse(req.file.buffer);
    res.json({ extractedText: data.text });
  } catch (err) {
    console.error('Error extracting PDF:', err);
    res.status(500).json({ message: 'PDF extraction error' });
  }
});

// Utility: Split text into concepts (dummy)
function splitTextIntoConcepts(text) {
  // Dummy: split by sentences
  return text.split('.').map(s => s.trim()).filter(Boolean);
}

// Utility: Generate Q/A pairs (dummy)
function generateFlashcards(concepts) {
  // Dummy: one Q/A per concept
  return concepts.map((concept, idx) => ({
    question: `What is concept ${idx + 1}?`,
    answer: concept
  }));
}

// @route   POST /api/ai/generate-flashcards
// @desc    Generate Q/A flashcards from text
// @access  Private
router.post('/generate-flashcards', authMiddleware, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: 'No text provided' });
  const concepts = splitTextIntoConcepts(text);
  const flashcards = generateFlashcards(concepts);
  res.json({ flashcards });
});

export default router;
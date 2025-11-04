import express from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { generateMCQsFromText, generateSummariesFromText, generateFlashcardsFromText, generateSummary } from '../services/aiService.js';
import { generateMCQsWithGemini, generateFlashcardsWithGemini, generateSummaryWithGemini, isGeminiAvailable } from '../services/geminiService.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024  
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});


// Generate MCQs from text using Gemini AI (if available) or Hugging Face

router.post('/generate-mcqs', authMiddleware, async (req, res) => {
  try {
    const { text, count = 5, difficulty = 'mixed' } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'No text provided for MCQ generation.' });
    }

    if (text.length < 100) {
      return res.status(400).json({ message: 'Text too short for meaningful MCQ generation. Please provide at least 100 characters.' });
    }

    // Use Gemini AI if available, otherwise fallback to Hugging Face
    const useGemini = isGeminiAvailable();
    let mcqs;
    let modelName;

    if (useGemini) {
      mcqs = await generateMCQsWithGemini(text, parseInt(count), difficulty);
      modelName = 'Google Gemini AI (gemini-2.5-flash)';
    } else {
      mcqs = await generateMCQsFromText(text, parseInt(count), difficulty);
      modelName = 'Hugging Face AI Pipeline';
    }

    res.status(200).json({
      success: true,
      count: mcqs.length,
      questions: mcqs,
      metadata: {
        textLength: text.length,
        difficulty: difficulty,
        generatedAt: new Date().toISOString(),
        model: modelName,
        usingGemini: useGemini,
        difficultyBreakdown: {
          easy: mcqs.filter(q => q.difficulty === 'easy').length,
          medium: mcqs.filter(q => q.difficulty === 'medium').length,
          hard: mcqs.filter(q => q.difficulty === 'hard').length
        }
      }
    });

  } catch (error) {
    console.error('❌ Error generating MCQs:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      useGemini: isGeminiAvailable()
    });
    res.status(500).json({ 
      success: false,
      message: 'Server error while generating MCQs. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? {
        usingGemini: isGeminiAvailable(),
        errorType: error.constructor.name
      } : undefined
    });
  }
});


//Generate Q&A flashcards from text using Gemini AI (if available) or Hugging Face

router.post('/generate-flashcards', authMiddleware, async (req, res) => {
  try {
    const { text, count = 5 } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'No text provided for flashcard generation.' });
    }

    if (text.length < 50) {
      return res.status(400).json({ message: 'Text too short for flashcard generation. Please provide more content.' });
    }

    // Use Gemini AI if available, otherwise fallback to Hugging Face
    const useGemini = isGeminiAvailable();
    let flashcards;
    let modelName;

    if (useGemini) {
      flashcards = await generateFlashcardsWithGemini(text, parseInt(count));
      modelName = 'Google Gemini AI (gemini-2.5-flash)';
    } else {
      flashcards = await generateFlashcardsFromText(text, parseInt(count));
      modelName = 'Hugging Face AI Pipeline';
    }

    res.status(200).json({
      success: true,
      flashcards: flashcards,
      count: flashcards.length,
      metadata: {
        textLength: text.length,
        generatedAt: new Date().toISOString(),
        model: modelName,
        usingGemini: useGemini
      }
    });

  } catch (error) {
    console.error('❌ Error generating flashcards:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating flashcards. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


// Test AI summary generation - NO AUTH REQUIRED
router.post('/test-summarize', async (req, res) => {
  try {
    const { 
      text, 
      type = 'both', // 'short', 'detailed', or 'both'
      maxLength = 150, 
      detailedMaxLength = 300 
    } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'No text provided for summarization.' });
    }

    if (text.length < 50) {
      return res.status(400).json({ message: 'Text too short for meaningful summarization. Please provide at least 50 characters.' });
    }

    // Use Gemini AI if available, otherwise fallback to Hugging Face
    const useGemini = isGeminiAvailable();
    let summary;

    if (useGemini) {
      summary = await generateSummaryWithGemini(text, {
        type,
        maxLength: parseInt(maxLength),
        detailedMaxLength: parseInt(detailedMaxLength)
      });
    } else {
      summary = await generateSummary(text, {
        type,
        maxLength: parseInt(maxLength),
        detailedMaxLength: parseInt(detailedMaxLength)
      });
    }

    res.status(200).json({
      success: true,
      data: summary,
      metadata: {
        textLength: text.length,
        summaryType: type,
        generatedAt: new Date().toISOString(),
        model: summary.model || 'facebook/bart-large-cnn',
        usingGemini: useGemini,
        testEndpoint: true
      }
    });

  } catch (error) {
    console.error('❌ Error generating test summary:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating summary. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


// Generate AI summary from text using Gemini AI (if available) or Hugging Face BART

router.post('/generate-summary', authMiddleware, async (req, res) => {
  try {
    const { 
      text, 
      type = 'both', // 'short', 'detailed', or 'both'
      maxLength = 150, 
      detailedMaxLength = 300 
    } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'No text provided for summarization.' });
    }

    if (text.length < 50) {
      return res.status(400).json({ message: 'Text too short for meaningful summarization. Please provide at least 50 characters.' });
    }

    // Use Gemini AI if available, otherwise fallback to Hugging Face
    const useGemini = isGeminiAvailable();
    let summary;

    if (useGemini) {
      summary = await generateSummaryWithGemini(text, {
        type,
        maxLength: parseInt(maxLength),
        detailedMaxLength: parseInt(detailedMaxLength)
      });
    } else {
      summary = await generateSummary(text, {
        type,
        maxLength: parseInt(maxLength),
        detailedMaxLength: parseInt(detailedMaxLength)
      });
    }

    res.status(200).json({
      success: true,
      data: summary,
      metadata: {
        textLength: text.length,
        summaryType: type,
        generatedAt: new Date().toISOString(),
        model: summary.model || 'facebook/bart-large-cnn',
        usingGemini: useGemini
      }
    });

  } catch (error) {
    console.error('❌ Error generating summary:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating summary. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


// Process raw text for AI content generation

router.post('/upload/text', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'No text provided' });
    }

    // Validate and clean the text
    const cleanedText = text
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanedText.length < 50) {
      return res.status(400).json({ message: 'Text too short. Please provide at least 50 characters.' });
    }

    res.json({ 
      success: true,
      extractedText: cleanedText,
      metadata: {
        originalLength: text.length,
        cleanedLength: cleanedText.length,
        wordCount: cleanedText.split(' ').length,
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error processing text:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while processing text'
    });
  }
});


// Upload PDF and extract text for AI processing with OCR fallback

router.post('/upload/pdf', authMiddleware, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded' });
    }

    let extractedText = '';
    let extractionMethod = 'pdf-parse';
    const data = await pdfParse(req.file.buffer);
    
    if (data.text && data.text.trim().length > 50) {
      extractedText = data.text;
    } else {
      return res.status(400).json({ 
        success: false,
        message: 'This PDF appears to be image-based or scanned. Please try uploading a text-based PDF or copy-paste the text directly.',
        details: `pdf-parse extracted only ${data.text.trim().length} characters. Try using the text input option instead.`,
        suggestion: 'Use the "Paste Text" tab to manually input content from scanned documents.',
        extractedText: data.text.trim().length > 0 ? data.text.trim() : null
      });
    }
    
    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No text content found in PDF. Please ensure the PDF contains readable text or clear images of text.' 
      });
    }

    const cleanedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?;:()-]/g, '')
      .trim();

    if (cleanedText.length < 100) {
      return res.status(400).json({ 
        success: false,
        message: 'Extracted text too short for AI processing. Please upload a PDF with more content.',
        extractedLength: cleanedText.length
      });
    }

    res.json({ 
      success: true,
      extractedText: cleanedText,
      metadata: {
        filename: req.file.originalname,
        fileSize: req.file.size,
        pages: data.numpages || 'unknown',
        extractedLength: cleanedText.length,
        wordCount: cleanedText.split(' ').length,
        extractedAt: new Date().toISOString(),
        extractionMethod: extractionMethod
      }
    });

  } catch (error) {
    console.error('❌ Error extracting PDF:', error);
    
    if (error.message.includes('Invalid PDF')) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid PDF file. Please upload a valid PDF document.'
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'PDF extraction error. Please try uploading a different PDF file.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


//Get information about available AI models

router.get('/models', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      models: {
        summarization: {
          name: 'facebook/bart-large-cnn',
          description: 'BART model for text summarization',
          capabilities: ['summarization', 'key_points_extraction']
        },
        questionAnswering: {
          name: 'deepset/roberta-base-squad2',
          description: 'RoBERTa model for question answering',
          capabilities: ['question_answering', 'context_understanding']
        },
        textGeneration: {
          name: 'microsoft/DialoGPT-medium',
          description: 'DialoGPT model for text generation',
          capabilities: ['text_generation', 'conversation']
        }
      },
      features: [
        'AI-powered summarization',
        'Intelligent flashcard generation', 
        'MCQ question creation',
        'Context-aware Q&A',
        'PDF text extraction',
        'Concept extraction'
      ],
      status: process.env.HUGGINGFACE_API_KEY ? 'configured' : 'api_key_missing'
    });
  } catch (error) {
    console.error('❌ Error getting model info:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving model information'
    });
  }
});


// Check AI service health and API connectivity

router.post('/health', authMiddleware, async (req, res) => {
  try {
    const testText = "This is a simple test to check if the AI service is working properly.";
    
    // Test summarization
    const summaryTest = await generateSummary(testText, 50);
    
    res.json({
      success: true,
      status: 'healthy',
      tests: {
        summarization: summaryTest ? 'passed' : 'failed',
        apiConnection: process.env.HUGGINGFACE_API_KEY ? 'configured' : 'missing_key'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ AI Health check failed:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
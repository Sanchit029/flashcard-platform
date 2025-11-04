import express from 'express';
import Document from '../models/Document.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST /api/documents
// @desc    Save a document with generated content
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      title,
      filename,
      fileSize,
      extractedText,
      flashcards,
      mcqs,
      summary,
      metadata
    } = req.body;

    // Validate required fields
    if (!title || !filename || !extractedText) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields: title, filename, or extractedText' 
      });
    }

    // Transform summary data to match schema
    const transformSummary = (summaryData) => {
      if (!summaryData) return {};
      
      const transformed = {};
      
      if (summaryData.short) {
        const shortText = typeof summaryData.short === 'string' ? summaryData.short : summaryData.short.text || '';
        transformed.short = {
          text: shortText,
          wordCount: shortText.split(' ').length,
          compressionRatio: shortText.length / extractedText.length
        };
      }
      
      if (summaryData.detailed) {
        const detailedText = typeof summaryData.detailed === 'string' ? summaryData.detailed : summaryData.detailed.text || '';
        transformed.detailed = {
          text: detailedText,
          wordCount: detailedText.split(' ').length,
          compressionRatio: detailedText.length / extractedText.length
        };
      }
      
      if (summaryData.model) {
        transformed.model = summaryData.model;
      }
      
      return transformed;
    };

    const transformedSummary = transformSummary(summary);

    // Check if document already exists for this user with same filename
    const existingDoc = await Document.findOne({
      userId: req.user.id,
      filename: filename
    });

    if (existingDoc) {
      // Update existing document
      existingDoc.title = title;
      existingDoc.fileSize = fileSize;
      existingDoc.extractedText = extractedText;
      existingDoc.textLength = extractedText.length;
      existingDoc.flashcards = flashcards || existingDoc.flashcards;
      existingDoc.mcqs = mcqs || existingDoc.mcqs;
      existingDoc.summary = transformedSummary || existingDoc.summary;
      existingDoc.metadata = { ...existingDoc.metadata, ...metadata };

      await existingDoc.save();

      return res.status(200).json({
        success: true,
        message: 'Document updated successfully',
        document: existingDoc
      });
    }

    // Create new document
    const document = new Document({
      userId: req.user.id,
      title,
      filename,
      fileSize,
      extractedText,
      textLength: extractedText.length,
      flashcards: flashcards || [],
      mcqs: mcqs || [],
      summary: transformedSummary,
      metadata: {
        ...metadata,
        generatedAt: new Date()
      }
    });

    await document.save();

    res.status(201).json({
      success: true,
      message: 'Document saved successfully',
      document
    });

  } catch (error) {
    console.error('❌ Error saving document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/documents
// @desc    Get all documents for logged-in user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const query = { userId: req.user.id };

    // Add search filter if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { filename: { $regex: search, $options: 'i' } }
      ];
    }

    const documents = await Document.find(query)
      .select('-extractedText') // Exclude large text field from list
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Document.countDocuments(query);

    res.status(200).json({
      success: true,
      documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Error fetching documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/documents/:id
// @desc    Get a single document by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Increment view count asynchronously (fire-and-forget to avoid blocking response)
    Document.incrementViewsById(document._id).catch(error => {
      console.warn('⚠️ Warning: Failed to increment view count:', error.message);
    });

    res.status(200).json({
      success: true,
      document
    });

  } catch (error) {
    console.error('❌ Error fetching document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/documents/:id
// @desc    Update a document
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, flashcards, mcqs, summary } = req.body;

    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Update fields
    if (title) document.title = title;
    if (flashcards) document.flashcards = flashcards;
    if (mcqs) document.mcqs = mcqs;
    if (summary) document.summary = summary;

    await document.save();

    res.status(200).json({
      success: true,
      message: 'Document updated successfully',
      document
    });

  } catch (error) {
    console.error('❌ Error updating document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/documents/:id
// @desc    Delete a document
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const document = await Document.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/documents/stats/overview
// @desc    Get document statistics for user
// @access  Private
router.get('/stats/overview', authMiddleware, async (req, res) => {
  try {
    const totalDocs = await Document.countDocuments({ userId: req.user.id });
    const totalFlashcards = await Document.aggregate([
      { $match: { userId: req.user.id } },
      { $project: { count: { $size: '$flashcards' } } },
      { $group: { _id: null, total: { $sum: '$count' } } }
    ]);
    const totalMCQs = await Document.aggregate([
      { $match: { userId: req.user.id } },
      { $project: { count: { $size: '$mcqs' } } },
      { $group: { _id: null, total: { $sum: '$count' } } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalDocuments: totalDocs,
        totalFlashcards: totalFlashcards[0]?.total || 0,
        totalMCQs: totalMCQs[0]?.total || 0
      }
    });

  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

export default router;

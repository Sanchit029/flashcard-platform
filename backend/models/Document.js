import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  filename: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  extractedText: {
    type: String,
    required: true
  },
  textLength: {
    type: Number,
    required: true
  },
  
  // Generated Content
  flashcards: [{
    question: String,
    answer: String,
    difficulty: String,
    category: String,
    source: String
  }],
  
  mcqs: [{
    questionText: String,
    options: [String],
    correctAnswer: String,
    explanation: String,
    difficulty: String,
    category: String,
    source: String,
    confidence: Number
  }],
  
  summary: {
    short: {
      text: String,
      wordCount: Number,
      compressionRatio: Number
    },
    detailed: {
      text: String,
      wordCount: Number,
      compressionRatio: Number
    },
    keyPoints: [String],
    insights: {
      aiInsight: String,
      themes: [{
        name: String,
        relevance: Number
      }],
      readingLevel: String
    },
    model: String
  },
  
  // Metadata
  metadata: {
    pages: Number,
    wordCount: Number,
    extractionMethod: String,
    aiModel: String,
    generatedAt: Date
  },
  
  // Stats
  viewCount: {
    type: Number,
    default: 0
  },
  lastViewed: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ title: 'text' }); // Text search on title

// Virtual for formatted date
documentSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Method to increment view count with atomic operation
documentSchema.methods.incrementViews = async function() {
  try {
    // Use findOneAndUpdate for better atomic operation handling
    const result = await this.constructor.findOneAndUpdate(
      { _id: this._id },
      {
        $inc: { viewCount: 1 },
        $set: { lastViewed: new Date() }
      },
      { 
        new: true,
        runValidators: false, // Skip validation for performance
        timestamps: false     // Don't update updatedAt for view counts
      }
    );
    
    if (result) {
      // Update current instance with new values
      this.viewCount = result.viewCount;
      this.lastViewed = result.lastViewed;
    }
    
    return result;
  } catch (error) {
    console.error('Error incrementing views:', error);
    // Return the current document even if update fails
    return this;
  }
};

// Static method for incrementing views without version conflicts
documentSchema.statics.incrementViewsById = async function(documentId) {
  try {
    return await this.findOneAndUpdate(
      { _id: documentId },
      {
        $inc: { viewCount: 1 },
        $set: { lastViewed: new Date() }
      },
      { 
        new: true,
        runValidators: false,
        timestamps: false
      }
    );
  } catch (error) {
    console.error('Error incrementing views by ID:', error);
    return null;
  }
};

const Document = mongoose.model('Document', documentSchema);

export default Document;

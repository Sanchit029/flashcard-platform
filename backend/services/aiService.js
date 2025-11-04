import { HfInference } from '@huggingface/inference';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Hugging Face Inference client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// AI Models Configuration
const MODELS = {
  SUMMARIZATION: 'facebook/bart-large-cnn',
  QUESTION_ANSWERING: 'deepset/roberta-base-squad2',
  QUESTION_GENERATION: 'valhalla/t5-small-qa-qg-hl',
  TEXT_GENERATION: 'microsoft/DialoGPT-medium',
  SENTENCE_SIMILARITY: 'sentence-transformers/all-MiniLM-L6-v2'
};

/**
 * Generate text summary using Hugging Face BART model with flexible options
 * @param {string} text - Input text to summarize
 * @param {Object} options - Summary options
 * @param {string} options.type - 'short' | 'detailed' | 'both' (default: 'both')
 * @param {number} options.maxLength - Maximum length for short summary (default: 150)
 * @param {number} options.detailedMaxLength - Maximum length for detailed summary (default: 300)
 * @returns {Object} Summary object with requested summary types
 */
export async function generateSummary(text, options = {}) {
  try {
    if (!text || text.length < 50) {
      throw new Error('Text too short for meaningful summarization');
    }

    const {
      type = 'both',
      maxLength = 150,
      detailedMaxLength = 300
    } = options;
    
    const cleanedText = text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?;:()-]/g, '')
      .trim();

    const result = {};

    if (type === 'short' || type === 'both') {
      const shortSummaryResponse = await hf.summarization({
        model: MODELS.SUMMARIZATION,
        inputs: cleanedText.substring(0, 1024),
        parameters: {
          max_length: maxLength,
          min_length: Math.min(30, Math.floor(maxLength * 0.3)),
          do_sample: false,
          length_penalty: 2.0,
          num_beams: 4
        }
      });

      result.short = {
        text: shortSummaryResponse.summary_text,
        wordCount: shortSummaryResponse.summary_text.split(' ').length,
        compressionRatio: Math.round((shortSummaryResponse.summary_text.length / text.length) * 100)
      };
    }

    if (type === 'detailed' || type === 'both') {
      const detailedSummaryResponse = await hf.summarization({
        model: MODELS.SUMMARIZATION,
        inputs: cleanedText.substring(0, 2048),
        parameters: {
          max_length: detailedMaxLength,
          min_length: Math.min(100, Math.floor(detailedMaxLength * 0.4)),
          do_sample: true,
          temperature: 0.3,
          length_penalty: 1.0,
          num_beams: 6,
          repetition_penalty: 1.2
        }
      });

      result.detailed = {
        text: detailedSummaryResponse.summary_text,
        wordCount: detailedSummaryResponse.summary_text.split(' ').length,
        compressionRatio: Math.round((detailedSummaryResponse.summary_text.length / text.length) * 100)
      };
    }

    // Generate key points and insights
    const keyPoints = await extractKeyPoints(cleanedText);
    const insights = await generateInsights(cleanedText);

    return {
      ...result,
      keyPoints: keyPoints,
      insights: insights,
      originalLength: text.length,
      summaryType: type,
      model: 'facebook/bart-large-cnn'
    };

  } catch (error) {
    console.error('❌ Summary generation error:', error.message);
    
    // Fallback to extractive summary if API fails
    return generateFallbackSummary(text, options);
  }
}

/**
 * Legacy function name for compatibility - maps to generateSummary
 */
export async function generateSummariesFromText(text) {
  const summary = await generateSummary(text);
  return {
    shortSummary: summary.short,
    keyPoints: summary.keyPoints
  };
}

/**
 * Generate MCQ questions using improved context-aware approach
 * @param {string} text - Source text
 * @param {number} count - Number of questions to generate (5-10 recommended)
 * @param {string} difficulty - 'easy', 'medium', 'hard', or 'mixed'
 * @returns {Array<Object>} Array of MCQ objects
 */
export async function generateMCQsFromText(text, count = 8, difficulty = 'mixed') {
  try {
    console.log(`🤖 Generating ${count} MCQs with ${difficulty} difficulty using improved AI approach...`);

    if (!text || text.length < 100) {
      throw new Error('Text too short for meaningful MCQ generation');
    }

    const questions = [];
    const usedQuestions = new Set();
    const usedAnswers = new Set();
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 30);
    
    if (sentences.length < 3) {
      throw new Error('Not enough content to generate meaningful questions');
    }

    const difficultyDistribution = getDifficultyDistribution(count, difficulty);
    let easyCount = 0, mediumCount = 0, hardCount = 0;

    for (let i = 0; i < sentences.length && questions.length < count; i++) {
      const sentence = sentences[i].trim();
      
      if (sentence.length < 30 || sentence.length > 300) continue;
      
      let targetDifficulty = 'medium';
      if (easyCount < difficultyDistribution.easy) {
        targetDifficulty = 'easy';
      } else if (hardCount < difficultyDistribution.hard) {
        targetDifficulty = 'hard';
      } else if (mediumCount < difficultyDistribution.medium) {
        targetDifficulty = 'medium';
      }
      
      const contextStart = Math.max(0, i - 1);
      const contextEnd = Math.min(sentences.length, i + 2);
      const context = sentences.slice(contextStart, contextEnd).join('. ');
      
      try {
        const mcq = await generateImprovedMCQ(sentence, context, targetDifficulty, text);
        
        if (mcq && mcq.questionText && mcq.correctAnswer) {
          const questionKey = mcq.questionText.substring(0, 50).toLowerCase();
          const answerKey = mcq.correctAnswer.substring(0, 30).toLowerCase();
          
          if (!usedQuestions.has(questionKey) && !usedAnswers.has(answerKey)) {
            usedQuestions.add(questionKey);
            usedAnswers.add(answerKey);
            mcq.source = `Sentence ${i + 1}`;
            questions.push(mcq);
            
            if (targetDifficulty === 'easy') easyCount++;
            else if (targetDifficulty === 'medium') mediumCount++;
            else if (targetDifficulty === 'hard') hardCount++;
          }
        }
      } catch (error) {
        continue;
      }
    }

    return questions.slice(0, count);

  } catch (error) {
    console.error('❌ MCQ generation error:', error.message);
    return generateFallbackMCQs(text, count, difficulty);
  }
}

/**
 * Generate Q&A flashcards with improved question-answer matching
 * @param {string} text - Source text for generating questions
 * @param {number} count - Number of flashcards to generate
 * @returns {Array<Object>} Array of flashcard objects
 */
export async function generateFlashcardsFromText(text, count = 5) {
  try {
    if (!text || text.length < 100) {
      throw new Error('Text too short for meaningful flashcard generation');
    }

    console.log('🤖 Generating improved AI flashcards...');

    const flashcards = [];
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 30);
    
    if (sentences.length < 2) {
      throw new Error('Not enough content to generate meaningful flashcards');
    }

    const usedQuestions = new Set();
    const usedAnswers = new Set();

    for (let i = 0; i < sentences.length && flashcards.length < count; i++) {
      const sentence = sentences[i].trim();
      
      if (sentence.length < 30 || sentence.length > 250) continue;
      
      try {
        const flashcard = generateImprovedFlashcard(sentence, text, i);
        
        if (flashcard && flashcard.question && flashcard.answer) {
          const questionKey = flashcard.question.substring(0, 40).toLowerCase();
          const answerKey = flashcard.answer.substring(0, 30).toLowerCase();
          
          if (!usedQuestions.has(questionKey) && !usedAnswers.has(answerKey)) {
            usedQuestions.add(questionKey);
            usedAnswers.add(answerKey);
            flashcards.push(flashcard);
          }
        }
      } catch (error) {
        continue;
      }
    }

    return flashcards.slice(0, count);

  } catch (error) {
    console.error('❌ Flashcard generation error:', error.message);
    return generateFallbackFlashcards(text, count);
  }
}

/**
 * Generate improved flashcard from a sentence
 */
/**
 * Generate improved flashcard from a sentence with smarter question generation
 */
function generateImprovedFlashcard(sentence, fullText, index) {
  try {
    const words = sentence.split(/\s+/);
    if (words.length < 6 || words.length > 45) return null;
    
    const numberRatio = (sentence.match(/\d+/g) || []).length / words.length;
    if (numberRatio > 0.3) return null;
    
    let question, answer;
    const sentenceLower = sentence.toLowerCase();
    
    // Strategy 1: Definition-based (if sentence defines something)
    if (sentenceLower.includes(' is ') || sentenceLower.includes(' are ') || sentenceLower.includes(' refers to ')) {
      const keyTerm = extractSubject(sentence);
      if (keyTerm) {
        question = `Define or explain: ${keyTerm}`;
        answer = sentence.trim();
        
        return {
          question: question,
          answer: answer,
          difficulty: assessFlashcardDifficulty(sentence),
          category: 'definition',
          source: `Sentence ${index + 1}`,
          type: 'definition'
        };
      }
    }
    
    // Strategy 2: Process/Method-based
    if (sentenceLower.match(/process|method|approach|technique|procedure|steps|way to/)) {
      const process = extractProcess(sentence);
      question = `How does ${process} work?`;
      answer = sentence.trim();
      
      return {
        question: question,
        answer: answer,
        difficulty: assessFlashcardDifficulty(sentence),
        category: 'process',
        source: `Sentence ${index + 1}`,
        type: 'procedural'
      };
    }
    
    // Strategy 3: Cause-Effect (if sentence shows causation)
    if (sentenceLower.match(/because|therefore|thus|hence|leads to|results in|causes/)) {
      const mainConcept = extractMostImportantPhrase(sentence);
      question = `What is the relationship described regarding ${mainConcept}?`;
      answer = sentence.trim();
      
      return {
        question: question,
        answer: answer,
        difficulty: 'medium',
        category: 'causation',
        source: `Sentence ${index + 1}`,
        type: 'cause-effect'
      };
    }
    
    // Strategy 4: Comparison (if sentence compares things)
    if (sentenceLower.match(/compared to|versus|while|whereas|different from|similar to/)) {
      const subjects = extractComparisonSubjects(sentence);
      question = `Compare and explain: ${subjects}`;
      answer = sentence.trim();
      
      return {
        question: question,
        answer: answer,
        difficulty: 'hard',
        category: 'comparison',
        source: `Sentence ${index + 1}`,
        type: 'comparative'
      };
    }
    
    // Strategy 5: General comprehension (fallback)
    const keyPhrase = extractMostImportantPhrase(sentence) || extractKeyPhrase(sentence);
    if (!keyPhrase) return null;
    
    const questionTemplates = [
      `What does the text state about ${keyPhrase}?`,
      `Explain the concept of ${keyPhrase}`,
      `What is important to know about ${keyPhrase}?`,
      `Describe ${keyPhrase} based on the text`
    ];
    
    question = questionTemplates[index % questionTemplates.length];
    answer = sentence.trim();
    
    return {
      question: question,
      answer: answer,
      difficulty: assessFlashcardDifficulty(sentence),
      category: 'comprehension',
      source: `Sentence ${index + 1}`,
      type: 'general'
    };
    
  } catch (error) {
    console.error('❌ Improved flashcard generation error:', error.message);
    return null;
  }
}

/**
 * Extract the subject of a sentence (for definition-type questions)
 */
function extractSubject(sentence) {
  // Look for pattern: "X is/are ..."
  const match = sentence.match(/^([A-Z][^,]+?)\s+(is|are|was|were|refers to|means)/i);
  if (match) {
    return match[1].trim();
  }
  
  // Fallback to first few words
  const words = sentence.split(/\s+/);
  return words.slice(0, 3).join(' ').replace(/[^\w\s]/g, '');
}

/**
 * Extract process description
 */
function extractProcess(sentence) {
  const words = sentence.split(/\s+/);
  const processWords = ['process', 'method', 'approach', 'technique', 'procedure', 'way'];
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase().replace(/[^\w]/g, '');
    if (processWords.includes(word) && i > 0) {
      return words.slice(Math.max(0, i - 2), i + 1).join(' ').replace(/[^\w\s]/g, '');
    }
  }
  
  return 'this process';
}

/**
 * Extract subjects being compared
 */
function extractComparisonSubjects(sentence) {
  const words = sentence.split(/\s+/);
  
  // Look for capitalized words that might be the subjects
  const capitalized = words.filter(w => /^[A-Z][a-z]+/.test(w) && w.length > 3);
  
  if (capitalized.length >= 2) {
    return `${capitalized[0]} and ${capitalized[1]}`;
  }
  
  return 'these concepts';
}

/**
 * Assess flashcard difficulty based on content with enhanced metrics
 */
function assessFlashcardDifficulty(text) {
  const words = text.split(/\s+/);
  let complexityScore = 0;
  
  // Factor 1: Complex words (>10 characters)
  const complexWords = words.filter(w => w.length > 10).length;
  complexityScore += complexWords * 2;
  
  // Factor 2: Average word length
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
  if (avgWordLength > 7) complexityScore += 3;
  else if (avgWordLength > 5.5) complexityScore += 1.5;
  
  // Factor 3: Sentence length
  if (words.length > 25) complexityScore += 2;
  else if (words.length > 15) complexityScore += 1;
  
  // Factor 4: Technical terms indicators
  const technicalIndicators = /analysis|synthesis|methodology|theoretical|empirical|paradigm|hypothesis|framework/i;
  if (technicalIndicators.test(text)) complexityScore += 2;
  
  // Factor 5: Abstract concepts
  const abstractIndicators = /concept|principle|theory|philosophy|ideology|perception/i;
  if (abstractIndicators.test(text)) complexityScore += 1.5;
  
  // Determine difficulty level
  if (complexityScore >= 6) return 'hard';
  if (complexityScore >= 3) return 'medium';
  return 'easy';
}

// Helper Functions

/**
 * Get difficulty distribution based on count and difficulty setting
 */
function getDifficultyDistribution(count, difficulty) {
  if (difficulty === 'easy') {
    return { easy: count, medium: 0, hard: 0 };
  } else if (difficulty === 'medium') {
    return { easy: 0, medium: count, hard: 0 };
  } else if (difficulty === 'hard') {
    return { easy: 0, medium: 0, hard: count };
  } else { // mixed
    const easyCount = Math.floor(count * 0.3);
    const hardCount = Math.floor(count * 0.3);
    const mediumCount = count - easyCount - hardCount;
    return { easy: easyCount, medium: mediumCount, hard: hardCount };
  }
}

/**
 * Generate improved MCQ from sentence with better question-answer matching
 * Enhanced with smarter question generation and validation
 * @param {string} sentence - Main sentence to create question from
 * @param {string} context - Surrounding context
 * @param {string} targetDifficulty - Target difficulty level
 * @param {string} fullText - Full text for distractor generation
 * @returns {Object} MCQ object
 */
async function generateImprovedMCQ(sentence, context, targetDifficulty = 'medium', fullText = '') {
  try {
    // Skip sentences that are too short or too long
    const words = sentence.split(/\s+/).filter(w => w.length > 2);
    if (words.length < 8 || words.length > 50) return null;
    
    // Skip sentences with too many numbers (likely not good for questions)
    const numberCount = (sentence.match(/\d+/g) || []).length;
    if (numberCount > 5) return null;
    
    let questionText, correctAnswer;
    
    // Generate question based on difficulty with enhanced logic
    if (targetDifficulty === 'easy') {
      // Easy: Direct factual recall with clear answers
      const keyInfo = extractMostImportantPhrase(sentence);
      if (!keyInfo) return null;
      
      questionText = `According to the text, what is stated about ${keyInfo}?`;
      correctAnswer = sentence.trim();
      
    } else if (targetDifficulty === 'hard') {
      // Hard: Analysis and deeper understanding
      const concept = extractMainConcept(sentence);
      if (!concept) return null;
      
      // Try to use surrounding context for harder questions
      const extendedContext = context.length > sentence.length ? context : sentence;
      questionText = `Based on the information provided, which statement best explains ${concept}?`;
      correctAnswer = extendedContext.trim();
      
    } else {
      // Medium: Comprehension with context
      const blankInfo = createIntelligentBlankQuestion(sentence);
      if (!blankInfo) {
        // Fallback to concept-based question
        const mainIdea = extractMainIdea(sentence);
        questionText = `What does the text indicate about ${mainIdea}?`;
        correctAnswer = sentence.trim();
      } else {
        questionText = blankInfo.question;
        correctAnswer = blankInfo.answer;
      }
    }
    
    // Validate question quality
    if (!questionText || !correctAnswer || correctAnswer.length < 20) {
      return null;
    }
    
    // Generate high-quality, contextual distractors
    const distractors = generateIntelligentDistractors(correctAnswer, fullText, sentence, 3, targetDifficulty);
    
    // Ensure we have exactly 4 unique options
    const uniqueOptions = new Set([correctAnswer, ...distractors]);
    if (uniqueOptions.size < 4) {
      // Add generic but plausible distractors if needed
      const genericDistractors = generateGenericDistractors(correctAnswer, targetDifficulty);
      genericDistractors.forEach(d => uniqueOptions.add(d));
    }
    
    const allOptions = Array.from(uniqueOptions).slice(0, 4);
    const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);
    
    return {
      questionText: questionText,
      options: shuffledOptions,
      correctAnswer: correctAnswer,
      explanation: generateSmartExplanation(sentence, context, targetDifficulty),
      difficulty: targetDifficulty,
      category: 'comprehension',
      confidence: calculateQuestionQuality(questionText, correctAnswer, distractors)
    };
    
  } catch (error) {
    console.error('❌ Improved MCQ generation error:', error.message);
    return null;
  }
}

/**
 * Extract key phrase from sentence for question generation
 */
function extractKeyPhrase(sentence) {
  // Remove common words and get meaningful phrases
  const words = sentence.split(/\s+/);
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were']);
  
  // Find first capitalized word or important noun
  for (const word of words) {
    const cleaned = word.replace(/[^\w]/g, '');
    if (cleaned.length > 3 && !stopWords.has(cleaned.toLowerCase())) {
      if (/^[A-Z]/.test(cleaned)) {
        return cleaned;
      }
    }
  }
  
  // Fallback: return first meaningful word
  const meaningful = words.find(w => {
    const cleaned = w.replace(/[^\w]/g, '').toLowerCase();
    return cleaned.length > 4 && !stopWords.has(cleaned);
  });
  
  return meaningful ? meaningful.replace(/[^\w]/g, '') : null;
}

/**
 * Extract main concept from sentence
 */
function extractMainConcept(sentence) {
  const words = sentence.split(/\s+/);
  
  // Look for action words or important phrases
  const actionWords = ['process', 'method', 'approach', 'technique', 'concept', 'principle', 'theory', 'system'];
  
  for (const word of words) {
    const cleaned = word.toLowerCase().replace(/[^\w]/g, '');
    if (actionWords.includes(cleaned)) {
      // Return the word and maybe the next word
      const index = words.indexOf(word);
      if (index < words.length - 1) {
        return `${word} ${words[index + 1]}`.replace(/[^\w\s]/g, '');
      }
      return word.replace(/[^\w]/g, '');
    }
  }
  
  // Fallback: first significant word
  return extractKeyPhrase(sentence);
}

/**
 * Create fill-in-the-blank style question
 */
function createBlankQuestion(sentence) {
  const words = sentence.split(/\s+/);
  if (words.length < 6) return null;
  
  // Find a good word to blank out (avoid first and last word)
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had']);
  
  // Look for an important word in the middle section
  const middleStart = Math.floor(words.length * 0.3);
  const middleEnd = Math.floor(words.length * 0.7);
  
  for (let i = middleStart; i < middleEnd; i++) {
    const word = words[i];
    const cleaned = word.toLowerCase().replace(/[^\w]/g, '');
    
    if (cleaned.length > 4 && !stopWords.has(cleaned)) {
      // Create the blank question
      const questionWords = [...words];
      questionWords[i] = '_______';
      
      return {
        question: `Fill in the blank: ${questionWords.join(' ')}`,
        answer: sentence.trim()
      };
    }
  }
  
  return null;
}

/**
 * Generate contextual distractors that are plausible but incorrect
 */
function generateContextualDistractors(correctAnswer, fullText, originalSentence, count = 3) {
  const distractors = [];
  const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 30);
  
  // Filter out the original sentence
  const otherSentences = sentences.filter(s => {
    const trimmed = s.trim();
    return trimmed !== originalSentence.trim() && 
           trimmed !== correctAnswer.trim() &&
           trimmed.length > 25 &&
           trimmed.length < 200;
  });
  
  // Select diverse distractors from different parts of the text
  const step = Math.max(1, Math.floor(otherSentences.length / count));
  
  for (let i = 0; i < count && i * step < otherSentences.length; i++) {
    const distractor = otherSentences[i * step].trim();
    if (!distractors.includes(distractor) && distractor !== correctAnswer) {
      distractors.push(distractor);
    }
  }
  
  // If we don't have enough distractors, add generic plausible ones
  const genericDistractors = [
    'This information is not mentioned in the provided text',
    'The text focuses on a different aspect of this topic',
    'This represents an alternative interpretation not supported by the text'
  ];
  
  while (distractors.length < count) {
    const generic = genericDistractors[distractors.length % genericDistractors.length];
    if (!distractors.includes(generic)) {
      distractors.push(generic);
    } else {
      // Try to get another sentence if available
      const randomIndex = Math.floor(Math.random() * otherSentences.length);
      const randomSentence = otherSentences[randomIndex]?.trim();
      if (randomSentence && !distractors.includes(randomSentence) && randomSentence !== correctAnswer) {
        distractors.push(randomSentence);
      }
    }
  }
  
  return distractors.slice(0, count);
}

/**
 * Analyze question complexity to determine difficulty
 */
function analyzeDifficulty(questionText, context) {
  let complexityScore = 0;
  
  // Question length analysis
  const words = questionText.split(/\s+/);
  if (words.length > 15) complexityScore += 2;
  else if (words.length > 10) complexityScore += 1;
  
  // Complex words analysis
  const complexWords = words.filter(word => word.length > 10).length;
  complexityScore += complexWords;
  
  // Question type analysis
  if (questionText.includes('analyze') || questionText.includes('evaluate') || 
      questionText.includes('compare') || questionText.includes('synthesize')) {
    complexityScore += 3; // Higher-order thinking
  } else if (questionText.includes('explain') || questionText.includes('describe') ||
             questionText.includes('discuss')) {
    complexityScore += 2; // Medium-order thinking
  } else if (questionText.includes('what') || questionText.includes('who') ||
             questionText.includes('when') || questionText.includes('where')) {
    complexityScore += 0; // Lower-order thinking
  }
  
  // Context dependency
  const contextWords = context.split(/\s+/).length;
  if (contextWords > 100) complexityScore += 1;
  
  // Determine difficulty
  if (complexityScore <= 2) return 'easy';
  else if (complexityScore <= 5) return 'medium';
  else return 'hard';
}

// Helper Functions

/**
 * Extract the most important phrase from a sentence for easy questions
 */
function extractMostImportantPhrase(sentence) {
  const words = sentence.split(/\s+/);
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had']);
  
  // Look for capitalized multi-word phrases (proper nouns)
  for (let i = 0; i < words.length - 1; i++) {
    if (/^[A-Z]/.test(words[i]) && /^[A-Z]/.test(words[i + 1])) {
      return `${words[i]} ${words[i + 1]}`.replace(/[^\w\s]/g, '');
    }
  }
  
  // Look for important single words
  const importantWords = ['method', 'process', 'technique', 'approach', 'concept', 'theory', 'principle', 'system', 'model', 'framework'];
  for (const word of words) {
    const cleaned = word.toLowerCase().replace(/[^\w]/g, '');
    if (importantWords.includes(cleaned)) {
      return word.replace(/[^\w]/g, '');
    }
  }
  
  // Fallback to first meaningful noun
  for (const word of words) {
    const cleaned = word.replace(/[^\w]/g, '');
    if (cleaned.length > 4 && !stopWords.has(cleaned.toLowerCase()) && /^[A-Z]/.test(cleaned)) {
      return cleaned;
    }
  }
  
  return extractKeyPhrase(sentence);
}

/**
 * Extract main idea from sentence for medium difficulty
 */
function extractMainIdea(sentence) {
  // Look for subject-verb patterns
  const words = sentence.split(/\s+/);
  
  // Find verbs that indicate main actions
  const actionVerbs = ['shows', 'demonstrates', 'indicates', 'reveals', 'proves', 'explains', 'describes', 'involves', 'requires', 'enables'];
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase().replace(/[^\w]/g, '');
    if (actionVerbs.includes(word) && i > 0) {
      // Return the subject before the verb
      return words.slice(0, i).join(' ').replace(/[^\w\s]/g, '');
    }
  }
  
  // Fallback to first few meaningful words
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to']);
  const meaningful = words.filter(w => !stopWords.has(w.toLowerCase()) && w.length > 3).slice(0, 3);
  return meaningful.join(' ').replace(/[^\w\s]/g, '') || 'this topic';
}

/**
 * Create intelligent blank question with better word selection
 */
function createIntelligentBlankQuestion(sentence) {
  const words = sentence.split(/\s+/);
  if (words.length < 8) return null;
  
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did']);
  
  // Priority 1: Look for important nouns or concepts
  const importantTerms = ['method', 'process', 'system', 'approach', 'technique', 'concept', 'theory', 'principle', 'model', 'framework', 'strategy', 'mechanism'];
  
  for (let i = 2; i < words.length - 2; i++) {
    const word = words[i].toLowerCase().replace(/[^\w]/g, '');
    if (importantTerms.includes(word) || (word.length > 6 && !stopWords.has(word))) {
      const questionWords = [...words];
      questionWords[i] = '_______';
      return {
        question: `Complete the statement: ${questionWords.join(' ')}`,
        answer: sentence.trim()
      };
    }
  }
  
  // Priority 2: Look for capitalized words (proper nouns)
  for (let i = 2; i < words.length - 2; i++) {
    if (/^[A-Z][a-z]+/.test(words[i]) && words[i].length > 4) {
      const questionWords = [...words];
      questionWords[i] = '_______';
      return {
        question: `Fill in the blank: ${questionWords.join(' ')}`,
        answer: sentence.trim()
      };
    }
  }
  
  // Fallback to middle meaningful word
  const middleStart = Math.floor(words.length * 0.35);
  const middleEnd = Math.floor(words.length * 0.65);
  
  for (let i = middleStart; i < middleEnd; i++) {
    const cleaned = words[i].toLowerCase().replace(/[^\w]/g, '');
    if (cleaned.length > 5 && !stopWords.has(cleaned)) {
      const questionWords = [...words];
      questionWords[i] = '_______';
      return {
        question: `Fill in the blank: ${questionWords.join(' ')}`,
        answer: sentence.trim()
      };
    }
  }
  
  return null;
}

/**
 * Generate intelligent distractors that are contextually similar but incorrect
 */
function generateIntelligentDistractors(correctAnswer, fullText, originalSentence, count = 3, difficulty = 'medium') {
  const distractors = [];
  const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 30);
  
  // Filter out the original sentence and very different sentences
  const candidates = sentences.filter(s => {
    const trimmed = s.trim();
    if (trimmed === originalSentence.trim() || trimmed === correctAnswer.trim()) return false;
    
    // For harder questions, pick more similar sentences
    if (difficulty === 'hard') {
      const overlap = calculateWordOverlap(trimmed, correctAnswer);
      return overlap > 0.1 && overlap < 0.7; // Some overlap but not too much
    }
    
    return trimmed.length > 25 && trimmed.length < 200;
  });
  
  // Score candidates by relevance
  const scored = candidates.map(candidate => {
    let score = 0;
    
    // Prefer similar length
    const lengthRatio = Math.min(candidate.length, correctAnswer.length) / Math.max(candidate.length, correctAnswer.length);
    score += lengthRatio * 10;
    
    // Prefer some keyword overlap (makes distractors plausible)
    const overlap = calculateWordOverlap(candidate, correctAnswer);
    if (difficulty === 'easy') {
      score += overlap * 5; // Less overlap for easier distinction
    } else {
      score += overlap * 15; // More overlap for harder questions
    }
    
    // Prefer sentences from different parts of the text
    const position = candidates.indexOf(candidate) / candidates.length;
    score += Math.abs(0.5 - position) * 5;
    
    return { text: candidate.trim(), score };
  });
  
  // Sort by score and pick top candidates
  scored.sort((a, b) => b.score - a.score);
  
  // Add diverse distractors
  const step = Math.max(1, Math.floor(scored.length / count));
  for (let i = 0; i < scored.length && distractors.length < count; i += step) {
    const candidate = scored[i].text;
    if (!distractors.includes(candidate) && candidate !== correctAnswer) {
      distractors.push(candidate);
    }
  }
  
  return distractors.slice(0, count);
}

/**
 * Calculate word overlap between two strings (for distractor selection)
 */
function calculateWordOverlap(text1, text2) {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Generate generic but plausible distractors as fallback
 */
function generateGenericDistractors(correctAnswer, difficulty = 'medium') {
  if (difficulty === 'easy') {
    return [
      'This information is not mentioned in the text.',
      'The text discusses a different concept altogether.',
      'This statement contradicts the information provided.'
    ];
  } else if (difficulty === 'hard') {
    return [
      'While related, this represents a different aspect not fully addressed in the text.',
      'This interpretation goes beyond what is explicitly stated in the passage.',
      'This conclusion requires additional information not present in the text.'
    ];
  } else {
    return [
      'The text provides different information about this topic.',
      'This represents an alternative perspective not discussed.',
      'This detail is not supported by the provided content.'
    ];
  }
}

/**
 * Generate smart explanation based on context and difficulty
 */
function generateSmartExplanation(sentence, context, difficulty) {
  const baseExplanation = `This answer is directly stated in the text: "${sentence.substring(0, 100)}${sentence.length > 100 ? '...' : ''}"`;
  
  if (difficulty === 'easy') {
    return `${baseExplanation} This is a straightforward recall question.`;
  } else if (difficulty === 'hard') {
    return `${baseExplanation} This requires understanding the broader context and relationships in the passage.`;
  } else {
    return `${baseExplanation} Pay attention to the specific wording used.`;
  }
}

/**
 * Calculate question quality score
 */
function calculateQuestionQuality(question, answer, distractors) {
  let score = 0.5; // Base score
  
  // Question length (not too short, not too long)
  const qWords = question.split(/\s+/).length;
  if (qWords >= 8 && qWords <= 20) score += 0.15;
  
  // Answer length (substantial)
  const aWords = answer.split(/\s+/).length;
  if (aWords >= 8 && aWords <= 40) score += 0.15;
  
  // Distractors quality (all different lengths)
  const uniqueLengths = new Set(distractors.map(d => Math.floor(d.length / 10)));
  if (uniqueLengths.size >= 2) score += 0.1;
  
  // Question starts with question word or clear prompt
  if (/^(what|which|how|according|based|complete|fill)/i.test(question)) score += 0.1;
  
  return Math.min(score, 1.0);
}

/**
 * Generate insights and themes from text using T5 model
 */
async function generateInsights(text) {
  try {
    console.log('💡 Generating insights from text...');
    
    // Use T5 for generating insights
    const prompt = `analyze insights: ${text.substring(0, 500)}`;
    
    const insightResponse = await hf.textGeneration({
      model: MODELS.QUESTION_GENERATION, // Reuse T5 model for insights
      inputs: prompt,
      parameters: {
        max_new_tokens: 100,
        temperature: 0.7,
        do_sample: true,
        num_return_sequences: 1
      }
    });

    // Extract themes and patterns
    const themes = extractThemes(text);
    const patterns = identifyPatterns(text);

    return {
      aiInsight: insightResponse.generated_text?.replace(prompt, '').trim() || 'Key concepts and relationships identified in the text.',
      themes: themes,
      patterns: patterns,
      readingLevel: assessReadingLevel(text)
    };

  } catch (error) {
    console.error('Insights generation error:', error.message);
    return {
      aiInsight: 'This text contains important information that can be studied and analyzed.',
      themes: extractThemes(text),
      patterns: ['Sequential information', 'Key concepts', 'Supporting details'],
      readingLevel: 'Intermediate'
    };
  }
}

/**
 * Extract key points from text using sentence importance scoring
 */
async function extractKeyPoints(text) {
  try {
    const sentences = text
      .split(/[.!?]+/)
      .filter(sentence => sentence.trim().length > 20)
      .map(sentence => sentence.trim())
      .slice(0, 10);

    if (sentences.length === 0) {
      return ['No key points could be extracted from the provided text.'];
    }

    const scoredSentences = sentences.map((sentence, index) => {
      let score = 0;
      score += Math.max(0, 10 - index); // Position scoring
      
      const wordCount = sentence.split(' ').length;
      if (wordCount >= 8 && wordCount <= 25) score += 5; // Length scoring
      
      const keywords = ['important', 'key', 'main', 'primary', 'essential', 'crucial', 'significant'];
      keywords.forEach(keyword => {
        if (sentence.toLowerCase().includes(keyword)) score += 3;
      });

      return { sentence, score, index };
    });

    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(5, sentences.length))
      .sort((a, b) => a.index - b.index)
      .map(item => item.sentence);

    return topSentences.length > 0 ? topSentences : 
           ['Key concepts and important information from the provided text.'];

  } catch (error) {
    console.error('❌ Key points extraction error:', error);
    return ['Unable to extract key points at this time.'];
  }
}

/**
 * Extract key concepts from text using improved algorithms
 */
async function extractConcepts(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const concepts = [];
  
  // Extract nouns and important phrases
  const words = text.replace(/[^\w\s]/g, ' ').split(/\s+/);
  const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'a', 'an']);
  
  // Extract capitalized words (proper nouns)
  words.forEach((word, index) => {
    if (word.length > 3 && /^[A-Z][a-zA-Z]+$/.test(word) && !stopWords.has(word.toLowerCase())) {
      concepts.push(word);
    }
  });
  
  // Extract important phrases from different parts of the text
  const textParts = [];
  const chunkSize = Math.floor(sentences.length / 3);
  if (chunkSize > 0) {
    textParts.push(sentences.slice(0, chunkSize).join('. '));
    textParts.push(sentences.slice(chunkSize, chunkSize * 2).join('. '));
    textParts.push(sentences.slice(chunkSize * 2).join('. '));
  } else {
    textParts.push(text);
  }
  
  // Extract noun phrases from each part
  textParts.forEach(part => {
    const partWords = part.split(/\s+/);
    for (let i = 0; i < partWords.length - 1; i++) {
      const phrase = `${partWords[i]} ${partWords[i + 1]}`.replace(/[^\w\s]/g, '');
      if (phrase.length > 6 && phrase.length < 25 && 
          !stopWords.has(partWords[i].toLowerCase()) && 
          !stopWords.has(partWords[i + 1].toLowerCase())) {
        concepts.push(phrase);
      }
    }
  });
  
  // Extract key terms that appear frequently
  const termFrequency = {};
  words.forEach(word => {
    const clean = word.toLowerCase().replace(/[^\w]/g, '');
    if (clean.length > 4 && !stopWords.has(clean)) {
      termFrequency[clean] = (termFrequency[clean] || 0) + 1;
    }
  });
  
  const frequentTerms = Object.entries(termFrequency)
    .filter(([term, freq]) => freq > 1)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([term]) => term);
  
  concepts.push(...frequentTerms);
  
  const uniqueConcepts = [...new Set(concepts)].filter(c => c.length > 2);
  return uniqueConcepts.slice(0, 12);
}

/**
 * Get answer from context using Hugging Face Q&A model
 */
async function getAnswerFromContext(question, context) {
  try {
    if (!process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY === 'your-huggingface-api-key-here') {
      throw new Error('Hugging Face API key not configured');
    }

    // Use more context for better answers, but within model limits
    const contextToUse = context.substring(0, 800);

    const response = await hf.questionAnswering({
      model: MODELS.QUESTION_ANSWERING,
      inputs: {
        question: question,
        context: contextToUse
      }
    });

    // Only return high-confidence answers
    if (response.answer && response.score > 0.15 && response.answer.length > 3) {
      return response.answer;
    } else {
      return extractDirectAnswer(question, context);
    }

  } catch (error) {
    console.error('❌ Q&A model error:', error.message);
    return extractDirectAnswer(question, context);
  }
}

/**
 * Generate a single MCQ question from concept and context
 */
async function generateMCQQuestion(concept, context) {
  try {
    const questionTemplates = [
      `What is ${concept}?`,
      `Which statement about ${concept} is correct?`,
      `${concept} is best described as:`,
      `According to the text, ${concept}:`
    ];
    
    const questionText = questionTemplates[Math.floor(Math.random() * questionTemplates.length)];
    
    let correctAnswer;
    try {
      correctAnswer = await getAnswerFromContext(questionText, context);
    } catch (error) {
      correctAnswer = extractDirectAnswer(questionText, context);
    }
    
    if (!correctAnswer || correctAnswer.length < 3) {
      return null;
    }

    const distractors = generateDistractors(correctAnswer, concept, context);
    const options = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);
    
    return {
      questionText: questionText,
      options: options,
      correctAnswer: correctAnswer,
      explanation: `Based on the context: "${context.substring(0, 100)}..."`,
      difficulty: calculateDifficulty(concept),
      category: categorizeContent(concept)
    };

  } catch (error) {
    console.error('❌ MCQ question generation error:', error);
    return null;
  }
}

/**
 * Find best context sentence for a concept with improved matching
 */
function findBestContext(concept, sentences) {
  const conceptLower = concept.toLowerCase();
  const conceptWords = conceptLower.split(/\s+/);
  
  // Score sentences based on concept relevance
  const scoredSentences = sentences.map(sentence => {
    const sentenceLower = sentence.toLowerCase();
    let score = 0;
    
    // Exact concept match gets highest score
    if (sentenceLower.includes(conceptLower)) {
      score += 10;
    }
    
    // Partial word matches
    conceptWords.forEach(word => {
      if (word.length > 3 && sentenceLower.includes(word)) {
        score += 3;
      }
    });
    
    // Prefer sentences with moderate length
    const wordCount = sentence.split(/\s+/).length;
    if (wordCount >= 8 && wordCount <= 25) {
      score += 2;
    }
    
    return { sentence: sentence.trim(), score };
  });
  
  // Return the best matching sentence, or distribute across different sentences
  const bestMatch = scoredSentences.sort((a, b) => b.score - a.score)[0];
  return bestMatch && bestMatch.score > 0 ? bestMatch.sentence : sentences[0] || null;
}

/**
 * Generate question for a concept
 */
function generateQuestionForConcept(concept) {
  const templates = [
    `What is ${concept}?`,
    `How would you define ${concept}?`,
    `Explain ${concept}`,
    `What does ${concept} refer to?`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Extract direct answer from context with improved logic
 */
function extractDirectAnswer(question, context) {
  const sentences = context.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const questionLower = question.toLowerCase();
  const questionWords = questionLower.split(/\s+/).filter(word => 
    word.length > 3 && !['what', 'how', 'where', 'when', 'why', 'which', 'does', 'would'].includes(word)
  );
  
  // Look for sentences that contain the most question keywords
  const scoredSentences = sentences.map(sentence => {
    const sentenceLower = sentence.toLowerCase();
    let score = 0;
    
    questionWords.forEach(word => {
      if (sentenceLower.includes(word)) {
        score += 2;
      }
    });
    
    // Prefer sentences with moderate length for better answers
    const wordCount = sentence.split(/\s+/).length;
    if (wordCount >= 6 && wordCount <= 20) {
      score += 1;
    }
    
    return { sentence: sentence.trim(), score };
  });
  
  const bestAnswer = scoredSentences
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)[0];
  
  if (bestAnswer) {
    return bestAnswer.sentence.substring(0, 120);
  }
  
  // Fallback to different parts of the text
  const fallbackSentences = sentences.filter(s => s.length > 20 && s.length < 150);
  if (fallbackSentences.length > 0) {
    const randomIndex = Math.floor(Math.random() * Math.min(3, fallbackSentences.length));
    return fallbackSentences[randomIndex].trim();
  }
  
  return context.substring(0, 80).trim();
}

/**
 * Generate distractors for MCQ options with improved variety
 */
function generateDistractors(correctAnswer, concept, context) {
  const distractors = [];
  const sentences = context.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const words = context.split(/\s+/).filter(word => word.length > 4 && word.length < 20);
  
  // Try to use related content from the text as distractors
  const relatedSentences = sentences.filter(sentence => {
    const sentenceLower = sentence.toLowerCase();
    const conceptWords = concept.toLowerCase().split(/\s+/);
    return conceptWords.some(word => sentenceLower.includes(word)) && 
           !sentence.includes(correctAnswer);
  });
  
  if (relatedSentences.length > 0) {
    distractors.push(relatedSentences[0].trim().substring(0, 80));
    if (relatedSentences.length > 1) {
      distractors.push(relatedSentences[1].trim().substring(0, 80));
    }
  }
  
  // Generate plausible but incorrect alternatives
  const randomWords = words.sort(() => Math.random() - 0.5).slice(0, 3);
  if (randomWords.length >= 2) {
    distractors.push(`${randomWords[0]} and ${randomWords[1]} are related concepts`);
  }
  
  // Fallback distractors
  const fallbacks = [
    `An alternative interpretation of the concept`,
    `A different aspect mentioned in the text`,
    `Another perspective on this topic`,
    `A related but distinct idea`
  ];
  
  while (distractors.length < 3) {
    const fallback = fallbacks[distractors.length % fallbacks.length];
    if (!distractors.includes(fallback)) {
      distractors.push(fallback);
    }
  }
  
  return distractors.slice(0, 3);
}

/**
 * Generate pattern-based MCQ from sentence with difficulty support
 */
function generatePatternBasedMCQ(sentence, targetDifficulty = 'medium') {
  if (sentence.length < 20) return null;
  
  const words = sentence.split(/\s+/);
  if (words.length < 5) return null;
  
  let blankIndex;
  let questionType;
  
  // Adjust question complexity based on target difficulty
  if (targetDifficulty === 'easy') {
    // Easy: blank at the end, simple recall
    blankIndex = Math.max(0, words.length - 2);
    questionType = 'Fill in the blank';
  } else if (targetDifficulty === 'hard') {
    // Hard: blank in the middle, requires understanding context
    blankIndex = Math.floor(words.length / 3);
    questionType = 'Complete the statement';
  } else {
    // Medium: blank in the middle
    blankIndex = Math.floor(words.length / 2);
    questionType = 'Fill in the blank';
  }
  
  const correctAnswer = words[blankIndex];
  
  const questionWords = [...words];
  questionWords[blankIndex] = '______';
  
  const options = [
    correctAnswer,
    words[Math.max(0, blankIndex - 1)],
    words[Math.min(words.length - 1, blankIndex + 1)],
    'None of the above'
  ].filter((option, index, arr) => arr.indexOf(option) === index);
  
  while (options.length < 4) {
    options.push(`Option ${options.length + 1}`);
  }
  
  return {
    questionText: `${questionType}: ${questionWords.join(' ')}`,
    options: options.sort(() => Math.random() - 0.5),
    correctAnswer: correctAnswer,
    explanation: `From the original text: "${sentence}"`,
    difficulty: targetDifficulty,
    category: 'comprehension'
  };
}

/**
 * Calculate difficulty level for content
 */
function calculateDifficulty(concept) {
  if (concept.length > 20) return 'hard';
  if (concept.length > 10) return 'medium';
  return 'easy';
}

/**
 * Categorize content type
 */
function categorizeContent(concept) {
  const conceptLower = concept.toLowerCase();
  
  if (conceptLower.includes('definition') || conceptLower.includes('meaning')) return 'definition';
  if (conceptLower.includes('process') || conceptLower.includes('method')) return 'process';
  if (conceptLower.includes('example') || conceptLower.includes('instance')) return 'example';
  
  return 'general';
}

// Fallback Functions (when AI API fails)

function generateFallbackSummary(text, options = {}) {
  const { type = 'both', maxLength = 150, detailedMaxLength = 300 } = options;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  const result = {};
  
  if (type === 'short' || type === 'both') {
    const shortSentences = sentences.slice(0, 2).map(s => s.trim());
    const shortText = shortSentences.join('. ') + '.';
    result.short = {
      text: shortText,
      wordCount: shortText.split(' ').length,
      compressionRatio: Math.round((shortText.length / text.length) * 100)
    };
  }
  
  if (type === 'detailed' || type === 'both') {
    const detailedSentences = sentences.slice(0, 4).map(s => s.trim());
    const detailedText = detailedSentences.join('. ') + '.';
    result.detailed = {
      text: detailedText,
      wordCount: detailedText.split(' ').length,
      compressionRatio: Math.round((detailedText.length / text.length) * 100)
    };
  }
  
  return {
    ...result,
    keyPoints: sentences.slice(0, 3).map(s => s.trim()),
    insights: {
      aiInsight: 'This text contains important information for study.',
      themes: extractThemes(text),
      patterns: identifyPatterns(text),
      readingLevel: assessReadingLevel(text)
    },
    originalLength: text.length,
    summaryType: type,
    model: 'fallback'
  };
}

function generateFallbackFlashcards(text, count = 5) {
  const words = text.split(/\s+/)
    .filter(word => word.length > 4 && /^[a-zA-Z]+$/.test(word))
    .filter(word => !['that', 'this', 'with', 'from', 'they', 'have', 'were', 'been', 'there'].includes(word.toLowerCase()));
  
  const concepts = [...new Set(words)].slice(0, count);
  const flashcards = [];
  
  for (let i = 0; i < count && i < concepts.length; i++) {
    flashcards.push({
      question: `What is ${concepts[i]}?`,
      answer: `${concepts[i]} is an important concept from the text.`,
      difficulty: 'medium',
      category: 'general'
    });
  }
  
  return flashcards;
}

function generateFallbackMCQs(text, count = 5, difficulty = 'mixed') {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 15);
  const questions = [];
  
  // Determine difficulty distribution
  const distrib = getDifficultyDistribution(count, difficulty);
  let easyCount = 0, mediumCount = 0, hardCount = 0;
  
  for (let i = 0; i < count && i < sentences.length; i++) {
    // Determine difficulty for this question
    let currentDifficulty = 'medium';
    if (easyCount < distrib.easy) {
      currentDifficulty = 'easy';
      easyCount++;
    } else if (hardCount < distrib.hard) {
      currentDifficulty = 'hard';
      hardCount++;
    } else {
      currentDifficulty = 'medium';
      mediumCount++;
    }
    
    // Create question based on difficulty
    let questionText, options;
    if (currentDifficulty === 'easy') {
      questionText = `What does this statement discuss: "${sentences[i].substring(0, 40)}..."?`;
      options = [
        'The main concept',
        'A supporting detail',
        'An unrelated topic',
        'Background information'
      ];
    } else if (currentDifficulty === 'hard') {
      questionText = `Analyze the following: "${sentences[i].substring(0, 50)}..." - What is the underlying principle?`;
      options = [
        'The fundamental concept being explained',
        'A secondary observation',
        'An illustrative example',
        'Contextual background'
      ];
    } else {
      questionText = `What is the main idea of this statement: "${sentences[i].substring(0, 50)}..."?`;
      options = [
        'The primary concept being discussed',
        'A supporting detail',
        'An example or illustration',
        'Background information'
      ];
    }
    
    questions.push({
      questionText: questionText,
      options: options,
      correctAnswer: options[0],
      explanation: `Based on: "${sentences[i]}"`,
      difficulty: currentDifficulty,
      category: 'comprehension'
    });
  }
  
  return questions;
}

// T5 Question Generation Functions

/**
 * Create text chunks optimized for question generation
 * @param {Array} sentences - Array of sentences
 * @param {number} numChunks - Number of chunks to create
 * @returns {Array} Array of text chunks
 */
function createTextChunks(sentences, numChunks = 8) {
  if (sentences.length === 0) return [];
  
  const chunks = [];
  const chunkSize = Math.max(1, Math.floor(sentences.length / numChunks));
  
  for (let i = 0; i < sentences.length; i += chunkSize) {
    const chunk = sentences.slice(i, i + chunkSize).join('. ').trim();
    if (chunk.length > 30) { // Only include meaningful chunks
      chunks.push(chunk);
    }
  }
  
  return chunks.slice(0, numChunks);
}

/**
 * Generate question using T5 QG model
 * @param {string} context - Text context for question generation
 * @param {string} targetDifficulty - Target difficulty level ('easy', 'medium', 'hard')
 * @returns {Object} Generated question and answer
 */
async function generateQuestionWithT5(context, targetDifficulty = 'medium') {
  try {
    if (!context || context.length < 30) {
      throw new Error('Context too short for question generation');
    }

    console.log(`🔍 Generating ${targetDifficulty} question from: "${context.substring(0, 100)}..."`);
    
    // Adjust prompt based on difficulty
    let promptPrefix;
    if (targetDifficulty === 'easy') {
      promptPrefix = 'generate simple question:';
    } else if (targetDifficulty === 'hard') {
      promptPrefix = 'generate analytical question:';
    } else {
      promptPrefix = 'generate question:';
    }
    
    // Prepare input for T5 QG model
    const input = `${promptPrefix} ${context.substring(0, 400)}`;
    
    const response = await hf.textGeneration({
      model: MODELS.QUESTION_GENERATION,
      inputs: input,
      parameters: {
        max_new_tokens: 100,
        temperature: targetDifficulty === 'easy' ? 0.5 : targetDifficulty === 'hard' ? 0.9 : 0.7,
        do_sample: true,
        top_p: 0.9,
        return_full_text: false
      }
    });

    if (response && response.generated_text) {
      const generatedText = response.generated_text.trim();
      
      // Parse the generated text to extract question
      let question = generatedText;
      let answer = null;
      
      // Clean up the question
      question = question.replace(/^(question:|q:)/i, '').trim();
      if (!question.endsWith('?')) {
        question += '?';
      }
      
      // Try to extract answer from context using Q&A model
      try {
        const qaResponse = await hf.questionAnswering({
          model: MODELS.QUESTION_ANSWERING,
          inputs: {
            question: question,
            context: context
          }
        });
        
        if (qaResponse && qaResponse.answer && qaResponse.score > 0.2) {
          answer = qaResponse.answer;
        }
      } catch (qaError) {
        console.log('⚠️ Failed to get answer from Q&A model, using context extraction');
      }
      
      // Fallback answer extraction
      if (!answer) {
        answer = extractAnswerFromContext(question, context);
      }
      
      return {
        question: question,
        answer: answer,
        confidence: response.score || 0.8,
        difficulty: targetDifficulty
      };
    }
    
    return null;

  } catch (error) {
    console.error('❌ T5 QG model error:', error.message);
    return null;
  }
}

/**
 * Create MCQ from generated question and answer
 * @param {string} question - Generated question
 * @param {string} correctAnswer - Correct answer
 * @param {string} context - Original context
 * @param {string} targetDifficulty - Target difficulty level
 * @returns {Object} MCQ object
 */
async function createMCQFromQuestion(question, correctAnswer, context, targetDifficulty = 'medium') {
  if (!question || !correctAnswer) return null;
  
  try {
    // Generate distractors
    const distractors = await generateSmartDistractors(correctAnswer, context, question);
    
    // Combine correct answer with distractors
    const allOptions = [correctAnswer, ...distractors].slice(0, 4);
    
    // Shuffle options
    const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);
    
    return {
      questionText: question,
      options: shuffledOptions,
      correctAnswer: correctAnswer,
      explanation: `Based on the context: "${context.substring(0, 120)}..."`,
      difficulty: targetDifficulty || analyzeDifficulty(question, context),
      category: categorizeContent(question),
      generatedBy: 'T5-QG'
    };
    
  } catch (error) {
    console.error('❌ MCQ creation error:', error.message);
    return null;
  }
}

/**
 * Generate smart distractors for MCQ options
 * @param {string} correctAnswer - The correct answer
 * @param {string} context - Text context
 * @param {string} question - The question
 * @returns {Array} Array of distractor options
 */
async function generateSmartDistractors(correctAnswer, context, question) {
  const distractors = [];
  
  try {
    // Extract words and phrases from context for realistic distractors
    const words = context.split(/\s+/).filter(word => 
      word.length > 3 && 
      word.length < 20 && 
      !word.toLowerCase().includes(correctAnswer.toLowerCase().substring(0, 5))
    );
    
    const sentences = context.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    // Type 1: Related words from context
    if (words.length > 0) {
      const randomWords = words.sort(() => Math.random() - 0.5).slice(0, 2);
      randomWords.forEach(word => {
        if (distractors.length < 3) {
          distractors.push(word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
        }
      });
    }
    
    // Type 2: Modified correct answer
    if (distractors.length < 3 && correctAnswer.length > 5) {
      const modified = correctAnswer.split(' ');
      if (modified.length > 1) {
        distractors.push(modified.slice(1).join(' '));
      }
    }
    
    // Type 3: Context-based alternatives
    if (distractors.length < 3 && sentences.length > 0) {
      const contextWords = sentences[0].split(' ').filter(w => w.length > 4).slice(0, 2);
      contextWords.forEach(word => {
        if (distractors.length < 3) {
          distractors.push(word.replace(/[^\w\s]/g, ''));
        }
      });
    }
    
    // Fill remaining slots with generic distractors
    const genericDistractors = [
      'None of the above',
      'All of the above',
      'Not mentioned in the text',
      'Cannot be determined'
    ];
    
    while (distractors.length < 3) {
      const generic = genericDistractors[distractors.length % genericDistractors.length];
      if (!distractors.includes(generic)) {
        distractors.push(generic);
      }
    }
    
  } catch (error) {
    console.error('❌ Distractor generation error:', error);
  }
  
  return distractors.slice(0, 3);
}

/**
 * Extract answer from context for fallback
 * @param {string} question - The question
 * @param {string} context - Text context
 * @returns {string} Extracted answer
 */
function extractAnswerFromContext(question, context) {
  const sentences = context.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const questionWords = question.toLowerCase().split(/\s+/).filter(w => 
    w.length > 3 && !['what', 'how', 'when', 'where', 'why', 'which'].includes(w)
  );
  
  // Find sentence with most question word matches
  let bestSentence = sentences[0] || context.substring(0, 100);
  let maxMatches = 0;
  
  sentences.forEach(sentence => {
    const sentenceLower = sentence.toLowerCase();
    const matches = questionWords.filter(word => sentenceLower.includes(word)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestSentence = sentence.trim();
    }
  });
  
  // Extract a meaningful portion as answer
  const words = bestSentence.split(/\s+/);
  if (words.length > 10) {
    return words.slice(0, 8).join(' ') + '...';
  }
  
  return bestSentence.substring(0, 80).trim();
}

/**
 * Extract themes from text for insights
 */
function extractThemes(text) {
  const themes = [];
  const lowerText = text.toLowerCase();
  
  // Common academic themes
  const themePatterns = {
    'Technology': ['technology', 'digital', 'computer', 'software', 'internet', 'artificial intelligence'],
    'Science': ['research', 'study', 'experiment', 'hypothesis', 'theory', 'analysis'],
    'Business': ['market', 'company', 'business', 'industry', 'economic', 'financial'],
    'Education': ['learning', 'education', 'student', 'teaching', 'academic', 'knowledge'],
    'Health': ['health', 'medical', 'disease', 'treatment', 'patient', 'clinical'],
    'Environment': ['environment', 'climate', 'nature', 'pollution', 'sustainability', 'ecology']
  };
  
  Object.entries(themePatterns).forEach(([theme, keywords]) => {
    const matches = keywords.filter(keyword => lowerText.includes(keyword)).length;
    if (matches >= 2) {
      themes.push({
        name: theme,
        relevance: Math.min(matches * 20, 100),
        keywords: keywords.filter(keyword => lowerText.includes(keyword))
      });
    }
  });
  
  return themes.sort((a, b) => b.relevance - a.relevance).slice(0, 3);
}

/**
 * Identify patterns in text structure
 */
function identifyPatterns(text) {
  const patterns = [];
  
  // Check for lists
  if (text.includes('1.') || text.includes('•') || text.includes('-')) {
    patterns.push('Listed information');
  }
  
  // Check for questions
  if (text.includes('?')) {
    patterns.push('Q&A format');
  }
  
  // Check for examples
  if (text.toLowerCase().includes('example') || text.toLowerCase().includes('for instance')) {
    patterns.push('Example-driven');
  }
  
  // Check for definitions
  if (text.toLowerCase().includes('definition') || text.includes(':')) {
    patterns.push('Definitions present');
  }
  
  // Check for sequential content
  if (text.toLowerCase().includes('first') || text.toLowerCase().includes('then') || 
      text.toLowerCase().includes('finally')) {
    patterns.push('Sequential structure');
  }
  
  return patterns.length > 0 ? patterns : ['Informational content'];
}

/**
 * Assess reading level of text
 */
function assessReadingLevel(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);
  
  // Flesch-Kincaid Grade Level approximation
  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  
  const gradeLevel = 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59;
  
  if (gradeLevel < 6) return 'Elementary';
  if (gradeLevel < 9) return 'Middle School';
  if (gradeLevel < 13) return 'High School';
  if (gradeLevel < 16) return 'College';
  return 'Graduate';
}

/**
 * Count syllables in a word (approximate)
 */
function countSyllables(word) {
  const vowels = 'aeiouy';
  let count = 0;
  let prevCharWasVowel = false;
  
  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i].toLowerCase());
    if (isVowel && !prevCharWasVowel) count++;
    prevCharWasVowel = isVowel;
  }
  
  // Adjust for silent 'e'
  if (word.endsWith('e')) count--;
  
  return Math.max(1, count);
}

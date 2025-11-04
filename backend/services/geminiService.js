import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

let genAI = null;
let geminiModel = null;

if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    console.log('✅ Gemini AI (gemini-2.5-flash) initialized successfully');
  } catch (error) {
    console.error('❌ Gemini AI initialization failed:', error.message);
  }
}

export function isGeminiAvailable() {
  return genAI !== null && geminiModel !== null;
}

export async function generateMCQsWithGemini(text, count = 5, difficulty = 'mixed') {
  if (!isGeminiAvailable()) {
    throw new Error('Gemini AI is not available');
  }

  const difficultyInstruction = difficulty === 'mixed' 
    ? 'Create a balanced mix of easy, medium, and hard questions'
    : `Create ${difficulty} difficulty questions`;

  const prompt = `You are an expert educational content creator. Generate exactly ${count} high-quality multiple-choice questions from the following text.

TEXT:
${text}

REQUIREMENTS:
- Generate exactly ${count} questions
- ${difficultyInstruction}
- Each question must have exactly 4 options
- Only ONE option should be correct

OUTPUT FORMAT - Return ONLY valid JSON:
[
  {
    "questionText": "Your question?",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "correct option text",
    "difficulty": "easy",
    "explanation": "why correct"
  }
]`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text().trim();
    
    console.log('📝 Raw Gemini response:', responseText.substring(0, 200) + '...');
    
    responseText = responseText.replace(/\`\`\`json\s*/g, '').replace(/\`\`\`\s*/g, '').trim();
    
    const mcqs = JSON.parse(responseText);
    
    if (!Array.isArray(mcqs)) {
      throw new Error('Invalid response format - not an array');
    }
    
    console.log(`✅ Generated ${mcqs.length} MCQs with Gemini`);
    
    return mcqs.slice(0, count).map(mcq => ({
      questionText: mcq.questionText,
      options: mcq.options.slice(0, 4),
      correctAnswer: mcq.correctAnswer,
      difficulty: mcq.difficulty || 'medium',
      explanation: mcq.explanation || ''
    }));
  } catch (error) {
    console.error('❌ Error with Gemini MCQs:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

export async function generateFlashcardsWithGemini(text, count = 5) {
  if (!isGeminiAvailable()) {
    throw new Error('Gemini AI is not available');
  }

  const prompt = `Generate exactly ${count} flashcards from this text.

TEXT:
${text}

Return ONLY valid JSON:
[
  {
    "question": "question?",
    "answer": "answer"
  }
]`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text().trim();
    
    responseText = responseText.replace(/\`\`\`json\s*/g, '').replace(/\`\`\`\s*/g, '').trim();
    
    const flashcards = JSON.parse(responseText);
    
    if (!Array.isArray(flashcards)) {
      throw new Error('Invalid response format');
    }
    
    return flashcards.slice(0, count);
  } catch (error) {
    console.error('❌ Error with Gemini flashcards:', error.message);
    throw error;
  }
}

export async function generateSummaryWithGemini(text, options = {}) {
  if (!isGeminiAvailable()) {
    throw new Error('Gemini AI is not available');
  }

  const { type = 'both', maxLength = 150, detailedMaxLength = 300 } = options;

  const outputFormat = type === 'both' 
    ? '{"short": "brief summary", "detailed": "detailed summary"}'
    : type === 'short'
    ? '{"short": "brief summary"}'
    : '{"detailed": "detailed summary"}';

  const prompt = `Summarize this text. Return ONLY valid JSON in this format: ${outputFormat}

TEXT:
${text}`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text().trim();
    
    responseText = responseText.replace(/\`\`\`json\s*/g, '').replace(/\`\`\`\s*/g, '').trim();
    
    const summary = JSON.parse(responseText);
    
    return {
      ...summary,
      model: 'Google Gemini (gemini-2.5-flash)',
      type: type
    };
  } catch (error) {
    console.error('❌ Error with Gemini summary:', error.message);
    throw error;
  }
}

export default {
  isGeminiAvailable,
  generateMCQsWithGemini,
  generateFlashcardsWithGemini,
  generateSummaryWithGemini
};

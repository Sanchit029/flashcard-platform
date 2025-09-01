// Dummy AI service for summarization and MCQ generation
// Replace with real AI/LLM integration as needed

export async function generateSummariesFromText(text) {
  // Simulate AI summary
  return {
    shortSummary: text.slice(0, 100) + (text.length > 100 ? '...' : ''),
    keyPoints: [
      'Key point 1: ' + text.slice(0, 30),
      'Key point 2: ' + text.slice(30, 60),
      'Key point 3: ' + text.slice(60, 90)
    ]
  };
}

export async function generateMCQsFromText(text) {
  // Dummy logic: split text into sentences, generate MCQs
  const sentences = text.split('.').map(s => s.trim()).filter(Boolean);
  const mcqs = [];
  for (let i = 0; i < Math.min(sentences.length, 10); i++) {
    mcqs.push({
      questionText: `What is the main idea of: "${sentences[i]}"?`,
      options: [
        `Option A for sentence ${i+1}`,
        `Option B for sentence ${i+1}`,
        `Option C for sentence ${i+1}`,
        `Option D for sentence ${i+1}`
      ],
      correctAnswer: `Option A for sentence ${i+1}`
    });
  }
  return mcqs;
}

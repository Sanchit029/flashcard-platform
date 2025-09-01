// In a real application, you would integrate with an AI service here.
// For now, we'll return dummy MCQs for testing purposes.
export const generateMCQsFromText = async (text) => {
  console.log('Generating MCQs for text:', text.substring(0, 50) + '...');
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return [
    {
      questionText: 'What is the capital of France?',
      options: ['Berlin', 'Madrid', 'Paris', 'Rome'],
      correctAnswer: 'Paris',
    },
    {
      questionText: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: '4',
    },
    {
      questionText: 'Which planet is known as the Red Planet?',
      options: ['Earth', 'Mars', 'Jupiter', 'Venus'],
      correctAnswer: 'Mars',
    },
    {
      questionText: 'What is the largest ocean on Earth?',
      options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
      correctAnswer: 'Pacific',
    },
    {
      questionText: 'Who wrote "To Kill a Mockingbird"?',
      options: ['Harper Lee', 'Mark Twain', 'J.K. Rowling', 'F. Scott Fitzgerald'],
      correctAnswer: 'Harper Lee',
    },
  ];
};

export const generateSummariesFromText = async (text) => {
  console.log('Generating summaries for text:', text.substring(0, 50) + '...');
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    shortSummary: 'This is a short summary of the provided text. It captures the main idea concisely.',
    keyPoints: [
      'This is the first key point.',
      'This is the second key point, highlighting another important aspect.',
      'And here is a third key point, summarizing a crucial detail.',
    ],
  };
};


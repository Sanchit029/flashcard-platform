import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { flashcardAPI } from '../utils/api';

const Quiz = () => {
  const { setId } = useParams();
  const navigate = useNavigate();
  
  const [quizData, setQuizData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [questionTimes, setQuestionTimes] = useState({});
  const [savingAttempt, setSavingAttempt] = useState(false);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [quizSaved, setQuizSaved] = useState(false);

  // Quiz settings
  const QUIZ_TIME_LIMIT = 30 * 60; // 30 minutes in seconds
  const QUESTIONS_PER_QUIZ = 10;

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        const response = await flashcardAPI.getById(setId);
        const flashcardSet = response.data;
        
        if (flashcardSet.type !== 'mcq' || !flashcardSet.questions?.length) {
          setError('This flashcard set does not contain quiz questions.');
          return;
        }

        // Shuffle questions and limit to QUESTIONS_PER_QUIZ
        const shuffledQuestions = [...flashcardSet.questions]
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(QUESTIONS_PER_QUIZ, flashcardSet.questions.length));

        setQuizData({
          ...flashcardSet,
          questions: shuffledQuestions
        });
      } catch (err) {
        setError('Failed to load quiz data. Please try again.');
        console.error('Error fetching quiz:', err);
      } finally {
        setLoading(false);
      }
    };

    if (setId) {
      fetchQuizData();
    }
  }, [setId, QUESTIONS_PER_QUIZ]);

  useEffect(() => {
    let timer;
    if (quizStarted && timeRemaining > 0 && !showResults) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setShowResults(true);
            setQuizStarted(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quizStarted, timeRemaining, showResults]);

  const startQuiz = () => {
    setQuizStarted(true);
    setTimeRemaining(QUIZ_TIME_LIMIT);
    setQuizStartTime(Date.now());
    setQuestionStartTime(Date.now());
  };

  const handleAnswerSelect = (questionIndex, answer) => {
    // Track time spent on this question
    if (questionStartTime) {
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
      setQuestionTimes(prev => ({
        ...prev,
        [questionIndex]: timeSpent
      }));
    }
    
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
    setQuestionStartTime(Date.now()); // Reset for next question
  };

  const nextQuestion = () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    setShowResults(true);
    setQuizStarted(false);
    
    // Calculate total time spent
    const totalTimeSpent = Math.floor((Date.now() - quizStartTime) / 1000);
    // Save quiz attempt to database
    await saveQuizAttempt(totalTimeSpent);
  };
  
  const saveQuizAttempt = async (totalTimeSpent) => {
    if (!quizData) return;
    
    setSavingAttempt(true);
    try {
      const { score, total, percentage } = calculateScore();
      
      // Build detailed answers array
      const answers = quizData.questions.map((question, index) => ({
        questionIndex: index,
        questionText: question.questionText,
        selectedAnswer: selectedAnswers[index] || 'Not answered',
        correctAnswer: question.correctAnswer,
        isCorrect: selectedAnswers[index] === question.correctAnswer,
        timeSpent: questionTimes[index] || 0,
        difficulty: question.difficulty || 'medium'
      }));
      
      const attemptData = {
        totalQuestions: total,
        correctAnswers: score,
        scorePercentage: percentage,
        totalTimeSpent: totalTimeSpent,
        averageTimePerQuestion: Math.floor(totalTimeSpent / total),
        timerUsed: true,
        timePerQuestion: QUIZ_TIME_LIMIT / total,
        answers: answers,
        settings: {
          shuffleQuestions: true,
          shuffleOptions: false,
          showExplanations: true
        }
      };
      
      await flashcardAPI.saveQuizAttempt(setId, attemptData);
      console.log('Quiz attempt saved successfully');
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
    } finally {
      setSavingAttempt(false);
    }
  };

  const saveQuizToDashboard = async () => {
    if (!quizData || quizSaved) return;
    
    setSavingQuiz(true);
    try {
      const quizSetData = {
        title: `${quizData.title} - Quiz`,
        type: 'mcq',
        questions: quizData.questions,
        summary: {
          short: `Saved quiz from ${quizData.title}`,
          detailed: `This quiz contains ${quizData.questions.length} multiple choice questions covering the topics from ${quizData.title}.`
        },
        sourceText: quizData.sourceText || `Quiz questions from ${quizData.title}`
      };

      await flashcardAPI.create(quizSetData);
      setQuizSaved(true);
      console.log('Quiz saved to dashboard successfully');
    } catch (error) {
      console.error('Error saving quiz to dashboard:', error);
      alert('Failed to save quiz to dashboard. Please try again.');
    } finally {
      setSavingQuiz(false);
    }
  };

  const calculateScore = () => {
    if (!quizData) return { score: 0, total: 0, percentage: 0 };
    
    let correct = 0;
    quizData.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    
    const total = quizData.questions.length;
    const percentage = Math.round((correct / total) * 100);
    
    return { score: correct, total, percentage };
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-4">
            {error}
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">No quiz data available.</p>
      </div>
    );
  }

  // Quiz intro screen
  if (!quizStarted && !showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{quizData.title}</h1>
              <p className="text-gray-600">Quiz Mode</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{quizData.questions.length}</div>
                <div className="text-sm text-gray-600">Questions</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{formatTime(QUIZ_TIME_LIMIT)}</div>
                <div className="text-sm text-gray-600">Time Limit</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">Multiple Choice</div>
                <div className="text-sm text-gray-600">Question Type</div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
              <h3 className="font-semibold text-gray-800 mb-2">Instructions:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Select the best answer for each question</li>
                <li>• You can navigate between questions freely</li>
                <li>• Submit your quiz before time runs out</li>
                <li>• Your score will be shown at the end</li>
              </ul>
            </div>

            <button
              onClick={startQuiz}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow-lg hover:shadow-xl"
            >
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Results screen
  if (showResults) {
    const { score, total, percentage } = calculateScore();
    const totalTimeSpent = quizStartTime ? Math.floor((Date.now() - quizStartTime) / 1000) : 0;
    const timeSpentFormatted = formatTime(totalTimeSpent);
    const avgTimePerQuestion = Math.floor(totalTimeSpent / total);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
            <p className="text-gray-600 mb-8">{quizData.title}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{score}/{total}</div>
                <div className="text-sm text-gray-600">Correct Answers</div>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <div className={`text-3xl font-bold ${getScoreColor(percentage)}`}>{percentage}%</div>
                <div className="text-sm text-gray-600">Final Score</div>
              </div>
              <div className="bg-orange-50 p-6 rounded-lg">
                <div className="text-3xl font-bold text-orange-600">{timeSpentFormatted}</div>
                <div className="text-sm text-gray-600">Time Taken</div>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">
                  {percentage >= 80 ? '🏆' : percentage >= 60 ? '👍' : '📚'}
                </div>
                <div className="text-sm text-gray-600">
                  {percentage >= 80 ? 'Excellent!' : percentage >= 60 ? 'Good Job!' : 'Keep Learning!'}
                </div>
              </div>
            </div>
            
            {savingAttempt && (
              <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
                💾 Saving quiz results...
              </div>
            )}

            {savingQuiz && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                💾 Saving quiz to dashboard...
              </div>
            )}

            {quizSaved && (
              <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg text-sm">
                ✅ Quiz saved to dashboard successfully!
              </div>
            )}
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6 text-sm text-gray-600">
              <div className="flex justify-around">
                <div>
                  <span className="font-semibold">Avg Time/Question:</span> {avgTimePerQuestion}s
                </div>
                <div>
                  <span className="font-semibold">Answered:</span> {Object.keys(selectedAnswers).length}/{total}
                </div>
                <div>
                  <span className="font-semibold">Accuracy:</span> {total > 0 ? Math.round((score/Object.keys(selectedAnswers).length) * 100) : 0}%
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={saveQuizToDashboard}
                disabled={savingQuiz || quizSaved}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  quizSaved 
                    ? 'bg-green-100 text-green-800 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                } ${savingQuiz ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {savingQuiz ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : quizSaved ? (
                  <>
                    <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Saved to Dashboard
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                    </svg>
                    Save Quiz to Dashboard
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowResults(false);
                  setQuizStarted(false);
                  setCurrentQuestion(0);
                  setSelectedAnswers({});
                  setQuestionTimes({});
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Retake Quiz
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Answers</h2>
            <div className="space-y-6">
              {quizData.questions.map((question, index) => {
                const userAnswer = selectedAnswers[index];
                const isCorrect = userAnswer === question.correctAnswer;
                const timeSpent = questionTimes[index] || 0;
                
                return (
                  <div key={index} className={`p-6 rounded-lg border-2 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-800">Question {index + 1}</h3>
                        {timeSpent > 0 && (
                          <p className="text-xs text-gray-500 mt-1">⏱️ Time spent: {timeSpent}s</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                        {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4">{question.questionText}</p>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className={`p-3 rounded-lg border ${
                            option === question.correctAnswer
                              ? 'border-green-500 bg-green-100 text-green-800'
                              : option === userAnswer && option !== question.correctAnswer
                              ? 'border-red-500 bg-red-100 text-red-800'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="font-medium mr-2">{String.fromCharCode(65 + optionIndex)}.</span>
                            {option}
                            {option === question.correctAnswer && (
                              <span className="ml-auto text-green-600">✓ Correct Answer</span>
                            )}
                            {option === userAnswer && option !== question.correctAnswer && (
                              <span className="ml-auto text-red-600">✗ Your Answer</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {!userAnswer && (
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                        ⚠️ You did not answer this question
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz interface
  const question = quizData.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quizData.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{quizData.title}</h1>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Time Remaining</div>
                <div className={`text-lg font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-gray-800'}`}>
                  {formatTime(timeRemaining)}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Question {currentQuestion + 1} of {quizData.questions.length}
            </span>
            <span className="text-sm text-gray-600">
              {Object.keys(selectedAnswers).length} answered
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            {question.questionText}
          </h2>
          
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(currentQuestion, option)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedAnswers[currentQuestion] === option
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <span className="font-medium mr-4 text-gray-600">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <span>{option}</span>
                  {selectedAnswers[currentQuestion] === option && (
                    <span className="ml-auto text-blue-600">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              Previous
            </button>

            <div className="flex gap-2">
              {quizData.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                    index === currentQuestion
                      ? 'bg-blue-600 text-white'
                      : selectedAnswers[index]
                      ? 'bg-green-200 text-green-800'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {currentQuestion === quizData.questions.length - 1 ? (
              <button
                onClick={handleSubmitQuiz}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Submit Quiz
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;

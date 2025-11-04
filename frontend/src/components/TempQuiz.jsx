import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TempQuiz = ({ quizData, onComplete, onCancel }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showExplanations, setShowExplanations] = useState(false);
  const navigate = useNavigate();

  const { title, questions } = quizData;
  const totalQuestions = questions.length;

  const startQuiz = (timePerQuestion = 60) => {
    setQuizStarted(true);
    setTimeLeft(timePerQuestion * totalQuestions);
  };

  const handleAnswerSelect = (questionIndex, answer) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: answer
    });
  };

  const handleSubmitQuiz = React.useCallback(() => {
    let correctCount = 0;
    
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correctCount++;
      }
    });

    const percentage = Math.round((correctCount / totalQuestions) * 100);
    setScore({
      correct: correctCount,
      total: totalQuestions,
      percentage: percentage
    });
    setIsCompleted(true);
    
    if (onComplete) {
      onComplete({
        score: { correct: correctCount, total: totalQuestions, percentage },
        answers: selectedAnswers,
        questions: questions
      });
    }
  }, [questions, selectedAnswers, totalQuestions, onComplete]);

  // Timer functionality
  useEffect(() => {
    if (quizStarted && timeLeft > 0 && !isCompleted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isCompleted) {
      handleSubmitQuiz();
    }
  }, [timeLeft, quizStarted, isCompleted, handleSubmitQuiz]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">{title}</h2>
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-2">Ready to start your quiz?</p>
            <p className="text-sm text-gray-500">
              {totalQuestions} questions • No time limit
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => startQuiz()}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 font-medium"
            >
              Start Quiz (No Timer)
            </button>
            <button
              onClick={() => startQuiz(60)}
              className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 font-medium"
            >
              Start Quiz (60s per question)
            </button>
            <button
              onClick={() => startQuiz(30)}
              className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 font-medium"
            >
              Start Quiz (30s per question)
            </button>
          </div>
          
          <button
            onClick={onCancel || (() => navigate(-1))}
            className="w-full mt-4 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Quiz Complete!</h2>
              <div className="text-6xl font-bold mb-4">
                <span className={score.percentage >= 80 ? 'text-green-600' : score.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}>
                  {score.percentage}%
                </span>
              </div>
              <p className="text-xl text-gray-600">
                You got {score.correct} out of {score.total} questions correct
              </p>
            </div>

            <div className="flex justify-center space-x-4 mb-8">
              <button
                onClick={() => setShowExplanations(!showExplanations)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                {showExplanations ? 'Hide' : 'Show'} Explanations
              </button>
              <button
                onClick={onCancel || (() => navigate(-1))}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
              >
                Back
              </button>
            </div>

            {showExplanations && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Review Your Answers</h3>
                {questions.map((question, index) => {
                  const userAnswer = selectedAnswers[index];
                  const isCorrect = userAnswer === question.correctAnswer;
                  
                  return (
                    <div key={index} className="border rounded-lg p-4">
                      <p className="font-medium text-gray-800 mb-3">
                        {index + 1}. {question.questionText}
                      </p>
                      
                      <div className="space-y-2 mb-3">
                        {question.options.map((option, optionIndex) => {
                          const isUserChoice = option === userAnswer;
                          const isCorrectOption = option === question.correctAnswer;
                          
                          let className = "p-2 rounded border ";
                          if (isCorrectOption) {
                            className += "bg-green-100 border-green-500 text-green-800";
                          } else if (isUserChoice && !isCorrect) {
                            className += "bg-red-100 border-red-500 text-red-800";
                          } else {
                            className += "bg-gray-50 border-gray-300";
                          }
                          
                          return (
                            <div key={optionIndex} className={className}>
                              {option}
                              {isCorrectOption && <span className="ml-2 text-green-600">✓</span>}
                              {isUserChoice && !isCorrect && <span className="ml-2 text-red-600">✗</span>}
                            </div>
                          );
                        })}
                      </div>
                      
                      {question.explanation && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mt-3">
                          <p className="text-sm text-blue-800">
                            <strong>Explanation:</strong> {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">{title}</h1>
            {timeLeft !== null && (
              <div className="text-lg font-mono">
                <span className={timeLeft <= 30 ? 'text-red-600' : 'text-gray-600'}>
                  ⏱️ {formatTime(timeLeft)}
                </span>
              </div>
            )}
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Question {currentQuestion + 1} of {totalQuestions}</span>
              <span>{Math.round(((currentQuestion + 1) / totalQuestions) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-medium text-gray-800 mb-6">
            {currentQ.questionText}
          </h2>

          <div className="space-y-3 mb-8">
            {currentQ.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(currentQuestion, option)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedAnswers[currentQuestion] === option
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium mr-3">
                  {String.fromCharCode(65 + index)}.
                </span>
                {option}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {currentQuestion === totalQuestions - 1 ? (
              <button
                onClick={handleSubmitQuiz}
                className="bg-green-600 text-white px-8 py-2 rounded-lg hover:bg-green-700 font-medium"
              >
                Submit Quiz
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestion(Math.min(totalQuestions - 1, currentQuestion + 1))}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TempQuiz;
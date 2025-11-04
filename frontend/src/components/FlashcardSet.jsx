import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Flashcard from './Flashcard';
import { flashcardAPI } from '../utils/api';

const FlashcardSet = ({ flashcards: initialFlashcards, title, onSave, setId }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [setTitle, setSetTitle] = useState(title || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [flashcards, setFlashcards] = useState(initialFlashcards || []);
  const [progress, setProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [showQuizHistory, setShowQuizHistory] = useState(false);
  const [quizHistory, setQuizHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const currentSetId = setId || id;

  // Load progress data when component mounts (for saved sets)
  useEffect(() => {
    const loadProgress = async () => {
      if (!currentSetId) return;
      try {
        setLoadingProgress(true);
        const response = await flashcardAPI.getProgress(currentSetId);
        setProgress(response.data);
      } catch (error) {
        console.error('Error loading progress:', error);
      } finally {
        setLoadingProgress(false);
      }
    };

    if (currentSetId) {
      loadProgress();
    }
  }, [currentSetId]);

  const loadQuizHistory = async () => {
    if (!currentSetId) return;
    
    try {
      setLoadingHistory(true);
      const response = await fetch(`/api/flashcard-sets/${currentSetId}/quiz-history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setQuizHistory(data);
      }
    } catch (error) {
      console.error('Error loading quiz history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleEditFlashcard = async (cardId, newQuestion, newAnswer) => {
    if (!currentSetId) return;
    
    try {
      const response = await flashcardAPI.editFlashcard(currentSetId, cardId, {
        question: newQuestion,
        answer: newAnswer
      });

      // Update local state with the updated flashcard set
      setFlashcards(response.data.flashcardSet.flashcards || response.data.flashcardSet.questions);
      
      // Show success message
      alert('Flashcard updated successfully!');
    } catch (error) {
      console.error('Error updating flashcard:', error);
      const message = error.response?.data?.message || 'Failed to update flashcard';
      throw new Error(message);
    }
  };

  const handleRegenerateFlashcard = async (cardId) => {
    if (!currentSetId) return;
    
    try {
      const response = await flashcardAPI.regenerateFlashcard(currentSetId, cardId);

      // Update local state with the regenerated flashcard set
      setFlashcards(response.data.flashcardSet.flashcards || response.data.flashcardSet.questions);
      
      // Show success message
      alert('Flashcard regenerated successfully!');
    } catch (error) {
      console.error('Error regenerating flashcard:', error);
      const message = error.response?.data?.message || 'Failed to regenerate flashcard';
      throw new Error(message);
    }
  };

  const handleStudyComplete = async (cardId, correct, difficulty) => {
    if (!currentSetId) {
      console.warn('⚠️ Cannot save progress: No flashcard set ID');
      return;
    }

    if (!cardId) {
      console.error('❌ Cannot save progress: No card ID provided');
      return;
    }

    console.log('📊 Updating progress:', { setId: currentSetId, cardId, correct, difficulty });

    try {
      const response = await flashcardAPI.updateProgress(currentSetId, {
        cardId,
        correct,
        difficulty
      });

      console.log('✅ Progress saved successfully:', response.data);

      // Update local progress state
      setProgress(prev => prev ? {
        ...prev,
        ...response.data.progress
      } : response.data.progress);

      // Update the specific card's data
      setFlashcards(prev => prev.map(card => 
        card._id === cardId ? {
          ...card,
          masteryLevel: response.data.card.masteryLevel,
          timesStudied: response.data.card.timesStudied,
          timesCorrect: response.data.card.timesCorrect
        } : card
      ));

    } catch (error) {
      console.error('❌ Error updating progress:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Show user-friendly error message
      alert(`Failed to save progress: ${error.response?.data?.message || error.message}`);
    }
  };

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const prevCard = () => {
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const goToCard = (index) => {
    setCurrentIndex(index);
  };

  const handleSave = async () => {
    if (!setTitle.trim()) {
      alert('Please enter a title for your flashcard set');
      return;
    }

    setSaving(true);
    try {
      const response = await flashcardAPI.createSimple({
        title: setTitle,
        flashcards: flashcards
      });
      
      setSaved(true);
      if (onSave) onSave(response.data);
      
      // Navigate to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error saving flashcard set:', error);
      alert('Failed to save flashcard set. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No flashcards to display</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {currentSetId ? 'Study Flashcards' : 'Generated Flashcards'}
            </h2>
            <div className="flex items-center gap-4 text-gray-600">
              <span>{flashcards.length} cards total</span>
              {progress && (
                <>
                  <span>•</span>
                  <span className="font-medium text-green-600">
                    {progress.masteryBreakdown.mastered}/{flashcards.length} mastered
                  </span>
                  <span>•</span>
                  <span>{progress.masteryBreakdown.masteryPercentage}% complete</span>
                </>
              )}
              {currentSetId && (
                <>
                  <span>•</span>
                  <button
                    onClick={() => {
                      setShowQuizHistory(true);
                      loadQuizHistory();
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium underline"
                  >
                    📊 Quiz History
                  </button>
                </>
              )}
            </div>
          </div>
          
          {!saved && onSave && (
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={setTitle}
                onChange={(e) => setSetTitle(e.target.value)}
                placeholder="Enter flashcard set title..."
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSave}
                disabled={saving || !setTitle.trim()}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                    </svg>
                    Save to Dashboard
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {saved && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span className="text-green-800 font-medium">Flashcard set saved successfully!</span>
            </div>
            <p className="text-green-700 text-sm mt-1">Redirecting to dashboard...</p>
          </div>
        )}
      </div>

      {/* Progress Bar (for saved sets) */}
      {progress && (
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Study Progress</h3>
            <div className="text-sm text-gray-600">
              {progress.setInfo.totalStudySessions} study sessions
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Mastery Progress</span>
              <span>{progress.masteryBreakdown.masteryPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress.masteryBreakdown.masteryPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Mastery Breakdown */}
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="font-semibold text-gray-600 text-lg">{progress.masteryBreakdown.new}</div>
              <div className="text-gray-500">🆕 New</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <div className="font-semibold text-red-600 text-lg">{progress.masteryBreakdown.review}</div>
              <div className="text-red-600">❌ Review</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="font-semibold text-green-600 text-lg">{progress.masteryBreakdown.mastered}</div>
              <div className="text-green-600">✅ Known</div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Summary Bar */}
      {loadingProgress ? (
        <div className="mb-6 bg-gray-50 rounded-lg p-4 border text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading progress...</p>
        </div>
      ) : progress && (
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-lg text-gray-800">
                📊 {progress.masteryBreakdown.mastered}/{flashcards.length} Mastered
              </h3>
              <span className="text-2xl font-bold text-green-600">
                {progress.masteryBreakdown.masteryPercentage}%
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Card {currentIndex + 1} of {flashcards.length}
            </div>
          </div>
          
          {/* Large Progress Bar */}
          <div className="mb-2">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${progress.masteryBreakdown.masteryPercentage}%` }}
              >
                {progress.masteryBreakdown.masteryPercentage > 10 && (
                  <span className="text-white text-xs font-bold">
                    {progress.masteryBreakdown.masteryPercentage}%
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex justify-center gap-6 text-sm">
            <span className="text-green-600 font-medium">
              ✅ {progress.masteryBreakdown.mastered} Known
            </span>
            <span className="text-red-600 font-medium">
              ❌ {progress.masteryBreakdown.review} Review
            </span>
            <span className="text-gray-600 font-medium">
              🆕 {progress.masteryBreakdown.new} New
            </span>
          </div>
        </div>
      )}

      {/* Card Counter (fallback when no progress) */}
      {!progress && (
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-lg shadow-sm px-4 py-2 border">
            <span className="text-gray-600 text-sm">
              Card {currentIndex + 1} of {flashcards.length}
            </span>
          </div>
        </div>
      )}

      {/* Main Flashcard */}
      <div className="mb-8">
        <Flashcard
          question={flashcards[currentIndex].question}
          answer={flashcards[currentIndex].answer}
          index={currentIndex}
          cardId={flashcards[currentIndex]._id}
          masteryLevel={flashcards[currentIndex].masteryLevel}
          difficulty={flashcards[currentIndex].difficulty}
          onStudyComplete={currentSetId ? handleStudyComplete : null}
          onEdit={currentSetId && flashcards[currentIndex]._id ? handleEditFlashcard : null}
          onRegenerate={currentSetId && flashcards[currentIndex]._id ? handleRegenerateFlashcard : null}
        />
      </div>

      {/* Quick Action Buttons (for saved sets) */}
      {currentSetId && handleStudyComplete && flashcards[currentIndex]?._id && (
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => handleStudyComplete(flashcards[currentIndex]._id, false, 'medium')}
            className="flex items-center gap-2 px-6 py-3 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-medium transition-colors shadow-sm border border-red-200"
          >
            <span className="text-xl">❌</span>
            <span>Mark for Review</span>
          </button>
          <button
            onClick={() => handleStudyComplete(flashcards[currentIndex]._id, true, 'easy')}
            className="flex items-center gap-2 px-6 py-3 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg font-medium transition-colors shadow-sm border border-green-200"
          >
            <span className="text-xl">✅</span>
            <span>Mark as Known</span>
          </button>
        </div>
      )}

      {/* Navigation Controls */}
      <div className="flex justify-center items-center gap-4 mb-8">
        <button
          onClick={prevCard}
          disabled={flashcards.length <= 1}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Previous
        </button>

        <div className="flex gap-2">
          {flashcards.map((card, index) => {
            let dotColor = 'bg-gray-300';
            if (card.masteryLevel === 'mastered') dotColor = 'bg-green-500';
            else if (card.masteryLevel === 'review') dotColor = 'bg-red-500';
            
            return (
              <button
                key={index}
                onClick={() => goToCard(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex ? 'ring-2 ring-blue-400' : 'hover:scale-110'
                } ${dotColor}`}
                title={`Card ${index + 1} - ${card.masteryLevel || 'new'}`}
              />
            );
          })}
        </div>

        <button
          onClick={nextCard}
          disabled={flashcards.length <= 1}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      </div>

      {/* Quiz History Modal */}
      {showQuizHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">📊 Quiz History</h3>
              <button
                onClick={() => setShowQuizHistory(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loadingHistory ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading quiz history...</p>
                </div>
              ) : quizHistory.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No quiz attempts yet. Take a quiz to see your history!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quizHistory.map((attempt, index) => (
                    <div key={attempt._id || index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <div className={`text-2xl font-bold ${
                            attempt.scorePercentage >= 80 ? 'text-green-600' : 
                            attempt.scorePercentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {attempt.scorePercentage}%
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {attempt.correctAnswers}/{attempt.totalQuestions} correct
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(attempt.completedAt).toLocaleDateString()} at{' '}
                              {new Date(attempt.completedAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Total Time</p>
                          <p className="font-medium">
                            {Math.floor(attempt.totalTimeSpent / 60)}m {Math.round(attempt.totalTimeSpent % 60)}s
                          </p>
                        </div>
                      </div>
                      
                      {attempt.averageTimePerQuestion > 0 && (
                        <div className="bg-gray-50 rounded p-2 text-sm text-gray-600">
                          Average time per question: {Math.round(attempt.averageTimePerQuestion)}s
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardSet;

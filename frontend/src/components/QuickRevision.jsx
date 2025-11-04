/**
 * Quick Revision Component
 * 
 * Simplified flashcard review without complex database progress tracking
 * Uses localStorage for session-based learning stats
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { flashcardAPI } from '../utils/api';
import Flashcard from './Flashcard';

const QuickRevision = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [flashcardSet, setFlashcardSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffled, setShuffled] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    known: 0,
    review: 0,
    cardsReviewed: new Set()
  });
  const [sessionStartTime] = useState(Date.now());
  const [flashcards, setFlashcards] = useState([]);

  useEffect(() => {
    const fetchFlashcardSet = async () => {
      try {
        setLoading(true);
        const response = await flashcardAPI.getById(id);
        setFlashcardSet(response.data);
        setFlashcards(response.data.flashcards || []);
      } catch (err) {
        console.error('Error fetching flashcard set:', err);
        setError('Failed to load flashcard set');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchFlashcardSet();
    }
  }, [id]);

  const shuffleCards = () => {
    const shuffledCards = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffledCards);
    setShuffled(true);
    setCurrentIndex(0);
  };

  const handleKnown = (cardId) => {
    setSessionStats(prev => ({
      ...prev,
      known: prev.known + 1,
      cardsReviewed: new Set([...prev.cardsReviewed, cardId])
    }));
    nextCard();
  };

  const handleReview = (cardId) => {
    setSessionStats(prev => ({
      ...prev,
      review: prev.review + 1,
      cardsReviewed: new Set([...prev.cardsReviewed, cardId])
    }));
    nextCard();
  };

  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Session complete
      saveSessionToLocalStorage();
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const saveSessionToLocalStorage = () => {
    const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000 / 60); // minutes
    const sessionData = {
      setId: id,
      setTitle: flashcardSet?.title,
      date: new Date().toISOString(),
      duration: sessionDuration,
      totalCards: flashcards.length,
      known: sessionStats.known,
      review: sessionStats.review,
      accuracy: Math.round((sessionStats.known / (sessionStats.known + sessionStats.review)) * 100) || 0
    };

    // Get existing sessions
    const existingSessions = JSON.parse(localStorage.getItem('quickRevisionSessions') || '[]');
    existingSessions.unshift(sessionData);
    
    // Keep only last 50 sessions
    if (existingSessions.length > 50) {
      existingSessions.pop();
    }
    
    localStorage.setItem('quickRevisionSessions', JSON.stringify(existingSessions));
  };

  const getSessionDuration = () => {
    const minutes = Math.floor((Date.now() - sessionStartTime) / 1000 / 60);
    const seconds = Math.floor((Date.now() - sessionStartTime) / 1000 % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-gray-600 font-medium">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>No flashcards found in this set.</p>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const progressPercentage = Math.round((sessionStats.cardsReviewed.size / flashcards.length) * 100);
  const isComplete = sessionStats.cardsReviewed.size === flashcards.length;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Back to Dashboard
        </button>
      </div>

      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{flashcardSet?.title}</h1>
        <p className="text-gray-600">Quick Revision Session</p>
      </div>

      {/* Session Stats */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{sessionStats.cardsReviewed.size}/{flashcards.length}</div>
            <div className="text-sm opacity-90">Reviewed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{sessionStats.known}</div>
            <div className="text-sm opacity-90">Got It</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{sessionStats.review}</div>
            <div className="text-sm opacity-90">Need Review</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{getSessionDuration()}</div>
            <div className="text-sm opacity-90">Time</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-white h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={shuffleCards}
          disabled={shuffled}
          className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          {shuffled ? 'Shuffled' : 'Shuffle Cards'}
        </button>

        <div className="text-sm text-gray-600">
          Card {currentIndex + 1} of {flashcards.length}
        </div>
      </div>

      {/* Flashcard */}
      {!isComplete ? (
        <div className="mb-8">
          <Flashcard
            key={`${flashcards[currentIndex]._id}-${currentIndex}`}
            question={flashcards[currentIndex].question}
            answer={flashcards[currentIndex].answer}
            index={currentIndex}
            cardId={flashcards[currentIndex]._id}
            difficulty={flashcards[currentIndex].difficulty || 'medium'}
            onKnown={handleKnown}
            onReview={handleReview}
            showActions={true}
          />
        </div>
      ) : (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Session Complete!</h2>
          <p className="text-gray-600 mb-6">
            You reviewed all {flashcards.length} cards in {getSessionDuration()}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setCurrentIndex(0);
                setSessionStats({ known: 0, review: 0, cardsReviewed: new Set() });
              }}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Review Again
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      {!isComplete && (
        <div className="flex justify-center items-center gap-4">
          <button
            onClick={prevCard}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Previous
          </button>

          <button
            onClick={nextCard}
            disabled={currentIndex === flashcards.length - 1}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default QuickRevision;

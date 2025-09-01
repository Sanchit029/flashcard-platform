import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Flashcard from './Flashcard';
import { flashcardAPI } from '../utils/api';

const FlashcardSet = ({ flashcards, title, onSave }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [setTitle, setSetTitle] = useState(title || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

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
            <h2 className="text-2xl font-bold text-gray-800">Generated Flashcards</h2>
            <p className="text-gray-600">{flashcards.length} cards created</p>
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

      {/* Card Counter */}
      <div className="flex justify-center mb-6">
        <div className="bg-white rounded-lg shadow-sm px-4 py-2 border">
          <span className="text-gray-600 text-sm">
            Card {currentIndex + 1} of {flashcards.length}
          </span>
        </div>
      </div>

      {/* Main Flashcard */}
      <div className="mb-8">
        <Flashcard
          question={flashcards[currentIndex].question}
          answer={flashcards[currentIndex].answer}
          index={currentIndex}
        />
      </div>

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
          {flashcards.map((_, index) => (
            <button
              key={index}
              onClick={() => goToCard(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentIndex ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
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

      {/* Grid View Toggle */}
      <div className="border-t pt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">All Cards Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flashcards.map((card, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                index === currentIndex ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => goToCard(index)}
            >
              <div className="text-sm font-medium text-gray-600 mb-2">Card {index + 1}</div>
              <div className="text-sm text-gray-800 mb-2">
                <span className="font-medium">Q:</span> {card.question.substring(0, 80)}
                {card.question.length > 80 && '...'}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">A:</span> {card.answer.substring(0, 80)}
                {card.answer.length > 80 && '...'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FlashcardSet;

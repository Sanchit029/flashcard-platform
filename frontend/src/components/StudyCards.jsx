import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { flashcardAPI } from '../utils/api';
import FlashcardSet from './FlashcardSet';

const StudyCards = () => {
  const { setId } = useParams();
  const navigate = useNavigate();
  
  const [flashcardSet, setFlashcardSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFlashcardSet = async () => {
      try {
        const response = await flashcardAPI.getById(setId);
        const set = response.data;
        
        if (set.type !== 'simple' || !set.flashcards?.length) {
          setError('This set does not contain study flashcards.');
          return;
        }

        setFlashcardSet(set);
      } catch (err) {
        setError('Failed to load flashcard set. Please try again.');
        console.error('Error fetching flashcard set:', err);
      } finally {
        setLoading(false);
      }
    };

    if (setId) {
      fetchFlashcardSet();
    }
  }, [setId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading flashcards...</p>
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

  if (!flashcardSet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">No flashcard set found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Back to Dashboard
          </button>
        </div>

        <FlashcardSet
          flashcards={flashcardSet.flashcards}
          title={flashcardSet.title}
          onSave={null} // No save needed, already saved
        />
      </div>
    </div>
  );
};

export default StudyCards;

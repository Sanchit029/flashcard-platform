import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { flashcardAPI } from '../utils/api';
import FlashcardSet from './FlashcardSet';

const StudyFlashcards = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [flashcardSet, setFlashcardSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFlashcardSet = async () => {
      try {
        setLoading(true);
        const response = await flashcardAPI.getById(id);
        setFlashcardSet(response.data);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!flashcardSet || !flashcardSet.flashcards || flashcardSet.flashcards.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>No flashcards found in this set.</p>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

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

      {/* Study Session Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{flashcardSet.title}</h1>
        <p className="text-gray-600">
          Study your flashcards and track your progress
        </p>
      </div>

      {/* FlashcardSet Component with Progress Tracking */}
      <FlashcardSet
        flashcards={flashcardSet.flashcards}
        title={flashcardSet.title}
        setId={flashcardSet._id}
        onSave={null} 
      />
    </div>
  );
};

export default StudyFlashcards;

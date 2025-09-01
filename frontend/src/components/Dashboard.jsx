import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { flashcardAPI } from '../utils/api';

const Dashboard = ({ token }) => {
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creatingSample, setCreatingSample] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingSet, setDeletingSet] = useState(null);

  useEffect(() => {
    const fetchFlashcardSets = async () => {
      try {
        const response = await axios.get('http://localhost:5003/api/flashcard-sets', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFlashcardSets(response.data);
      } catch (err) {
        console.error('Error fetching flashcard sets:', err);
        setError('Failed to fetch flashcard sets');
      } finally {
        setLoading(false);
      }
    };

    fetchFlashcardSets();
  }, [token]);

  const fetchFlashcardSets = async () => {
    try {
      const response = await axios.get('http://localhost:5003/api/flashcard-sets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFlashcardSets(response.data);
    } catch (err) {
      console.error('Error fetching flashcard sets:', err);
      setError('Failed to fetch flashcard sets');
    }
  };

  const createSampleQuiz = async () => {
    setCreatingSample(true);
    try {
      await flashcardAPI.createSampleMCQ();
      await fetchFlashcardSets(); // Refresh the list
    } catch (err) {
      console.error('Error creating sample quiz:', err);
      setError('Failed to create sample quiz');
    } finally {
      setCreatingSample(false);
    }
  };

  const handleEditSet = (set) => {
    setEditingSet(set._id);
    setEditTitle(set.title);
  };

  const handleSaveEdit = async (setId) => {
    if (!editTitle.trim()) {
      setError('Title cannot be empty');
      return;
    }

    try {
      await flashcardAPI.update(setId, { title: editTitle });
      await fetchFlashcardSets(); // Refresh the list
      setEditingSet(null);
      setEditTitle('');
    } catch (err) {
      console.error('Error updating flashcard set:', err);
      setError('Failed to update flashcard set');
    }
  };

  const handleCancelEdit = () => {
    setEditingSet(null);
    setEditTitle('');
  };

  const handleDeleteSet = async (setId) => {
    if (!window.confirm('Are you sure you want to delete this flashcard set? This action cannot be undone.')) {
      return;
    }

    setDeletingSet(setId);
    try {
      await flashcardAPI.delete(setId);
      await fetchFlashcardSets(); // Refresh the list
    } catch (err) {
      console.error('Error deleting flashcard set:', err);
      setError('Failed to delete flashcard set');
    } finally {
      setDeletingSet(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Create New Flashcard Set</h2>
        <p className="text-gray-600 mb-4">
          Upload text or PDFs to generate flashcards and quizzes automatically.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link 
            to="/upload"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors inline-block text-center"
          >
            Create New Set
          </Link>
          <button
            onClick={createSampleQuiz}
            disabled={creatingSample}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creatingSample ? 'Creating...' : 'Create Sample Quiz'}
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Flashcard Sets</h2>
        
        {flashcardSets.length === 0 ? (
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <p className="text-gray-600">No flashcard sets yet. Create your first one!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {flashcardSets.map((set) => (
              <div key={set._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
                {/* Card Header with Actions */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {editingSet === set._id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="flex-1 px-2 py-1 text-lg font-semibold border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEdit(set._id)}
                            className="p-1 text-green-600 hover:text-green-800"
                            title="Save"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 text-gray-600 hover:text-gray-800"
                            title="Cancel"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">{set.title}</h3>
                      )}
                    </div>
                    
                    {editingSet !== set._id && (
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => handleEditSet(set)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit title"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteSet(set._id)}
                          disabled={deletingSet === set._id}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                          title="Delete set"
                        >
                          {deletingSet === set._id ? (
                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-gray-600 text-sm font-medium">
                      {set.type === 'simple' 
                        ? `${set.flashcards?.length || 0} flashcards` 
                        : `${set.questions?.length || 0} questions`
                      }
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      set.type === 'simple' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {set.type === 'simple' ? 'Q/A Cards' : 'MCQ Quiz'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3 min-h-[3rem]">
                    {set.type === 'simple' 
                      ? (set.flashcards?.length > 0 ? `First card: ${set.flashcards[0].question.substring(0, 80)}...` : 'No flashcards available')
                      : (set.summary?.short || 'No summary available')
                    }
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <Link 
                      to={set.type === 'simple' ? `/flashcards/${set._id}` : `/quiz/${set._id}`}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      {set.type === 'simple' ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                          </svg>
                          Study Cards
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                          </svg>
                          Take Quiz
                        </>
                      )}
                    </Link>
                    
                    <span className="text-gray-400 text-xs">
                      {new Date(set.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

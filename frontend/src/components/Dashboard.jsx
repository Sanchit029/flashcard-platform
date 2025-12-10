import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { flashcardAPI, documentAPI } from '../utils/api';
import StudyStatistics from './StudyStatistics';


const Dashboard = ({ token }) => {
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [filteredFlashcardSets, setFilteredFlashcardSets] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creatingSample, setCreatingSample] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingSet, setDeletingSet] = useState(null);
  const [activeTab, setActiveTab] = useState('flashcards'); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔑 Fetching data with token:', token ? 'Token present' : 'No token');
        
        if (!token) {
          setError('No authentication token found. Please log in again.');
          return;
        }

        // Fetch both flashcard sets and documents
        const [flashcardsResponse, documentsResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/flashcard-sets`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          documentAPI.getAll()
        ]);
        
        setFlashcardSets(flashcardsResponse.data);
        setDocuments(documentsResponse.data.documents || []);
        
        setError(''); // Clear any previous errors
      } catch (err) {
        console.error('Error fetching data:', err);
        
        if (err.response?.status === 401) {
          setError('Authentication failed. Your session may have expired. Please log in again.');
        } else if (err.response?.status === 500) {
          setError('Server error. Please check if the backend server is running.');
        } else if (err.code === 'ECONNREFUSED' || !err.response) {
          setError('Cannot connect to server. Please check if the backend is running on port 5003.');
        } else {
          setError(`Failed to fetch data: ${err.response?.data?.message || err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Initialize filtered flashcard sets when flashcard sets change
  useEffect(() => {
    setFilteredFlashcardSets(flashcardSets);
  }, [flashcardSets]);

  const fetchFlashcardSets = async () => {
    try {
      console.log('🔄 Refreshing flashcard sets...');
      
      if (!token) {
        setError('No authentication token found. Please log in again.');
        return;
      }

      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/flashcard-sets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFlashcardSets(response.data);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Error fetching flashcard sets:', err);
      
      if (err.response?.status === 401) {
        setError('Authentication failed. Your session may have expired. Please log in again.');
      } else if (err.response?.status === 500) {
        setError('Server error. Please check if the backend server is running.');
      } else if (err.code === 'ECONNREFUSED' || !err.response) {
        setError('Cannot connect to server. Please check if the backend is running on port 5003.');
      } else {
        setError(`Failed to fetch flashcard sets: ${err.response?.data?.message || err.message}`);
      }
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

  

  // Determine which flashcard sets to display
  const displayedFlashcardSets = filteredFlashcardSets.length > 0 || flashcardSets.length === 0
    ? filteredFlashcardSets
    : flashcardSets;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-gray-600 font-medium">Loading your flashcards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 text-lg">
          Manage your flashcard sets and track your learning progress
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg mb-6 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold mb-1">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Total Sets</p>
              <p className="text-4xl font-black">{flashcardSets.length}</p>
            </div>
            <div className="bg-white/20 rounded-full p-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium mb-1">Flashcards</p>
              <p className="text-4xl font-black">
                {flashcardSets.reduce((total, set) => {
                  return total + (set.flashcards?.length || set.questions?.length || 0);
                }, 0)}
              </p>
            </div>
            <div className="bg-white/20 rounded-full p-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
              </svg>
            </div>
          </div>
        </div>

        

       
      </div>

      {/* Study Statistics */}
      <StudyStatistics />

      {/* Create New Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-md p-8 mb-8 border border-indigo-100">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span></span>
              Create New Flashcard Set
            </h2>
            <p className="text-gray-600">
              Upload text or PDFs to generate flashcards and quizzes automatically with AI.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            to="/upload"
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Create New Set
          </Link>
          <button
            onClick={createSampleQuiz}
            disabled={creatingSample}
            className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-indigo-600 px-8 py-4 rounded-xl font-semibold transition-all border-2 border-indigo-200 hover:border-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creatingSample ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                Creating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                Create Sample Quiz
              </>
            )}
          </button>
        </div>
      </div>

      

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('flashcards')}
          className={`px-6 py-3 font-semibold transition-all border-b-2 ${
            activeTab === 'flashcards'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
           Flashcard Sets ({flashcardSets.length})
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-6 py-3 font-semibold transition-all border-b-2 ${
            activeTab === 'documents'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
           Documents ({documents.length})
        </button>
      </div>

      {/* Flashcard Sets Grid */}
      {activeTab === 'flashcards' && (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span></span>
          Your Flashcard Sets
          {displayedFlashcardSets.length > 0 && (
            <span className="text-sm font-normal text-gray-500">({displayedFlashcardSets.length})</span>
          )}
        </h2>
        
        {displayedFlashcardSets.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-12 text-center border-2 border-dashed border-gray-300">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No flashcard sets yet</h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first flashcard set. Upload a PDF or paste some text to begin!
              </p>
              <Link 
                to="/upload"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Create Your First Set
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {displayedFlashcardSets.map((set) => (
              <div key={set._id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group transform hover:-translate-y-1">
                {/* Card Header with Actions */}
                <div className={`p-5 border-b ${set.type === 'simple' ? 'bg-green-50 border-green-100' : 'bg-blue-50 border-blue-100'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {editingSet === set._id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="flex-1 px-3 py-2 text-lg font-bold border-2 border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEdit(set._id)}
                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            title="Save"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            title="Cancel"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">{set.title}</h3>
                      )}
                    </div>
                    
                    {editingSet !== set._id && (
                      <div className="flex items-center gap-2 ml-3">
                        <button
                          onClick={() => handleEditSet(set)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Edit title"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteSet(set._id)}
                          disabled={deletingSet === set._id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                          title="Delete set"
                        >
                          {deletingSet === set._id ? (
                            <div className="w-5 h-5 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-gray-700 text-sm font-semibold flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                      </svg>
                      {set.type === 'simple' 
                        ? `${set.flashcards?.length || 0} flashcards` 
                        : `${set.questions?.length || 0} questions`
                      }
                    </span>
                    <span className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wide ${
                      set.type === 'simple' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {set.type === 'simple' ? 'Q/A Cards' : 'MCQ Quiz'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-5 line-clamp-2 min-h-[2.5rem]">
                    {set.type === 'simple' 
                      ? (set.flashcards?.length > 0 ? `${set.flashcards[0].question.substring(0, 100)}...` : 'No flashcards available')
                      : (set.summary?.short || 'AI-generated quiz ready to test your knowledge')
                    }
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <Link 
                      to={set.type === 'simple' ? `/flashcards/${set._id}` : `/quiz/${set._id}`}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg transform hover:scale-105 ${
                        set.type === 'simple'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {set.type === 'simple' ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                          </svg>
                          Quick Revision
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
                    
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      {new Date(set.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Saved Documents Grid */}
      {activeTab === 'documents' && (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span></span>
          Saved Documents
          {documents.length > 0 && (
            <span className="text-sm font-normal text-gray-500">({documents.length})</span>
          )}
        </h2>
        
        {documents.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-12 text-center border-2 border-dashed border-gray-300">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4"></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No saved documents yet</h3>
              <p className="text-gray-600 mb-6">
                Upload PDFs or text to automatically save them with generated flashcards, quizzes, and summaries!
              </p>
              <Link 
                to="/upload"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Upload First Document
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div key={doc._id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-200 overflow-hidden group">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 truncate group-hover:text-indigo-600 transition-colors">
                        {doc.title}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">{doc.filename}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {doc.flashcards?.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-indigo-600">🃏</span>
                        <span>{doc.flashcards.length} flashcards</span>
                      </div>
                    )}
                    {doc.mcqs?.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-green-600">✅</span>
                        <span>{doc.mcqs.length} quiz questions</span>
                      </div>
                    )}
                    {doc.summary && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-purple-600">📝</span>
                        <span>Summary available</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </div>
                    {doc.viewCount > 0 && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                        {doc.viewCount} views
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={`/documents/${doc._id}`}
                      className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-all text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                      View
                    </Link>
                    <button
                      onClick={async () => {
                        if (window.confirm('Delete this document? This cannot be undone.')) {
                          try {
                            await documentAPI.delete(doc._id);
                            setDocuments(documents.filter(d => d._id !== doc._id));
                          } catch (error) {
                            console.error('Delete error:', error);
                            alert('Failed to delete document');
                          }
                        }
                      }}
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}
      
    </div>
  );
};

export default Dashboard;

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { documentAPI, flashcardAPI } from '../utils/api';
import FlashcardSet from './FlashcardSet';
import TempQuiz from './TempQuiz';

const DocumentViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('flashcards');
  const [savingFlashcards, setSavingFlashcards] = useState(false);
  const [savingMCQs, setSavingMCQs] = useState(false);
  const [flashcardSetId, setFlashcardSetId] = useState(null);
  const [showTempQuiz, setShowTempQuiz] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        const response = await documentAPI.getById(id);
        setDocument(response.data.document);
        
        // Set active tab based on what's available
        if (response.data.document.flashcards?.length > 0) {
          setActiveTab('flashcards');
        } else if (response.data.document.mcqs?.length > 0) {
          setActiveTab('mcqs');
        } else if (response.data.document.summary) {
          setActiveTab('summary');
        }
        
        setError('');
      } catch (err) {
        console.error('Error fetching document:', err);
        setError(err.response?.data?.message || 'Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDocument();
    }
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this document? This cannot be undone.')) {
      try {
        await documentAPI.delete(id);
        navigate('/dashboard');
      } catch (err) {
        console.error('Delete error:', err);
        alert('Failed to delete document');
      }
    }
  };

  const handleSaveAsFlashcardSet = async () => {
    if (!document.flashcards || document.flashcards.length === 0) {
      alert('No flashcards to save');
      return;
    }

    setSavingFlashcards(true);
    try {
      const response = await flashcardAPI.createSimple({
        title: `${document.title} - Flashcards`,
        flashcards: document.flashcards
      });
      
      setFlashcardSetId(response.data._id);
      alert('✅ Flashcards saved! You can now track your progress.');
      
      navigate(`/flashcard-sets/${response.data._id}`);
    } catch (err) {
      console.error('Error saving flashcards:', err);
      alert('Failed to save flashcards as a set');
    } finally {
      setSavingFlashcards(false);
    }
  };

  const handleStartTempQuiz = () => {
    if (!document.mcqs || document.mcqs.length === 0) {
      alert('No MCQs available for quiz');
      return;
    }
    setShowTempQuiz(true);
  };

  const handleTempQuizComplete = (results) => {
    console.log('Quiz completed with results:', results);
    // You can add analytics or other handling here
  };

  const handleTempQuizCancel = () => {
    setShowTempQuiz(false);
  };

  // If showing temporary quiz, render the TempQuiz component
  if (showTempQuiz) {
    return (
      <TempQuiz 
        quizData={{
          title: `${document.title} - Quiz`,
          questions: document.mcqs
        }}
        onComplete={handleTempQuizComplete}
        onCancel={handleTempQuizCancel}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Document</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!document) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-3 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Back to Dashboard
              </Link>
              <h1 className="text-3xl font-black text-gray-900 mb-2 break-words">
                {document.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  {document.filename}
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  {new Date(document.createdAt).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </div>
                {document.viewCount > 0 && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    {document.viewCount} {document.viewCount === 1 ? 'view' : 'views'}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              Delete
            </button>
          </div>

          {/* Content Stats */}
          <div className="flex flex-wrap gap-4">
            {document.flashcards?.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg">
                <span className="text-xl">🃏</span>
                <span className="font-semibold">{document.flashcards.length} Flashcards</span>
              </div>
            )}
            {document.mcqs?.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg">
                <span className="text-xl">✅</span>
                <span className="font-semibold">{document.mcqs.length} Quiz Questions</span>
              </div>
            )}
            {document.summary && (
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg">
                <span className="text-xl">📝</span>
                <span className="font-semibold">Summary Available</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {document.flashcards?.length > 0 && (
            <button
              onClick={() => setActiveTab('flashcards')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                activeTab === 'flashcards'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>🃏</span>
              Flashcards
            </button>
          )}
          {document.mcqs?.length > 0 && (
            <button
              onClick={() => setActiveTab('mcqs')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                activeTab === 'mcqs'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>✅</span>
              Quiz
            </button>
          )}
          {document.summary && (
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                activeTab === 'summary'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>📝</span>
              Summary
            </button>
          )}
        </div>

        {/* Content Display */}
        {activeTab === 'flashcards' && document.flashcards?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            {/* Save as Flashcard Set Button */}
            {!flashcardSetId && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-1 flex items-center gap-2">
                      <span>💡</span>
                      Want to track your progress?
                    </h4>
                    <p className="text-sm text-blue-700">
                      Save these flashcards as a flashcard set to track mastery levels, study sessions, and progress over time.
                    </p>
                  </div>
                  <button
                    onClick={handleSaveAsFlashcardSet}
                    disabled={savingFlashcards}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                  >
                    {savingFlashcards ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                        </svg>
                        Save as Flashcard Set
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
            
            <FlashcardSet flashcards={document.flashcards} />
          </div>
        )}

        {activeTab === 'mcqs' && document.mcqs?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span>🎯</span>
                MCQ Quiz
                <span className="text-sm font-normal text-gray-500">({document.mcqs.length} questions)</span>
              </h2>
              <button
                onClick={handleStartTempQuiz}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                Start Interactive Quiz
              </button>
            </div>

            <div className="grid gap-6">
              {document.mcqs.map((mcq, index) => (
                <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-gray-900 mb-3">{mcq.questionText}</p>
                      <div className="space-y-2">
                        {mcq.options?.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              option === mcq.correctAnswer
                                ? 'bg-green-100 border-green-500 text-green-900 font-medium'
                                : 'bg-white border-gray-300 text-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{String.fromCharCode(65 + optIndex)}.</span>
                              <span>{option}</span>
                              {option === mcq.correctAnswer && (
                                <svg className="w-5 h-5 text-green-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {mcq.difficulty && (
                        <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                          </svg>
                          {mcq.difficulty.charAt(0).toUpperCase() + mcq.difficulty.slice(1)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> Click "Start Interactive Quiz" to take this quiz with a timer and get instant feedback on your answers!
              </p>
            </div>
          </div>
        )}

        {activeTab === 'summary' && document.summary && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span>📝</span>
              Document Summary
            </h2>

            {/* Short Summary */}
            {document.summary.short && (
              <div className="mb-6">
                <h4 className="font-semibold text-lg mb-2 flex items-center">
                  📄 Short Summary
                  {document.summary.short.wordCount && (
                    <span className="ml-2 text-sm text-gray-500">({document.summary.short.wordCount} words)</span>
                  )}
                </h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-gray-800 leading-relaxed">{document.summary.short.text}</p>
                </div>
              </div>
            )}

            {/* Detailed Summary */}
            {document.summary.detailed && (
              <div className="mb-6">
                <h4 className="font-semibold text-lg mb-2 flex items-center">
                  📋 Detailed Summary
                  {document.summary.detailed.wordCount && (
                    <span className="ml-2 text-sm text-gray-500">({document.summary.detailed.wordCount} words)</span>
                  )}
                </h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-line">{document.summary.detailed.text}</p>
                </div>
              </div>
            )}

            {/* Key Points */}
            {document.summary.keyPoints && document.summary.keyPoints.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-lg mb-2">🔑 Key Points</h4>
                <ul className="space-y-2">
                  {document.summary.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                        {index + 1}
                      </span>
                      <p className="text-gray-700 leading-relaxed">{point}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Insights */}
            {document.summary.insights && (
              <div className="mb-6">
                <h4 className="font-semibold text-lg mb-2">💡 AI Insights</h4>
                {document.summary.insights.aiInsight && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                    <p className="text-gray-800 leading-relaxed">{document.summary.insights.aiInsight}</p>
                  </div>
                )}

                {/* Themes */}
                {document.summary.insights.themes && document.summary.insights.themes.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-700 mb-2">Themes Identified:</h5>
                    <div className="flex flex-wrap gap-2">
                      {document.summary.insights.themes.map((theme, index) => (
                        <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                          {theme.name} ({theme.relevance}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reading Level */}
                {document.summary.insights.readingLevel && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Reading Level:</span> {document.summary.insights.readingLevel}
                  </div>
                )}
              </div>
            )}

            {/* AI Model Info */}
            {document.summary.model && (
              <div className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-200">
                Generated by: {document.summary.model}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiAPI, documentAPI } from '../utils/api';
import FlashcardSet from './FlashcardSet';
import TempQuiz from './TempQuiz';

const Upload = () => {
  const navigate = useNavigate();
  const [textInput, setTextInput] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatingCards, setGeneratingCards] = useState(false);
  const [generatingMcqs, setGeneratingMcqs] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  // const [savingQuiz, setSavingQuiz] = useState(false);
  const [savingDocument, setSavingDocument] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('text');
  const [flashcards, setFlashcards] = useState([]);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [mcqs, setMcqs] = useState([]);
  const [showMcqs, setShowMcqs] = useState(false);
  const [mcqMode, setMcqMode] = useState('preview');
  const [summary, setSummary] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryType, setSummaryType] = useState('both');
  const [selectedContentTypes, setSelectedContentTypes] = useState(new Set(['flashcards']));
  const [mcqDifficulty, setMcqDifficulty] = useState('mixed');
  const [mcqCount, setMcqCount] = useState(8);
  const [flashcardCount, setFlashcardCount] = useState(10);
  const [activeResultTab, setActiveResultTab] = useState('flashcards');
  const [documentMetadata, setDocumentMetadata] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [documentTitle, setDocumentTitle] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [savedDocumentId, setSavedDocumentId] = useState(null);
  const [showTempQuiz, setShowTempQuiz] = useState(false);

  const handleTextUpload = async () => {
    if (!textInput.trim()) {
      setError('Please enter some text');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await aiAPI.uploadText(textInput);
      setExtractedText(response.data.extractedText);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process text');
    } finally {
      setLoading(false);
    }
  };

  const handlePDFUpload = async () => {
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await aiAPI.uploadPDF(file);
      setExtractedText(response.data.extractedText);
      setDocumentMetadata(response.data.metadata); // Store metadata for later
      setError(''); // Clear any previous errors
    } catch (err) {
      const errorData = err.response?.data;
      
      // Check if it's an image-based PDF error
      if (errorData?.suggestion) {
        setError(
          `${errorData.message}\n\n  Tip: ${errorData.suggestion}\n\n` +
          `If you have a scanned PDF, please:\n` +
          `1. Use the "Paste Text" tab instead\n` +
          `2. Copy text manually from the PDF viewer\n` +
          `3. Or use a text-based (not scanned) PDF`
        );
      } else {
        setError(errorData?.message || 'Failed to extract text from PDF');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please select a valid PDF file');
      setFile(null);
    }
  };

  const clearAll = () => {
    setTextInput('');
    setExtractedText('');
    setFile(null);
    setError('');
    setFlashcards([]);
    setShowFlashcards(false);
    setMcqs([]);
    setShowMcqs(false);
    setSummary(null);
    setShowSummary(false);
  };

  const generateFlashcards = async (text) => {
    setGeneratingCards(true);
    setError('');
    
    try {
      const response = await aiAPI.generateFlashcards(text, flashcardCount);
      const generatedCards = response.data.flashcards || [];
      setFlashcards(generatedCards);
      setShowFlashcards(true);
      return generatedCards; // Return the generated flashcards
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate flashcards');
      return [];
    } finally {
      setGeneratingCards(false);
    }
  };

  const generateMCQs = async (text) => {
    setGeneratingMcqs(true);
    setError('');
    
    try {
      const response = await aiAPI.generateMCQs(text, mcqCount, mcqDifficulty);
      const generatedMcqs = response.data.questions || [];
      setMcqs(generatedMcqs);
      setShowMcqs(true);
      return generatedMcqs; // Return the generated MCQs
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate MCQs');
      return [];
    } finally {
      setGeneratingMcqs(false);
    }
  };

  const generateSummary = async (text) => {
    setGeneratingSummary(true);
    setError('');
    
    try {
      const response = await aiAPI.generateSummary(text, {
        type: summaryType,
        maxLength: 150,
        detailedMaxLength: 300
      });
      const rawSummary = response.data.data;
      console.log('📝 Raw summary from API:', rawSummary);
      
      // Transform summary data to match UI expectations
      const transformedSummary = {};
      
      if (rawSummary.short) {
        const shortText = typeof rawSummary.short === 'string' ? rawSummary.short : rawSummary.short.text || '';
        transformedSummary.short = {
          text: shortText,
          wordCount: shortText.split(' ').length
        };
      }
      
      if (rawSummary.detailed) {
        const detailedText = typeof rawSummary.detailed === 'string' ? rawSummary.detailed : rawSummary.detailed.text || '';
        transformedSummary.detailed = {
          text: detailedText,
          wordCount: detailedText.split(' ').length
        };
      }
      
      // Include other metadata
      if (rawSummary.model) {
        transformedSummary.model = rawSummary.model;
      }
      if (rawSummary.keyPoints) {
        transformedSummary.keyPoints = rawSummary.keyPoints;
      }
      
      console.log('🔄 Transformed summary for UI:', transformedSummary);
      setSummary(transformedSummary);
      setShowSummary(true);
      return rawSummary; // Return the original format for backend saving
    } catch (err) {
      console.error('❌ Summary generation error:', err);
      setError(err.response?.data?.message || 'Failed to generate summary');
      return null;
    } finally {
      setGeneratingSummary(false);
    }
  };

  const toggleContentType = (type) => {
    const newSelected = new Set(selectedContentTypes);
    if (newSelected.has(type)) {
      newSelected.delete(type);
    } else {
      newSelected.add(type);
    }
    setSelectedContentTypes(newSelected);
  };

  const generateSelectedContent = async (text) => {
    const promises = [];
    let generatedFlashcards = [];
    let generatedMcqs = [];
    let generatedSummary = null;
    
    if (selectedContentTypes.has('flashcards')) {
      promises.push(
        generateFlashcards(text).then(cards => {
          generatedFlashcards = cards;
        })
      );
    }
    if (selectedContentTypes.has('mcqs')) {
      promises.push(
        generateMCQs(text).then(mcqs => {
          generatedMcqs = mcqs;
        })
      );
    }
    if (selectedContentTypes.has('summary')) {
      promises.push(
        generateSummary(text).then(summary => {
          generatedSummary = summary;
        })
      );
    }
    
    if (promises.length > 0) {
      await Promise.all(promises);
      // Save after all content is generated
      console.log('💾 Auto-saving document with generated content...');
      await saveDocument(text, generatedFlashcards, generatedMcqs, generatedSummary);
      console.log('✅ Document auto-saved successfully!');
    } else {
      // Default to flashcards if nothing selected
      generatedFlashcards = await generateFlashcards(text);
      console.log('💾 Auto-saving document with default flashcards...');
      await saveDocument(text, generatedFlashcards, [], null);
      console.log('✅ Document auto-saved successfully!');
    }
  };

  // Save generated content to database
  const saveDocument = async (text, generatedFlashcards, generatedMcqs, generatedSummary) => {
    setSavingDocument(true);
    try {
      // Create title from filename or first few words
      let title = documentTitle || file?.name || text.substring(0, 50) + '...';
      if (file?.name) {
        title = file.name.replace('.pdf', '');
      }

      const documentData = {
        title,
        filename: file?.name || 'Text Input',
        fileSize: file?.size || text.length,
        extractedText: text,
        flashcards: generatedFlashcards && generatedFlashcards.length > 0 ? generatedFlashcards : undefined,
        mcqs: generatedMcqs && generatedMcqs.length > 0 ? generatedMcqs : undefined,
        summary: generatedSummary || undefined,
        metadata: {
          pages: documentMetadata?.pages,
          wordCount: text.split(' ').length,
          extractionMethod: file ? 'pdf-parse' : 'text-input',
          aiModel: 'Gemini AI (gemini-2.5-flash)',
          generatedAt: new Date().toISOString()
        }
      };

      console.log('💾 Saving document with:', {
        title: documentData.title,
        flashcards: generatedFlashcards?.length || 0,
        mcqs: generatedMcqs?.length || 0,
        hasSummary: !!generatedSummary,
        extractedTextLength: text.length
      });

      const response = await documentAPI.create(documentData);
      setSavedDocumentId(response.data.document._id);
      console.log('✅ Document saved successfully to database! ID:', response.data.document._id);
      console.log('📄 Document will appear in Dashboard > Documents tab');
      
      // Show success message to user
      const contentTypes = [];
      if (generatedFlashcards?.length > 0) contentTypes.push(`${generatedFlashcards.length} flashcards`);
      if (generatedMcqs?.length > 0) contentTypes.push(`${generatedMcqs.length} MCQs`);
      if (generatedSummary) contentTypes.push('summary');
      
      const userChoice = confirm(`✅ Document "${documentData.title}" saved successfully with ${contentTypes.join(', ')}!\n\nWould you like to go to the Dashboard to view your saved documents?\n\nClick OK to go to Dashboard, or Cancel to stay here.`);
      
      if (userChoice) {
        navigate('/dashboard');
      }
      
    } catch (err) {
      console.error('❌ Failed to save document:', err);
      console.error('Error details:', err.response?.data || err.message);
      alert(`❌ Failed to save document: ${err.response?.data?.message || err.message}`);
    } finally {
      setSavingDocument(false);
    }
  };

  const handleStartTempQuiz = () => {
    if (!mcqs || mcqs.length === 0) {
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
    const quizTitle = documentMetadata?.filename 
      ? `${documentMetadata.filename} - Quiz` 
      : `Quiz - ${new Date().toLocaleDateString()}`;
    
    return (
      <TempQuiz 
        quizData={{
          title: quizTitle,
          questions: mcqs
        }}
        onComplete={handleTempQuizComplete}
        onCancel={handleTempQuizCancel}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900 mb-2 flex items-center gap-3">
          <span></span>
          Create New Flashcard Set
        </h1>
        <p className="text-gray-600 text-lg">
          Upload text or PDFs and let AI generate flashcards, quizzes, and summaries instantly
        </p>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab('text')}
          className={`flex items-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all ${
            activeTab === 'text'
              ? 'bg-indigo-600 text-white shadow-lg scale-105'
              : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
          Text Input
        </button>
        <button
          onClick={() => setActiveTab('pdf')}
          className={`flex items-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all ${
            activeTab === 'pdf'
              ? 'bg-indigo-600 text-white shadow-lg scale-105'
              : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
          </svg>
          PDF Upload
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg mb-6 shadow-sm animate-shake">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold mb-1">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Text Input Tab */}
      {activeTab === 'text' && (
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-100 rounded-lg p-3">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Enter Your Text</h2>
              <p className="text-gray-600 text-sm">Paste any content you want to study</p>
            </div>
          </div>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Paste your text content here... (e.g., lecture notes, study material, articles)"
            className="w-full h-48 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-gray-700"
          />
          <div className="flex justify-between items-center mt-6">
            <div className="flex items-center gap-2 text-sm">
              <span className={`font-semibold ${textInput.length > 100 ? 'text-green-600' : 'text-gray-500'}`}>
                {textInput.length} characters
              </span>
              {textInput.length > 100 && (
                <span className="text-green-600">✓ Sufficient length</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={clearAll}
                className="px-6 py-3 text-gray-600 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-all"
              >
                Clear
              </button>
              <button
                onClick={handleTextUpload}
                disabled={loading || !textInput.trim()}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                    Process Text
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Upload Tab */}
      {activeTab === 'pdf' && (
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-red-100 rounded-lg p-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Upload PDF Document</h2>
              <p className="text-gray-600 text-sm">Supports text-based PDFs (for scanned PDFs, use "Paste Text" tab)</p>
            </div>
          </div>
          <div className={`border-3 border-dashed rounded-2xl p-12 text-center transition-all ${
            file ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50'
          }`}>
            {!file ? (
              <div>
                <div className="mx-auto w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                </div>
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-lg font-bold text-gray-900">
                      Drop your PDF here or click to browse
                    </span>
                    <span className="mt-2 block text-sm text-gray-500">
                      PDF files only • Max 50MB • Text-based PDFs work best
                    </span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf" />
                  </label>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <div className="bg-red-500 rounded-lg p-3">
                  <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="p-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  title="Remove file"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6 gap-3">
            <button
              onClick={clearAll}
              className="px-6 py-3 text-gray-600 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-all"
            >
              Clear
            </button>
            <button
              onClick={handlePDFUpload}
              disabled={loading || !file}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Extracting Text...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                  </svg>
                  Extract Text from PDF
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Extracted Text Display */}
      {extractedText && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-lg p-2">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Extracted Text</h2>
                <p className="text-sm text-gray-600">{extractedText.length} characters • {extractedText.split(' ').length} words</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 max-h-96 overflow-y-auto mb-6 border border-gray-200">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
              {extractedText}
            </pre>
          </div>
          
          {/* Content Type Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
                Select AI content to generate (multiple allowed):
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => toggleContentType('flashcards')}
                className={`flex items-center justify-center p-4 border-2 rounded-lg font-medium transition-all ${
                  selectedContentTypes.has('flashcards')
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                {selectedContentTypes.has('flashcards') && <span className="mr-2">✓</span>}
                <span className="text-sm font-medium"> Flashcards</span>
              </button>
              <button
                onClick={() => toggleContentType('mcqs')}
                className={`flex items-center justify-center p-4 border-2 rounded-lg font-medium transition-all ${
                  selectedContentTypes.has('mcqs')
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                {selectedContentTypes.has('mcqs') && <span className="mr-2">✓</span>}
                <span className="text-sm font-medium">❓ Quiz/MCQs</span>
              </button>
              <button
                onClick={() => toggleContentType('summary')}
                className={`flex items-center justify-center p-4 border-2 rounded-lg font-medium transition-all ${
                  selectedContentTypes.has('summary')
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                {selectedContentTypes.has('summary') && <span className="mr-2">✓</span>}
                <span className="text-sm font-medium">📝 Summary</span>
              </button>
            </div>

            {/* Flashcard Settings */}
            {selectedContentTypes.has('flashcards') && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="text-sm font-medium text-green-900 mb-3"> Flashcard Settings:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Number of Flashcards
                    </label>
                    <input
                      type="number"
                      min="3"
                      max="25"
                      value={flashcardCount}
                      onChange={(e) => setFlashcardCount(parseInt(e.target.value) || 10)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <p className="text-xs text-green-700">
                        Generate between 3-25 flashcards based on your content length
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* MCQ Difficulty and Count Selection */}
            {selectedContentTypes.has('mcqs') && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-3">⚙️ MCQ Settings:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Difficulty Level
                    </label>
                    <select
                      value={mcqDifficulty}
                      onChange={(e) => setMcqDifficulty(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="easy">🟢 Easy Only</option>
                      <option value="medium">🟡 Medium Only</option>
                      <option value="hard">🔴 Hard Only</option>
                      <option value="mixed">🎯 Mixed (Balanced)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Number of Questions
                    </label>
                    <input
                      type="number"
                      min="3"
                      max="20"
                      value={mcqCount}
                      onChange={(e) => setMcqCount(parseInt(e.target.value) || 8)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-blue-700 mt-2">
                    Mixed difficulty: 30% Easy, 40% Medium, 30% Hard
                </p>
              </div>
            )}

            {/* Summary Type Options */}
            {selectedContentTypes.has('summary') && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Summary Options:</h4>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSummaryType('short')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      summaryType === 'short'
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    📄 Short Summary
                  </button>
                  <button
                    onClick={() => setSummaryType('detailed')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      summaryType === 'detailed'
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    📋 Detailed Summary
                  </button>
                  <button
                    onClick={() => setSummaryType('both')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      summaryType === 'both'
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    📊 Both Types
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Short: ~150 words | Detailed: ~300 words | Both: Get comprehensive analysis
                </p>
              </div>
            )}
            
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setSelectedContentTypes(new Set(['flashcards', 'mcqs', 'summary']))}
                className="px-4 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedContentTypes(new Set())}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {selectedContentTypes.size === 0 ? 'Select at least one content type' : 
               `Selected: ${Array.from(selectedContentTypes).join(', ')}`}
            </div>
            <button
              onClick={() => generateSelectedContent(extractedText)}
              disabled={generatingCards || generatingMcqs || generatingSummary || savingDocument || selectedContentTypes.size === 0}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {(generatingCards || generatingMcqs || generatingSummary) ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating AI Content...
                </>
              ) : savingDocument ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving Document...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012 2v2M7 7h10"></path>
                  </svg>
                  Generate Selected Content ({selectedContentTypes.size})
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Generated Content - Tabbed Interface */}
      {(showFlashcards || showMcqs || showSummary) && (
        <div className="mt-8 bg-white rounded-2xl shadow-xl border border-gray-100">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 px-6 pt-6">
            <div className="flex gap-2 overflow-x-auto pb-4">
              {showFlashcards && flashcards.length > 0 && (
                <button
                  onClick={() => setActiveResultTab('flashcards')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-semibold transition-all whitespace-nowrap ${
                    activeResultTab === 'flashcards'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012 2v2M7 7h10"></path>
                  </svg>
                  Flashcards ({flashcards.length})
                </button>
              )}
              
              {showMcqs && mcqs.length > 0 && (
                <button
                  onClick={() => setActiveResultTab('mcqs')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-semibold transition-all whitespace-nowrap ${
                    activeResultTab === 'mcqs'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                  </svg>
                  Quiz ({mcqs.length})
                </button>
              )}
              
              {showSummary && summary && (
                <button
                  onClick={() => setActiveResultTab('summary')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-semibold transition-all whitespace-nowrap ${
                    activeResultTab === 'summary'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Summary
                </button>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Flashcards Tab */}
            {activeResultTab === 'flashcards' && showFlashcards && flashcards.length > 0 && (
              <div>
                <FlashcardSet
                  flashcards={flashcards}
                  title="AI Generated Flashcards"
                  onSave={(savedSet) => {
                    console.log('Flashcard set saved:', savedSet);
                    setFlashcards([]);
                    setShowFlashcards(false);
                  }}
                />
              </div>
            )}

            {/* MCQs Tab */}
            {activeResultTab === 'mcqs' && showMcqs && mcqs.length > 0 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">  AI Generated Quiz Questions</h3>
                  <p className="text-gray-600 mb-4">{mcqs.length} questions ready for your quiz</p>
                  
                  {/* Primary Action - Take Quiz */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6 mb-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                          🎯 Ready to Test Your Knowledge?
                        </h4>
                        <p className="text-gray-700">
                          Take a timed interactive quiz with instant feedback and score tracking
                        </p>
                      </div>
                      <button
                        onClick={handleStartTempQuiz}
                        className="px-8 py-4 rounded-xl font-bold text-lg transition-all bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                        Start Interactive Quiz
                      </button>
                    </div>
                  </div>

                  {/* Question Preview (without answers) */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
                    <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      📋 Question Preview
                      <span className="text-sm font-normal text-gray-500">({mcqs.length} questions)</span>
                    </h4>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {mcqs.slice(0, 5).map((mcq, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                              {index + 1}
                            </span>
                            <p className="flex-1 text-gray-800 font-medium">{mcq.questionText}</p>
                          </div>
                          {mcq.difficulty && (
                            <div className="mt-2 ml-10">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                                mcq.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                mcq.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {mcq.difficulty.charAt(0).toUpperCase() + mcq.difficulty.slice(1)}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                      {mcqs.length > 5 && (
                        <p className="text-center text-gray-500 text-sm italic">
                          ... and {mcqs.length - 5} more questions
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Secondary Option - Study Mode Toggle */}
                  <div className="border-t border-gray-200 pt-4">
                    <button
                      onClick={() => setMcqMode(mcqMode === 'study' ? 'preview' : 'study')}
                      className="w-full px-4 py-3 rounded-lg font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center gap-2"
                    >
                      {mcqMode === 'study' ? (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                          </svg>
                          Hide Answers
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                          </svg>
                           View Study Mode (Show All Answers)
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Study Mode - Shown only when toggled */}
                {mcqMode === 'study' && (
                  <div>
                    <h4 className="text-xl font-bold text-gray-800 mb-4">Study Mode - Review Questions & Answers</h4>
                    <p className="text-gray-600 mb-6">All correct answers are highlighted for learning purposes</p>
                    
                    {mcqs.map((mcq, index) => (
                      <div key={index} className="mb-6 p-4 border border-gray-200 rounded-lg">
                        <h5 className="font-semibold text-lg mb-3">Question {index + 1}</h5>
                        <p className="mb-4 text-gray-800">{mcq.questionText}</p>
                        
                        <div className="space-y-2 mb-4">
                          {mcq.options.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className={`p-3 rounded-md border ${
                                option === mcq.correctAnswer
                                  ? 'bg-green-50 border-green-200 text-green-800'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <span className="font-medium">{String.fromCharCode(65 + optionIndex)}.</span> {option}
                              {option === mcq.correctAnswer && (
                                <span className="ml-2 text-green-600 font-semibold">✓ Correct</span>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {mcq.explanation && (
                          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                            <p className="text-sm text-blue-800">
                              <strong>Explanation:</strong> {mcq.explanation}
                            </p>
                          </div>
                        )}
                        
                        {mcq.difficulty && (
                          <div className="mt-2">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                              mcq.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                              mcq.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {mcq.difficulty.charAt(0).toUpperCase() + mcq.difficulty.slice(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Summary Tab */}
            {activeResultTab === 'summary' && showSummary && summary && (
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">  AI Generated Summary</h3>
                <p className="text-gray-600 mb-6">
                  Created using {summary.model || 'facebook/bart-large-cnn'} model
                </p>
                
                {/* Short Summary */}
                {summary.short && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-lg mb-2 flex items-center">
                      📄 Short Summary
                      <span className="ml-2 text-sm text-gray-500">({summary.short.wordCount} words)</span>
                    </h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-gray-800 leading-relaxed">{summary.short.text}</p>
                    </div>
                  </div>
                )}

                {/* Detailed Summary */}
                {summary.detailed && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-lg mb-2 flex items-center">
                      📋 Detailed Summary
                      <span className="ml-2 text-sm text-gray-500">({summary.detailed.wordCount} words)</span>
                    </h4>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-gray-800 leading-relaxed">{summary.detailed.text}</p>
                    </div>
                  </div>
                )}
                
                {/* Key Points */}
                {summary.keyPoints && summary.keyPoints.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-lg mb-2">🔑 Key Points</h4>
                    <ul className="space-y-2">
                      {summary.keyPoints.map((point, index) => (
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
                {summary.insights && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-lg mb-2">  AI Insights</h4>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                      <p className="text-gray-800 leading-relaxed">{summary.insights.aiInsight}</p>
                    </div>
                    
                    {/* Themes */}
                    {summary.insights.themes && summary.insights.themes.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-700 mb-2">Themes Identified:</h5>
                        <div className="flex flex-wrap gap-2">
                          {summary.insights.themes.map((theme, index) => (
                            <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                              {theme.name} ({theme.relevance}%)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reading Level */}
                    {summary.insights.readingLevel && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Reading Level:</span> {summary.insights.readingLevel}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="font-semibold text-gray-800">{summary.originalLength}</div>
                    <div>Original Chars</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="font-semibold text-gray-800">{summary.summaryType}</div>
                    <div>Summary Type</div>
                  </div>
                  {summary.short && (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="font-semibold text-gray-800">{summary.short.compressionRatio}%</div>
                      <div>Compression</div>
                    </div>
                  )}
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="font-semibold text-green-800">✓ AI</div>
                    <div>Enhanced</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Old sections - REMOVED */}
      {/* Generated Flashcards */}
      {/* Generated MCQs */}
      {/* Generated Summary */}
      
      {/* Custom CSS for animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Upload;

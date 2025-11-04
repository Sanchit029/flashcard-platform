import { useState } from 'react';
import { aiAPI } from '../utils/api';
import FlashcardSet from './FlashcardSet';

const Upload = () => {
  const [textInput, setTextInput] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatingCards, setGeneratingCards] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('text');
  const [flashcards, setFlashcards] = useState([]);
  const [showFlashcards, setShowFlashcards] = useState(false);

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
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to extract text from PDF');
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
  };

  const generateFlashcards = async (text) => {
    setGeneratingCards(true);
    setError('');
    
    try {
      const response = await aiAPI.generateFlashcards(text);
      setFlashcards(response.data.flashcards);
      setShowFlashcards(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate flashcards');
    } finally {
      setGeneratingCards(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Upload Content</h1>
      
      {/* Tab Navigation */}
      <div className="flex mb-6 border-b">
        <button
          onClick={() => setActiveTab('text')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'text'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          Text Input
        </button>
        <button
          onClick={() => setActiveTab('pdf')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'pdf'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          PDF Upload
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Text Input Tab */}
      {activeTab === 'text' && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Enter Text</h2>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Paste your text content here..."
            className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-500">
              {textInput.length} characters
            </span>
            <div className="space-x-3">
              <button
                onClick={clearAll}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleTextUpload}
                disabled={loading || !textInput.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Process Text'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Upload Tab */}
      {activeTab === 'pdf' && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Upload PDF</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
            {!file ? (
              <div>
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Click to upload or drag and drop
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">PDF files only</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf" />
                  </label>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-4 space-x-3">
            <button
              onClick={clearAll}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handlePDFUpload}
              disabled={loading || !file}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Extracting...' : 'Extract Text'}
            </button>
          </div>
        </div>
      )}

      {/* Extracted Text Display */}
      {extractedText && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Extracted Text</h2>
            <span className="text-sm text-gray-500">
              {extractedText.length} characters
            </span>
          </div>
          <div className="bg-gray-50 rounded-md p-4 max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
              {extractedText}
            </pre>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={() => generateFlashcards(extractedText)}
              disabled={generatingCards}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {generatingCards ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2v2M7 7h10"></path>
                  </svg>
                  Create Flashcard Set
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Generated Flashcards */}
      {showFlashcards && flashcards.length > 0 && (
        <div className="mt-8">
          <FlashcardSet
            flashcards={flashcards}
            title="Generated from Upload"
            onSave={(savedSet) => {
              console.log('Flashcard set saved:', savedSet);
              // Optionally clear the current state after saving
              setFlashcards([]);
              setShowFlashcards(false);
              setExtractedText('');
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Upload;

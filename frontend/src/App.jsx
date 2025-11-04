import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Upload from './components/Upload';
import UploadEnhanced from './components/UploadEnhanced';
import DocumentViewer from './components/DocumentViewer';
import Quiz from './components/Quiz';
import StudyCards from './components/StudyCards';
import QuickRevision from './components/QuickRevision';
import ComingSoonAnalytics from './components/ComingSoonAnalytics';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <Router>
      <div className="min-h-screen">
        {token && <Navbar token={token} logout={logout} />}
        <Routes>
          <Route 
            path="/login" 
            element={!token ? <Login setToken={setToken} /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/register" 
            element={!token ? <Register setToken={setToken} /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/dashboard" 
            element={token ? (
              <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                  <Dashboard token={token} />
                </div>
              </div>
            ) : <Navigate to="/login" />} 
          />
          <Route 
            path="/upload" 
            element={token ? (
              <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                  <UploadEnhanced token={token} />
                </div>
              </div>
            ) : <Navigate to="/login" />} 
          />
          <Route 
            path="/upload-old" 
            element={token ? (
              <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                  <Upload token={token} />
                </div>
              </div>
            ) : <Navigate to="/login" />} 
          />
          <Route 
            path="/quiz/:setId" 
            element={token ? <Quiz /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/flashcards/:setId" 
            element={token ? <StudyCards /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/flashcard-sets/:id" 
            element={token ? <QuickRevision /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/documents/:id" 
            element={token ? <DocumentViewer /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/analytics" 
            element={token ? <ComingSoonAnalytics /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/" 
            element={<Navigate to={token ? "/dashboard" : "/login"} />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;



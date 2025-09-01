import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Upload from './components/Upload';
import ApiTest from './components/ApiTest';
import Quiz from './components/Quiz';
import StudyCards from './components/StudyCards';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      // You could decode the token here to get user info
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
                  <Upload token={token} />
                </div>
              </div>
            ) : <Navigate to="/login" />} 
          />
          <Route 
            path="/test" 
            element={token ? (
              <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                  <ApiTest token={token} />
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
            path="/" 
            element={<Navigate to={token ? "/dashboard" : "/login"} />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

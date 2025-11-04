import axios from 'axios';

const API_BASE_URL = 'http://localhost:5003/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API calls
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
};

// Flashcard API calls
export const flashcardAPI = {
  getAll: () => api.get('/flashcard-sets'),
  getById: (id) => api.get(`/flashcard-sets/${id}`),
  create: (data) => api.post('/flashcard-sets', data),
  createSimple: (data) => api.post('/flashcard-sets/simple', data),
  createMCQ: (data) => api.post('/flashcard-sets/mcq', data),
  createSampleMCQ: () => api.post('/flashcard-sets/sample-mcq'),
  update: (id, data) => api.put(`/flashcard-sets/${id}`, data),
  delete: (id) => api.delete(`/flashcard-sets/${id}`),
  // Progress tracking
  updateProgress: (id, progressData) => api.post(`/flashcard-sets/${id}/study`, progressData),
  getProgress: (id) => api.get(`/flashcard-sets/${id}/progress`),
  // Quiz attempts
  saveQuizAttempt: (id, attemptData) => api.post(`/flashcard-sets/${id}/quiz-attempt`, attemptData),
  getQuizHistory: (id) => api.get(`/flashcard-sets/${id}/quiz-history`),
  getQuizAttempt: (attemptId) => api.get(`/flashcard-sets/quiz-attempt/${attemptId}`),
  // Flashcard editing
  editFlashcard: (setId, cardId, data) => api.put(`/flashcard-sets/${setId}/flashcard/${cardId}`, data),
  regenerateFlashcard: (setId, cardId) => api.post(`/flashcard-sets/${setId}/flashcard/${cardId}/regenerate`),
};

// AI API calls
export const aiAPI = {
  generateMCQs: (text, count = 5, difficulty = 'mixed') => api.post('/ai/generate-mcqs', { text, count, difficulty }),
  generateSummary: (text, options = {}) => api.post('/ai/generate-summary', { text, ...options }),
  generateFlashcards: (text, count = 5) => api.post('/ai/generate-flashcards', { text, count }),
  uploadText: (text) => api.post('/ai/upload/text', { text }),
  uploadPDF: (file) => {
    const formData = new FormData();
    formData.append('pdf', file);
    return api.post('/ai/upload/pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

// Document API calls
export const documentAPI = {
  getAll: (params = {}) => api.get('/documents', { params }),
  getById: (id) => api.get(`/documents/${id}`),
  create: (data) => api.post('/documents', data),
  update: (id, data) => api.put(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
  getStats: () => api.get('/documents/stats/overview'),
};

export default api;

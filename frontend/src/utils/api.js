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
  createSampleMCQ: () => api.post('/flashcard-sets/sample-mcq'),
  update: (id, data) => api.put(`/flashcard-sets/${id}`, data),
  delete: (id) => api.delete(`/flashcard-sets/${id}`),
};

// AI API calls
export const aiAPI = {
  generateMCQs: (text) => api.post('/ai/generate-mcqs', { text }),
  generateSummary: (text) => api.post('/ai/summarize', { text }),
  generateFlashcards: (text) => api.post('/ai/generate-flashcards', { text }),
  uploadText: (text) => api.post('/ai/upload/text', { text }),
  uploadPDF: (file) => {
    const formData = new FormData();
    formData.append('pdf', file);
    return api.post('/ai/upload/pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

export default api;

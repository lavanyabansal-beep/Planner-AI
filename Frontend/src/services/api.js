import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error handling interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ===== USERS =====
export const usersAPI = {
  getAll: () => api.get('/api/users').then(res => res.data),
  create: (userData) => api.post('/api/users', userData).then(res => res.data),
};

// ===== LABELS =====
export const labelsAPI = {
  getAll: () => api.get('/api/labels').then(res => res.data),
};

// ===== BOARDS =====
export const boardsAPI = {
  getAll: () => api.get('/api/boards').then(res => res.data),
  create: (boardData) => api.post('/api/boards', boardData).then(res => res.data),
  delete: (boardId) => api.delete(`/api/boards/${boardId}`).then(res => res.data),
};

// ===== BUCKETS =====
export const bucketsAPI = {
  getAll: (boardId) => {
    const url = boardId ? `/api/buckets?boardId=${boardId}` : '/api/buckets';
    return api.get(url).then(res => res.data);
  },
  getByBoard: (boardId) => api.get(`/api/boards/${boardId}/buckets`).then(res => res.data),
  create: (bucketData) => api.post('/api/buckets', bucketData).then(res => res.data),
  update: (id, updates) => api.put(`/api/buckets/${id}`, updates).then(res => res.data),
  delete: (id) => api.delete(`/api/buckets/${id}`).then(res => res.data),
};

// ===== TASKS =====
export const tasksAPI = {
  getAll: (bucketId) => {
    const url = bucketId ? `/api/tasks?bucketId=${bucketId}` : '/api/tasks';
    return api.get(url).then(res => res.data);
  },
  getById: (id) => api.get(`/api/tasks/${id}`).then(res => res.data),
  create: (bucketId, taskData) => 
    api.post('/api/tasks', { bucketId, task: taskData }).then(res => res.data),
  update: (id, updates) => api.put(`/api/tasks/${id}`, updates).then(res => res.data),
  delete: (id) => api.delete(`/api/tasks/${id}`).then(res => res.data),
  move: (id, fromBucketId, toBucketId) => 
    api.post(`/api/tasks/${id}/move`, { fromBucketId, toBucketId }).then(res => res.data),
};

// ===== UPLOADS =====
export const uploadsAPI = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },
};

export default api;

import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:8000/',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const projectApi = {
  getAll: () => api.get('/projects/'),
  create: (data) => api.post('/projects/', data),
  getTasks: (projectId) => api.get(`/projects/${projectId}/tasks/`)
};
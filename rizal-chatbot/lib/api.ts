import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000/api/',
});

// Add Authorization header automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;

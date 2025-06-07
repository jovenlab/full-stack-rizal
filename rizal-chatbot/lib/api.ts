import axios from 'axios';
import { API_CONFIG } from './config';

const API = axios.create({
  baseURL: API_CONFIG.BASE_URL + '/',
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

import axios from 'axios';

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

export const setupAxiosInterceptors = (router: any) => {
  // Clear any existing interceptors to avoid duplicates
  axios.interceptors.response.clear();
  
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;
        
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            const { API_CONFIG } = await import('./config');
            const response = await axios.post(API_CONFIG.ENDPOINTS.REFRESH, {
              refresh: refreshToken
            });
            
            const newAccessToken = response.data.access;
            localStorage.setItem('access_token', newAccessToken);
            
            processQueue(null, newAccessToken);
            
            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, redirect to login
          processQueue(refreshError, null);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          router.push('/');
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
      
      return Promise.reject(error);
    }
  );
};

// Helper function to get authorization headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper function to clear all tokens
export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}; 
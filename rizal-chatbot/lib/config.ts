// API Configuration
// Change this single variable to switch between development and production
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://full-stack-rizal-deployment.onrender.com/api'
  : 'http://localhost:8000/api';

// Alternatively, you can use environment variables:
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    // Authentication
    LOGIN: `${API_BASE_URL}/token/`,
    REFRESH: `${API_BASE_URL}/token/refresh/`,
    REGISTER: `${API_BASE_URL}/register/`,
    
    // Chat
    CHAT: `${API_BASE_URL}/chat/`,
    SESSIONS: `${API_BASE_URL}/sessions/`,
    SESSION_DETAIL: (sessionId: number) => `${API_BASE_URL}/sessions/${sessionId}/`,
  }
};

export default API_CONFIG; 
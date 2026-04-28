import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor - Add token to headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle 401 Unauthorized - Token expired or invalid
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      // Handle 403 Forbidden - No permission
      if (error.response.status === 403) {
        console.error('Access forbidden:', error.response.data.message);
      }
      
      // Handle 422 Validation errors
      if (error.response.status === 422) {
        return Promise.reject(error.response.data);
      }
      
      // Handle 500 Server errors
      if (error.response.status === 500) {
        console.error('Server error:', error.response.data.message);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

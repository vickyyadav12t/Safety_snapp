// API Service for SafetySnap
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.data || error.message);
    
    // Handle common errors
    if (error.response?.status === 413) {
      error.message = 'File too large. Please upload an image smaller than 10MB.';
    } else if (error.response?.status === 415) {
      error.message = 'Invalid file type. Please upload a JPEG, PNG, or WebP image.';
    } else if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout. Please try again.';
    } else if (!error.response) {
      error.message = 'Network error. Please check your connection.';
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const apiService = {
  // Health check
  async healthCheck() {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  },

  // Upload and analyze image
  async uploadAndAnalyzeImage(file, workEnvironment = 'construction') {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('workEnvironment', workEnvironment);

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload progress: ${percentCompleted}%`);
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  },

  // Analyze existing image
  async analyzeExistingImage(filename, workEnvironment = 'construction') {
    try {
      const response = await api.post('/upload/analyze', {
        filename,
        workEnvironment,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }
  },

  // Get list of uploaded files
  async getUploadedFiles() {
    try {
      const response = await api.get('/upload/files');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch files: ${error.message}`);
    }
  },

  // Delete uploaded file
  async deleteFile(filename) {
    try {
      const response = await api.delete(`/upload/${filename}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  },
};

// Utility functions
export const utils = {
  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Format date
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  },

  // Get file extension
  getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  },

  // Validate image file
  validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
    }

    if (file.size > maxSize) {
      throw new Error('File too large. Please upload an image smaller than 10MB.');
    }

    return true;
  },

  // Get work environment options
  getWorkEnvironments() {
    return [
      { value: 'construction', label: 'Construction Site', description: 'Hard hat, safety vest, boots, gloves, safety glasses required' },
      { value: 'manufacturing', label: 'Manufacturing Plant', description: 'Hard hat, safety glasses, gloves, boots required' },
      { value: 'laboratory', label: 'Laboratory', description: 'Safety glasses, gloves required' },
      { value: 'healthcare', label: 'Healthcare', description: 'Gloves, safety glasses required' },
      { value: 'general', label: 'General Workplace', description: 'Standard PPE requirements' }
    ];
  },

  // Get PPE category colors
  getCategoryColor(category) {
    const colors = {
      'head_protection': '#3B82F6', // Blue
      'visibility': '#F59E0B', // Orange
      'eye_protection': '#10B981', // Green
      'hand_protection': '#8B5CF6', // Purple
      'foot_protection': '#EF4444', // Red
      'person': '#6B7280' // Gray
    };
    return colors[category] || '#6B7280';
  },

  // Get recommendation priority color
  getPriorityColor(priority) {
    const colors = {
      'high': '#EF4444', // Red
      'medium': '#F59E0B', // Orange
      'low': '#10B981' // Green
    };
    return colors[priority] || '#6B7280';
  }
};

export default api;

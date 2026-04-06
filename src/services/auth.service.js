/**
 * Authentication Service
 * 
 * Handles all authentication-related API calls including login, logout,
 * token refresh, and user profile retrieval.
 */

import api from './api';

/**
 * Authentication service object
 */
const authService = {
  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data and tokens
   */
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      // Extract from nested data structure
      const { accessToken, csrfToken, user } = response.data.data;

      // Store tokens
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      }
      if (csrfToken) {
        localStorage.setItem('csrfToken', csrfToken);
      }

      return { user, accessToken, csrfToken };
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Logout current user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      this.clearTokens();
    }
  },

  /**
   * Refresh access token using refresh token cookie
   * @returns {Promise<Object>} New access token and CSRF token
   */
  async refresh() {
    try {
      const response = await api.post('/auth/refresh');
      // Extract from nested data structure
      const { accessToken, csrfToken } = response.data.data;

      // Store new tokens
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      }
      if (csrfToken) {
        localStorage.setItem('csrfToken', csrfToken);
      }

      return { accessToken, csrfToken };
    } catch (error) {
      this.clearTokens();
      throw this.handleError(error);
    }
  },

  /**
   * Get current authenticated user
   * @returns {Promise<Object>} User data
   */
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me');
      // /auth/me returns the user object directly in data
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Check if user is authenticated (has valid access token)
   * @returns {boolean}
   */
  isAuthenticated() {
    const token = localStorage.getItem('accessToken');
    return !!token;
  },

  /**
   * Get stored access token
   * @returns {string|null}
   */
  getAccessToken() {
    return localStorage.getItem('accessToken');
  },

  /**
   * Get stored CSRF token
   * @returns {string|null}
   */
  getCsrfToken() {
    return localStorage.getItem('csrfToken');
  },

  /**
   * Clear all stored tokens
   */
  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('csrfToken');
  },

  /**
   * Handle API errors and format error messages
   * @param {Error} error - Axios error object
   * @returns {Error} Formatted error
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const data = error.response.data;
      let message = 'An error occurred';
      
      // Extract validation errors if present
      if (data?.error?.details && Array.isArray(data.error.details)) {
        // Format validation errors as a readable message
        message = data.error.details.map(detail => detail.message).join(', ');
      } else if (data?.error?.message) {
        message = data.error.message;
      } else if (data?.message) {
        message = data.message;
      } else if (data?.error) {
        message = typeof data.error === 'string' ? data.error : 'An error occurred';
      }
      
      const err = new Error(message);
      err.status = error.response.status;
      err.data = data;
      return err;
    } else if (error.request) {
      // Request made but no response received
      return new Error('No response from server. Please check your connection.');
    } else {
      // Error in request setup
      return new Error(error.message || 'An unexpected error occurred');
    }
  },
};

export default authService;

// Made with Bob
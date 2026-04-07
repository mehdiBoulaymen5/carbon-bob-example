/**
 * Admin Service
 * 
 * Handles admin-specific API calls including dashboard statistics and audit logs.
 */

import api from './api';

/**
 * Admin service object
 */
const adminService = {
  /**
   * Get dashboard statistics
   * @returns {Promise<Object>} Dashboard statistics
   */
  async getDashboardStats() {
    try {
      const response = await api.get('/admin/dashboard/stats');
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Get audit logs with filtering
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {Object} filters - Filter options
   * @param {string} filters.userId - Filter by user ID
   * @param {string} filters.action - Filter by action type
   * @param {string} filters.resourceType - Filter by resource type
   * @param {string} filters.resourceId - Filter by resource ID
   * @param {string} filters.startDate - Start date for filtering
   * @param {string} filters.endDate - End date for filtering
   * @returns {Promise<Object>} Audit logs data with pagination
   */
  async getAuditLogs(page = 1, limit = 50, filters = {}) {
    try {
      const params = {
        page,
        limit,
        ...filters,
      };

      const response = await api.get('/admin/audit-logs', { params });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Get audit log statistics
   * @param {Object} filters - Filter options
   * @param {string} filters.startDate - Start date for filtering
   * @param {string} filters.endDate - End date for filtering
   * @returns {Promise<Object>} Audit log statistics
   */
  async getAuditLogStats(filters = {}) {
    try {
      const params = { ...filters };
      const response = await api.get('/admin/audit-logs/stats', { params });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Get system health status
   * @returns {Promise<Object>} System health data
   */
  async getSystemHealth() {
    try {
      const response = await api.get('/admin/health');
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Get user activity summary
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @param {string} filters.startDate - Start date for filtering
   * @param {string} filters.endDate - End date for filtering
   * @returns {Promise<Object>} User activity data
   */
  async getUserActivity(userId, filters = {}) {
    try {
      const params = { ...filters };
      const response = await api.get(`/admin/users/${userId}/activity`, { params });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Handle API errors and format error messages
   * @param {Error} error - Axios error object
   * @returns {Error} Formatted error
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.error?.message || 
                     error.response.data?.message || 
                     'An error occurred';
      const err = new Error(message);
      err.status = error.response.status;
      err.data = error.response.data;
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

export default adminService;

// Made with Bob
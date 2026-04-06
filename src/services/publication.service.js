/**
 * Publication Service
 * 
 * Handles all publication-related API calls for both admin and public endpoints.
 */

import api from './api';

/**
 * Publication service object
 */
const publicationService = {
  /**
   * Get all publications (Admin)
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {string} search - Search query
   * @param {string} sortBy - Sort field
   * @param {string} sortOrder - Sort order (ASC/DESC)
   * @param {string} status - Filter by status (draft/published)
   * @returns {Promise<Object>} Publications data with pagination
   */
  async getAllPublications(page = 1, limit = 20, search = '', sortBy = 'created_at', sortOrder = 'DESC', status = '') {
    try {
      const params = {
        page,
        limit,
        sort: sortBy,
        order: sortOrder,
      };

      if (search) params.search = search;
      if (status) params.status = status;

      const response = await api.get('/admin/publications', { params });
      const data = response.data.data;
      // Map 'items' to 'publications' for frontend compatibility
      return {
        publications: data.items || [],
        pagination: data.pagination
      };
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Get publication by ID (Admin)
   * @param {string} id - Publication ID
   * @returns {Promise<Object>} Publication data
   */
  async getPublicationById(id) {
    try {
      const response = await api.get(`/admin/publications/${id}`);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Create new publication (Admin)
   * @param {Object} data - Publication data
   * @returns {Promise<Object>} Created publication
   */
  async createPublication(data) {
    try {
      const response = await api.post('/admin/publications', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Update publication (Admin)
   * @param {string} id - Publication ID
   * @param {Object} data - Updated publication data
   * @returns {Promise<Object>} Updated publication
   */
  async updatePublication(id, data) {
    try {
      const response = await api.put(`/admin/publications/${id}`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Delete publication (Admin)
   * @param {string} id - Publication ID
   * @returns {Promise<Object>} Success message
   */
  async deletePublication(id) {
    try {
      const response = await api.delete(`/admin/publications/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Bulk delete publications (Admin)
   * @param {string[]} ids - Array of publication IDs
   * @returns {Promise<Object>} Success message
   */
  async bulkDeletePublications(ids) {
    try {
      const deletePromises = ids.map(id => this.deletePublication(id));
      await Promise.all(deletePromises);
      return { success: true, message: `${ids.length} publications deleted successfully` };
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Get published publications (Public)
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {string} search - Search query
   * @param {string} topics - Comma-separated topics
   * @param {string} industries - Comma-separated industries
   * @returns {Promise<Object>} Publications data with pagination
   */
  async getPublicPublications(page = 1, limit = 20, search = '', topics = '', industries = '') {
    try {
      const params = { page, limit };
      
      if (search) params.search = search;
      if (topics) params.topics = topics;
      if (industries) params.industries = industries;

      const response = await api.get('/publications', { params });
      const data = response.data.data;
      // Map 'items' to 'publications' for frontend compatibility
      return {
        publications: data.items || [],
        pagination: data.pagination
      };
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Get single published publication (Public)
   * @param {string} id - Publication ID
   * @returns {Promise<Object>} Publication data with related publications
   */
  async getPublicPublicationById(id) {
    try {
      const response = await api.get(`/publications/${id}`);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Create new use case (Public - auto-published)
   * @param {Object} data - Use case data
   * @returns {Promise<Object>} Created use case
   */
  async createUseCase(data) {
    try {
      const response = await api.post('/usecases', data);
      return response.data;
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

export default publicationService;

// Made with Bob
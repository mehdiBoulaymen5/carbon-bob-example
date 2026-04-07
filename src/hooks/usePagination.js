/**
 * usePagination Hook
 * Reusable pagination logic with state management
 */

import { useState, useCallback, useMemo } from 'react';

/**
 * Pagination hook
 * @param {Object} options - Pagination options
 * @param {number} options.initialPage - Initial page number (default: 1)
 * @param {number} options.initialPageSize - Initial page size (default: 20)
 * @param {Array} options.pageSizeOptions - Available page size options
 * @returns {Object} Pagination state and handlers
 */
export const usePagination = ({
  initialPage = 1,
  initialPageSize = 20,
  pageSizeOptions = [10, 20, 30, 40, 50]
} = {}) => {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalItems, setTotalItems] = useState(0);

  /**
   * Calculate total pages
   */
  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / pageSize);
  }, [totalItems, pageSize]);

  /**
   * Check if there's a next page
   */
  const hasNext = useMemo(() => {
    return page < totalPages;
  }, [page, totalPages]);

  /**
   * Check if there's a previous page
   */
  const hasPrev = useMemo(() => {
    return page > 1;
  }, [page]);

  /**
   * Calculate offset for API calls
   */
  const offset = useMemo(() => {
    return (page - 1) * pageSize;
  }, [page, pageSize]);

  /**
   * Go to specific page
   */
  const goToPage = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  /**
   * Go to next page
   */
  const nextPage = useCallback(() => {
    if (hasNext) {
      setPage(prev => prev + 1);
    }
  }, [hasNext]);

  /**
   * Go to previous page
   */
  const prevPage = useCallback(() => {
    if (hasPrev) {
      setPage(prev => prev - 1);
    }
  }, [hasPrev]);

  /**
   * Change page size
   */
  const changePageSize = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  }, []);

  /**
   * Reset pagination
   */
  const reset = useCallback(() => {
    setPage(initialPage);
    setPageSize(initialPageSize);
    setTotalItems(0);
  }, [initialPage, initialPageSize]);

  /**
   * Handle Carbon Pagination onChange event
   */
  const handlePaginationChange = useCallback(({ page: newPage, pageSize: newPageSize }) => {
    if (newPageSize !== pageSize) {
      changePageSize(newPageSize);
    } else {
      goToPage(newPage);
    }
  }, [pageSize, changePageSize, goToPage]);

  return {
    // State
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNext,
    hasPrev,
    offset,
    pageSizeOptions,
    
    // Actions
    setPage,
    setPageSize,
    setTotalItems,
    goToPage,
    nextPage,
    prevPage,
    changePageSize,
    reset,
    handlePaginationChange
  };
};

export default usePagination;

// Made with Bob

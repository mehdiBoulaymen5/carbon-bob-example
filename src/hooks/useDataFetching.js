/**
 * useDataFetching Hook
 * Generic data fetching with loading, error states, and caching
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Data fetching hook with caching
 * @param {Function} fetchFn - Async function to fetch data
 * @param {Array} dependencies - Dependencies array for refetching
 * @param {Object} options - Hook options
 * @returns {Object} Data, loading, error states and refetch function
 */
export const useDataFetching = (fetchFn, dependencies = [], options = {}) => {
  const {
    initialData = null,
    cacheKey = null,
    cacheDuration = 5 * 60 * 1000, // 5 minutes default
    onSuccess = null,
    onError = null,
    enabled = true
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  
  const cacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);

  /**
   * Check if cached data is still valid
   */
  const isCacheValid = useCallback((key) => {
    if (!cacheKey || !key) return false;
    
    const cached = cacheRef.current.get(key);
    if (!cached) return false;
    
    const now = Date.now();
    return (now - cached.timestamp) < cacheDuration;
  }, [cacheKey, cacheDuration]);

  /**
   * Get cached data
   */
  const getCachedData = useCallback((key) => {
    if (!cacheKey || !key) return null;
    
    const cached = cacheRef.current.get(key);
    return cached ? cached.data : null;
  }, [cacheKey]);

  /**
   * Set cached data
   */
  const setCachedData = useCallback((key, data) => {
    if (!cacheKey || !key) return;
    
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now()
    });
  }, [cacheKey]);

  /**
   * Fetch data
   */
  const fetchData = useCallback(async (force = false) => {
    // Check if fetch is enabled
    if (!enabled) return;

    // Check cache first
    if (!force && cacheKey && isCacheValid(cacheKey)) {
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        setData(cachedData);
        setLastFetch(Date.now());
        return cachedData;
      }
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const result = await fetchFn({ signal: abortControllerRef.current.signal });
      
      setData(result);
      setLastFetch(Date.now());
      
      // Cache the result
      if (cacheKey) {
        setCachedData(cacheKey, result);
      }

      // Call success callback
      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      // Ignore abort errors
      if (err.name === 'AbortError') {
        return;
      }

      const errorMessage = err.message || 'An error occurred while fetching data';
      setError(errorMessage);

      // Call error callback
      if (onError) {
        onError(err);
      }

      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFn, enabled, cacheKey, isCacheValid, getCachedData, setCachedData, onSuccess, onError]);

  /**
   * Refetch data (bypass cache)
   */
  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  /**
   * Clear cache
   */
  const clearCache = useCallback(() => {
    if (cacheKey) {
      cacheRef.current.delete(cacheKey);
    }
  }, [cacheKey]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setLoading(false);
    setLastFetch(null);
    clearCache();
  }, [initialData, clearCache]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchData();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    loading,
    error,
    lastFetch,
    refetch,
    clearCache,
    reset,
    isStale: lastFetch && (Date.now() - lastFetch) > cacheDuration
  };
};

export default useDataFetching;

// Made with Bob

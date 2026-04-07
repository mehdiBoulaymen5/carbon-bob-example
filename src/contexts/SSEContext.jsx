/**
 * SSE Context
 * Provides SSE connection management and event subscription for React components
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import sseService from '../services/sse.service';
import { useAuth } from './AuthContext';

const SSEContext = createContext(null);

export const SSEProvider = ({ children }) => {
  const { isAuthenticated, isAdmin, token } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    connectionType: null,
    error: null
  });

  // Handle connection status updates
  useEffect(() => {
    const handleConnectionChange = (status) => {
      setConnectionStatus(prev => ({
        ...prev,
        isConnected: status.status === 'connected',
        error: status.error || null
      }));
    };

    // Subscribe to connection events
    const unsubscribe = sseService.on('connection', handleConnectionChange);

    return () => {
      unsubscribe();
    };
  }, []);

  // Manage SSE connection based on authentication state
  useEffect(() => {
    // Determine the desired connection type
    const desiredType = (isAuthenticated && isAdmin && token) ? 'admin' : 'public';
    const currentStatus = sseService.getStatus();
    
    // Only reconnect if the connection type needs to change or if not connected
    if (currentStatus.connectionType !== desiredType || !currentStatus.isConnected) {
      if (desiredType === 'admin') {
        console.log('Connecting to admin SSE events');
        sseService.connectToAdminEvents(token);
        setConnectionStatus(prev => ({ ...prev, connectionType: 'admin' }));
      } else {
        console.log('Connecting to public SSE events');
        sseService.connectToPublicEvents();
        setConnectionStatus(prev => ({ ...prev, connectionType: 'public' }));
      }
    }

    // Cleanup only on unmount (not on every re-render)
    return () => {
      // Only disconnect when the component is actually unmounting
      // Don't disconnect on every effect re-run
    };
  }, [isAuthenticated, isAdmin, token]);

  // Separate effect to handle cleanup on unmount only
  useEffect(() => {
    return () => {
      console.log('SSEProvider unmounting, disconnecting SSE');
      sseService.disconnect();
    };
  }, []);

  /**
   * Subscribe to a specific event type
   */
  const subscribe = useCallback((eventType, callback) => {
    return sseService.on(eventType, callback);
  }, []);

  /**
   * Unsubscribe from a specific event type
   */
  const unsubscribe = useCallback((eventType, callback) => {
    sseService.off(eventType, callback);
  }, []);

  /**
   * Get current connection status
   */
  const getStatus = useCallback(() => {
    return sseService.getStatus();
  }, []);

  /**
   * Manually reconnect
   */
  const reconnect = useCallback(() => {
    if (isAuthenticated && isAdmin && token) {
      sseService.connectToAdminEvents(token);
    } else {
      sseService.connectToPublicEvents();
    }
  }, [isAuthenticated, isAdmin, token]);

  const value = {
    connectionStatus,
    subscribe,
    unsubscribe,
    getStatus,
    reconnect
  };

  return (
    <SSEContext.Provider value={value}>
      {children}
    </SSEContext.Provider>
  );
};

/**
 * Custom hook to use SSE context
 */
export const useSSE = () => {
  const context = useContext(SSEContext);
  if (!context) {
    throw new Error('useSSE must be used within an SSEProvider');
  }
  return context;
};

export default SSEContext;

// Made with Bob

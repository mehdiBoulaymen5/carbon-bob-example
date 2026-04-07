/**
 * useNotification Hook
 * Centralized notification management
 */

import { useState, useCallback } from 'react';

/**
 * Notification hook
 * @returns {Object} Notification state and handlers
 */
export const useNotification = () => {
  const [notifications, setNotifications] = useState([]);

  /**
   * Show notification
   * @param {Object} notification - Notification object
   * @param {string} notification.kind - Notification kind (success, error, warning, info)
   * @param {string} notification.title - Notification title
   * @param {string} notification.subtitle - Notification subtitle
   * @param {number} notification.timeout - Auto-dismiss timeout in ms (default: 5000)
   */
  const showNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      kind: notification.kind || 'info',
      title: notification.title,
      subtitle: notification.subtitle,
      timeout: notification.timeout || 5000,
      timestamp: Date.now()
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-dismiss if timeout is set
    if (newNotification.timeout > 0) {
      setTimeout(() => {
        dismissNotification(id);
      }, newNotification.timeout);
    }

    return id;
  }, []);

  /**
   * Dismiss notification
   * @param {number} id - Notification ID
   */
  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  /**
   * Show success notification
   */
  const success = useCallback((title, subtitle, timeout) => {
    return showNotification({ kind: 'success', title, subtitle, timeout });
  }, [showNotification]);

  /**
   * Show error notification
   */
  const error = useCallback((title, subtitle, timeout = 0) => {
    return showNotification({ kind: 'error', title, subtitle, timeout });
  }, [showNotification]);

  /**
   * Show warning notification
   */
  const warning = useCallback((title, subtitle, timeout) => {
    return showNotification({ kind: 'warning', title, subtitle, timeout });
  }, [showNotification]);

  /**
   * Show info notification
   */
  const info = useCallback((title, subtitle, timeout) => {
    return showNotification({ kind: 'info', title, subtitle, timeout });
  }, [showNotification]);

  return {
    notifications,
    showNotification,
    dismissNotification,
    clearAll,
    success,
    error,
    warning,
    info
  };
};

export default useNotification;

// Made with Bob

/**
 * SSE Service
 * Handles Server-Sent Events connections for real-time updates
 */

import { API_BASE_URL } from '../config/env';

class SSEService {
  constructor() {
    this.eventSource = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.isConnected = false;
    this.connectionType = null; // 'public' or 'admin'
  }

  /**
   * Connect to public SSE endpoint
   */
  connectToPublicEvents() {
    if (this.eventSource && this.connectionType === 'public') {
      console.log('Already connected to public events');
      return;
    }

    this.disconnect();
    this.connectionType = 'public';
    const url = `${API_BASE_URL}/events`;
    
    console.log('Connecting to public SSE:', url);
    this._connect(url);
  }

  /**
   * Connect to admin SSE endpoint (requires authentication)
   */
  connectToAdminEvents(token) {
    if (!token) {
      console.error('Token required for admin events');
      return;
    }

    if (this.eventSource && this.connectionType === 'admin') {
      console.log('Already connected to admin events');
      return;
    }

    this.disconnect();
    this.connectionType = 'admin';
    
    // For SSE with auth, we need to pass token as query parameter
    // since EventSource doesn't support custom headers
    const url = `${API_BASE_URL}/admin/events?token=${encodeURIComponent(token)}`;
    
    console.log('Connecting to admin SSE');
    this._connect(url);
  }

  /**
   * Internal method to establish SSE connection
   */
  _connect(url) {
    try {
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        console.log('SSE connection established');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this._notifyListeners('connection', { status: 'connected' });
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('SSE event received:', data);
          
          // Notify listeners based on event type
          if (data.type) {
            this._notifyListeners(data.type, data.data);
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        this.isConnected = false;
        this._notifyListeners('connection', { status: 'error', error });
        
        // Attempt to reconnect
        this._handleReconnect();
      };
    } catch (error) {
      console.error('Error creating EventSource:', error);
      this._handleReconnect();
    }
  }

  /**
   * Handle reconnection with exponential backoff
   */
  _handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this._notifyListeners('connection', { 
        status: 'failed', 
        message: 'Failed to reconnect after multiple attempts' 
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.connectionType === 'public') {
        this.connectToPublicEvents();
      } else if (this.connectionType === 'admin') {
        // For admin reconnection, we need the token from storage
        const token = localStorage.getItem('token');
        if (token) {
          this.connectToAdminEvents(token);
        }
      }
    }, delay);
  }

  /**
   * Subscribe to specific event type
   */
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);

    // Return unsubscribe function
    return () => {
      this.off(eventType, callback);
    };
  }

  /**
   * Unsubscribe from event type
   */
  off(eventType, callback) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).delete(callback);
      if (this.listeners.get(eventType).size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  /**
   * Notify all listeners of an event
   */
  _notifyListeners(eventType, data) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Disconnect from SSE
   */
  disconnect() {
    if (this.eventSource) {
      console.log('Disconnecting from SSE');
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
      this.connectionType = null;
      this.reconnectAttempts = 0;
      this._notifyListeners('connection', { status: 'disconnected' });
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      connectionType: this.connectionType,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Create singleton instance
const sseService = new SSEService();

export default sseService;

// Made with Bob

/**
 * SSE Controller
 * Handles Server-Sent Events for real-time updates
 */

class SSEController {
  constructor() {
    // Store active SSE connections
    this.publicConnections = new Set();
    this.adminConnections = new Set();
    
    // Heartbeat interval (30 seconds)
    this.heartbeatInterval = 30000;
    
    // Start heartbeat
    this.startHeartbeat();
  }

  /**
   * Setup SSE connection for public clients
   */
  setupPublicSSE(req, res) {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial connection message
    res.write('data: {"type":"connected","message":"Connected to publication updates"}\n\n');

    // Add connection to set
    this.publicConnections.add(res);

    // Handle client disconnect
    req.on('close', () => {
      this.publicConnections.delete(res);
      console.log(`Public SSE client disconnected. Active connections: ${this.publicConnections.size}`);
    });

    console.log(`Public SSE client connected. Active connections: ${this.publicConnections.size}`);
  }

  /**
   * Setup SSE connection for admin clients
   */
  setupAdminSSE(req, res) {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Send initial connection message
    res.write('data: {"type":"connected","message":"Connected to admin updates"}\n\n');

    // Add connection to set
    this.adminConnections.add(res);

    // Handle client disconnect
    req.on('close', () => {
      this.adminConnections.delete(res);
      console.log(`Admin SSE client disconnected. Active connections: ${this.adminConnections.size}`);
    });

    console.log(`Admin SSE client connected. Active connections: ${this.adminConnections.size}`);
  }

  /**
   * Send event to all public clients
   */
  sendPublicEvent(eventType, data) {
    const event = {
      type: eventType,
      data: data,
      timestamp: new Date().toISOString()
    };

    const message = `data: ${JSON.stringify(event)}\n\n`;

    // Send to all connected public clients
    this.publicConnections.forEach(client => {
      try {
        client.write(message);
      } catch (error) {
        console.error('Error sending event to public client:', error);
        this.publicConnections.delete(client);
      }
    });

    console.log(`Sent public event: ${eventType} to ${this.publicConnections.size} clients`);
  }

  /**
   * Send event to all admin clients
   */
  sendAdminEvent(eventType, data) {
    const event = {
      type: eventType,
      data: data,
      timestamp: new Date().toISOString()
    };

    const message = `data: ${JSON.stringify(event)}\n\n`;

    // Send to all connected admin clients
    this.adminConnections.forEach(client => {
      try {
        client.write(message);
      } catch (error) {
        console.error('Error sending event to admin client:', error);
        this.adminConnections.delete(client);
      }
    });

    console.log(`Sent admin event: ${eventType} to ${this.adminConnections.size} clients`);
  }

  /**
   * Send event to both public and admin clients
   */
  sendEvent(eventType, data) {
    this.sendPublicEvent(eventType, data);
    this.sendAdminEvent(eventType, data);
  }

  /**
   * Send heartbeat to keep connections alive
   */
  startHeartbeat() {
    setInterval(() => {
      const heartbeat = ': heartbeat\n\n';

      // Send to public clients
      this.publicConnections.forEach(client => {
        try {
          client.write(heartbeat);
        } catch (error) {
          console.error('Error sending heartbeat to public client:', error);
          this.publicConnections.delete(client);
        }
      });

      // Send to admin clients
      this.adminConnections.forEach(client => {
        try {
          client.write(heartbeat);
        } catch (error) {
          console.error('Error sending heartbeat to admin client:', error);
          this.adminConnections.delete(client);
        }
      });
    }, this.heartbeatInterval);
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      publicConnections: this.publicConnections.size,
      adminConnections: this.adminConnections.size,
      totalConnections: this.publicConnections.size + this.adminConnections.size
    };
  }
}

// Create singleton instance
const sseController = new SSEController();

module.exports = sseController;

// Made with Bob

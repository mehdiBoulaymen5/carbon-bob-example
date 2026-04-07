/**
 * Error Boundary Component
 * 
 * React error boundary to catch and handle errors in component tree.
 * Displays a user-friendly error page with retry option.
 */

import React from 'react';
import { Button, Grid, Column } from '@carbon/react';
import { WarningAlt } from '@carbon/icons-react';
import './ErrorBoundary.scss';

/**
 * ErrorBoundary component
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when error is caught
   * @param {Error} error - The error that was thrown
   * @returns {Object} New state
   */
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  /**
   * Log error details
   * @param {Error} error - The error that was thrown
   * @param {Object} errorInfo - Component stack trace
   */
  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Store error details in state
    this.setState({
      error,
      errorInfo,
    });

    // In production, you would send this to an error reporting service
    // Example: logErrorToService(error, errorInfo);
  }

  /**
   * Reset error boundary state
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Reload the page
   */
  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <Grid>
            <Column sm={4} md={8} lg={12} xlg={10}>
              <div className="error-boundary__content">
                <WarningAlt size={64} className="error-boundary__icon" />
                <h1 className="error-boundary__title">Something went wrong</h1>
                <p className="error-boundary__message">
                  We're sorry, but something unexpected happened. The error has been logged
                  and we'll look into it.
                </p>
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="error-boundary__details">
                    <h3>Error Details (Development Only)</h3>
                    <pre className="error-boundary__error-text">
                      {this.state.error.toString()}
                    </pre>
                    {this.state.errorInfo && (
                      <pre className="error-boundary__stack">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                )}

                <div className="error-boundary__actions">
                  <Button
                    kind="primary"
                    onClick={this.handleReset}
                  >
                    Try Again
                  </Button>
                  <Button
                    kind="secondary"
                    onClick={this.handleReload}
                  >
                    Reload Page
                  </Button>
                </div>
              </div>
            </Column>
          </Grid>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Made with Bob
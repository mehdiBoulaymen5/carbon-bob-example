/**
 * Protected Route Component
 * 
 * Wrapper component for admin-only routes that require authentication.
 * Redirects to login if not authenticated and shows loading state while checking.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loading } from '@carbon/react';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @returns {React.ReactElement} Protected content or redirect
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Loading description="Checking authentication..." withOverlay={false} />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Render protected content
  return children;
};

export default ProtectedRoute;

// Made with Bob
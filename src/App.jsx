/**
 * Main App Component
 *
 * Root component with routing configuration for public and admin areas.
 * Includes authentication context provider, SSE provider, and route protection.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Theme } from '@carbon/react';
import { AuthProvider } from './contexts/AuthContext';
import { SSEProvider } from './contexts/SSEContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import PublicLayout from './components/public/PublicLayout';
import AdminLayout from './components/admin/AdminLayout';

// Public Pages
import Home from './components/public/Home';
import PublicationsPage from './components/public/PublicationsPage';
import PublicationDetail from './components/public/PublicationDetail';
import NotFound from './components/shared/NotFound';

// Admin Pages
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminPublications from './components/admin/AdminPublications';
import AdminAuditLogs from './components/admin/AdminAuditLogs';
import PublicationForm from './components/admin/PublicationForm';

import './App.scss';

/**
 * Main App component
 * @returns {React.ReactElement} Application root
 */
function App() {
  return (
    <Theme theme="g10">
      <BrowserRouter future={{ v7_relativeSplatPath: true }}>
        <AuthProvider>
          <SSEProvider>
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="publications" element={<PublicationsPage />} />
              <Route path="publications/:id" element={<PublicationDetail />} />
              <Route path="not-found" element={<NotFound />} />
            </Route>

            {/* Admin Login (not protected) */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Protected Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="publications" element={<AdminPublications />} />
              <Route path="publications/new" element={<PublicationForm />} />
              <Route path="publications/:id/edit" element={<PublicationForm />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
            </Route>

              {/* Catch all - show 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SSEProvider>
        </AuthProvider>
      </BrowserRouter>
    </Theme>
  );
}

export default App;

// Made with Bob

/**
 * Admin Login Component
 * 
 * Provides login form for admin users with email and password authentication.
 * Uses Carbon Design System components for consistent UI.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Form,
  TextInput,
  Button,
  InlineNotification,
  Grid,
  Column,
} from '@carbon/react';
import { useAuth } from '../../contexts/AuthContext';
import './AdminLogin.scss';

/**
 * AdminLogin component
 * @returns {React.ReactElement} Login form
 */
const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, error: authError, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/admin/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  /**
   * Handle input change
   * @param {Event} e - Input change event
   */
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
    // Clear field error when user types
    if (errors[id]) {
      setErrors((prev) => ({
        ...prev,
        [id]: '',
      }));
    }
    // Clear login error
    if (loginError) {
      setLoginError('');
    }
  };

  /**
   * Validate form fields
   * @returns {boolean} True if form is valid
   */
  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setLoginError('');
    clearError();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login(formData.email, formData.password);
      // Navigation handled by useEffect when isAuthenticated changes
    } catch (err) {
      setLoginError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-login">
      <Grid>
        <Column sm={4} md={8} lg={16}>
          <div className="admin-login__container">
            <div className="admin-login__card">
              <div className="admin-login__header">
                <h1>Admin Login</h1>
                <p>Sign in to access the admin dashboard</p>
              </div>

              {(loginError || authError) && (
                <InlineNotification
                  kind="error"
                  title="Login Error"
                  subtitle={loginError || authError}
                  onCloseButtonClick={() => {
                    setLoginError('');
                    clearError();
                  }}
                  lowContrast
                />
              )}

              <Form onSubmit={handleSubmit} className="admin-login__form">
                <TextInput
                  id="email"
                  labelText="Email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  invalid={!!errors.email}
                  invalidText={errors.email}
                  disabled={isSubmitting}
                  autoComplete="email"
                  required
                />

                <TextInput
                  id="password"
                  type="password"
                  labelText="Password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  invalid={!!errors.password}
                  invalidText={errors.password}
                  disabled={isSubmitting}
                  autoComplete="current-password"
                  required
                />

                <Button
                  type="submit"
                  kind="primary"
                  disabled={isSubmitting}
                  className="admin-login__submit"
                >
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </Button>
              </Form>
            </div>
          </div>
        </Column>
      </Grid>
    </div>
  );
};

export default AdminLogin;

// Made with Bob
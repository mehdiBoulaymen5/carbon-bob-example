/**
 * NotFound Component
 * 
 * 404 page for handling not found routes.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, Column, Button } from '@carbon/react';
import { Home, ArrowLeft } from '@carbon/icons-react';
import './NotFound.scss';

/**
 * NotFound component
 * @returns {React.ReactElement} 404 page
 */
const NotFound = () => {
  const navigate = useNavigate();

  /**
   * Navigate to home page
   */
  const handleGoHome = () => {
    navigate('/');
  };

  /**
   * Navigate back
   */
  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="not-found">
      <Grid>
        <Column sm={4} md={8} lg={16}>
          <div className="not-found__content">
            <div className="not-found__code">404</div>
            <h1 className="not-found__title">Page Not Found</h1>
            <p className="not-found__message">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <div className="not-found__actions">
              <Button
                kind="primary"
                renderIcon={Home}
                onClick={handleGoHome}
              >
                Go to Home
              </Button>
              <Button
                kind="secondary"
                renderIcon={ArrowLeft}
                onClick={handleGoBack}
              >
                Go Back
              </Button>
            </div>
          </div>
        </Column>
      </Grid>
    </div>
  );
};

export default NotFound;

// Made with Bob
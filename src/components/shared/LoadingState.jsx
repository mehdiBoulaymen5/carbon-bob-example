/**
 * LoadingState Component
 * 
 * Reusable loading component with Carbon Loading spinner.
 */

import React from 'react';
import { Loading } from '@carbon/react';
import './LoadingState.scss';

/**
 * LoadingState component
 * @param {Object} props - Component props
 * @param {string} props.message - Loading message to display
 * @param {boolean} props.withOverlay - Whether to show overlay background
 * @param {boolean} props.small - Use small loading spinner
 * @returns {React.ReactElement} Loading state
 */
const LoadingState = ({ 
  message = 'Loading...', 
  withOverlay = false,
  small = false 
}) => {
  return (
    <div className={`loading-state ${withOverlay ? 'loading-state--overlay' : ''}`}>
      <Loading
        description={message}
        withOverlay={false}
        small={small}
      />
    </div>
  );
};

export default LoadingState;

// Made with Bob
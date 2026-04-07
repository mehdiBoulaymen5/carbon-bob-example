/**
 * Empty State Component
 * 
 * Reusable component for displaying empty states with optional action button.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@carbon/react';
import { DocumentBlank } from '@carbon/icons-react';
import './EmptyState.scss';

/**
 * EmptyState component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.icon - Icon to display (defaults to DocumentBlank)
 * @param {string} props.title - Title text
 * @param {string} props.message - Description message
 * @param {string} props.actionLabel - Label for action button
 * @param {Function} props.onAction - Action button click handler
 * @param {string} props.actionKind - Button kind (primary, secondary, etc.)
 * @returns {React.ReactElement} Empty state view
 */
const EmptyState = ({
  icon: Icon = DocumentBlank,
  title = 'No items found',
  message = 'There are no items to display.',
  actionLabel,
  onAction,
  actionKind = 'primary',
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state__content">
        <Icon size={64} className="empty-state__icon" />
        <h3 className="empty-state__title">{title}</h3>
        <p className="empty-state__message">{message}</p>
        {actionLabel && onAction && (
          <Button
            kind={actionKind}
            onClick={onAction}
            className="empty-state__action"
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

EmptyState.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string,
  message: PropTypes.string,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
  actionKind: PropTypes.string,
};

export default EmptyState;

// Made with Bob
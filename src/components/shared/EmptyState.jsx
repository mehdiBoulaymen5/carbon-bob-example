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
  action,
  secondaryAction,
}) => {
  const primaryActionLabel = action?.label ?? actionLabel;
  const primaryActionHandler = action?.onClick ?? onAction;
  const primaryActionKind = action?.kind ?? actionKind;

  return (
    <div className="empty-state">
      <div className="empty-state__content">
        <Icon size={64} className="empty-state__icon" />
        <h3 className="empty-state__title">{title}</h3>
        <p className="empty-state__message">{message}</p>
        {(primaryActionLabel && primaryActionHandler) || secondaryAction ? (
          <div className="empty-state__actions">
            {primaryActionLabel && primaryActionHandler && (
              <Button
                kind={primaryActionKind}
                onClick={primaryActionHandler}
                className="empty-state__action"
              >
                {primaryActionLabel}
              </Button>
            )}
            {secondaryAction?.label && secondaryAction?.onClick && (
              <Button
                kind={secondaryAction.kind ?? 'tertiary'}
                onClick={secondaryAction.onClick}
                className="empty-state__action"
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        ) : null}
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
  action: PropTypes.shape({
    label: PropTypes.string,
    onClick: PropTypes.func,
    kind: PropTypes.string,
  }),
  secondaryAction: PropTypes.shape({
    label: PropTypes.string,
    onClick: PropTypes.func,
    kind: PropTypes.string,
  }),
};

export default EmptyState;

// Made with Bob
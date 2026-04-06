/**
 * Delete Confirmation Modal Component
 * 
 * Reusable modal for confirming delete operations with warning message.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from '@carbon/react';

/**
 * DeleteConfirmModal component
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether modal is open
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onConfirm - Confirm delete handler
 * @param {string} props.title - Modal title
 * @param {string} props.itemName - Name of item being deleted
 * @param {boolean} props.loading - Whether delete is in progress
 * @param {boolean} props.isBulk - Whether this is a bulk delete
 * @param {number} props.count - Number of items for bulk delete
 * @returns {React.ReactElement} Delete confirmation modal
 */
const DeleteConfirmModal = ({
  open,
  onClose,
  onConfirm,
  title = 'Delete Use Case',
  itemName,
  loading = false,
  isBulk = false,
  count = 0,
}) => {
  const getMessage = () => {
    if (isBulk) {
      return `Are you sure you want to delete ${count} use case${count !== 1 ? 's' : ''}? This action cannot be undone.`;
    }
    return itemName
      ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
      : 'Are you sure you want to delete this use case? This action cannot be undone.';
  };

  return (
    <Modal
      open={open}
      onRequestClose={onClose}
      onRequestSubmit={onConfirm}
      modalHeading={title}
      primaryButtonText={loading ? 'Deleting...' : 'Delete'}
      secondaryButtonText="Cancel"
      danger
      primaryButtonDisabled={loading}
    >
      <p>{getMessage()}</p>
    </Modal>
  );
};

DeleteConfirmModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  itemName: PropTypes.string,
  loading: PropTypes.bool,
  isBulk: PropTypes.bool,
  count: PropTypes.number,
};

export default DeleteConfirmModal;

// Made with Bob
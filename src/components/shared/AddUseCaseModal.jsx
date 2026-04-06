/**
 * Add Use Case Modal Component
 *
 * Modal form for creating new publications/use cases.
 * Handles form validation, submission, and authentication flow.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Modal,
  TextInput,
  TextArea,
  Select,
  SelectItem,
  InlineNotification,
  InlineLoading,
  Checkbox,
  CheckboxGroup,
} from '@carbon/react';
import { useAuth } from '../../contexts/AuthContext';
import publicationService from '../../services/publication.service';
import './AddUseCaseModal.scss';

// Predefined options for multi-select fields
const TOPIC_OPTIONS = [
  'AI', 'Machine Learning', 'Code Generation', 'Data Analysis',
  'Automation', 'Testing', 'Documentation', 'Security', 'DevOps', 'General'
];

const AUDIENCE_OPTIONS = [
  'Developers', 'Data Scientists', 'DevOps Engineers', 'QA Engineers',
  'Product Managers', 'Business Analysts', 'Students', 'Researchers', 'General'
];

const INDUSTRY_OPTIONS = [
  'Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing',
  'Education', 'Government', 'Media', 'Telecommunications', 'General'
];

/**
 * AddUseCaseModal component
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether modal is open
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onSuccess - Success callback
 * @returns {React.ReactElement} Add use case modal
 */
const AddUseCaseModal = ({ open, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    topics: [],
    audience: [],
    industries: [],
    gitSource: '',
    boxSource: '',
    owners: '',
    icon: 'Code',
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  /**
   * Handle input change
   * @param {Event} e - Input event
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  /**
   * Handle checkbox change for multi-select fields
   * @param {string} field - Field name (topics, audience, industries)
   * @param {string} value - Checkbox value
   * @param {boolean} checked - Whether checkbox is checked
   */
  const handleCheckboxChange = (field, value, checked) => {
    setFormData((prev) => {
      const currentValues = prev[field] || [];
      const newValues = checked
        ? [...currentValues, value]
        : currentValues.filter((v) => v !== value);
      return { ...prev, [field]: newValues };
    });
  };

  /**
   * Validate form data
   * @returns {boolean} Whether form is valid
   */
  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Parse comma-separated string to array
   * @param {string} str - Comma-separated string
   * @returns {Array} Array of trimmed strings
   */
  const parseArray = (str) => {
    if (!str) return [];
    return str
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Ensure arrays have at least one item for backend validation
      const topicsArray = formData.topics.length > 0 ? formData.topics : ['General'];
      const audienceArray = formData.audience.length > 0 ? formData.audience : ['General'];
      const industriesArray = formData.industries.length > 0 ? formData.industries : ['General'];
      const ownersArray = parseArray(formData.owners);

      const submitData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        topics: topicsArray,
        audience: audienceArray,
        industries: industriesArray,
        icon: formData.icon,
        gitSource: formData.gitSource.trim() || null,
        boxSource: formData.boxSource.trim() || null,
        owners: ownersArray.length > 0 ? ownersArray : null,
      };

      // Use the new createUseCase endpoint (auto-publishes)
      await publicationService.createUseCase(submitData);

      // Reset form
      setFormData({
        title: '',
        description: '',
        topics: [],
        audience: [],
        industries: [],
        gitSource: '',
        boxSource: '',
        owners: '',
        icon: 'Code',
      });

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Navigate to catalog page to see the new use case
      navigate('/');
      
      // Close modal
      onClose();
    } catch (err) {
      console.error('Failed to create use case:', err);
      setError(err.message || 'Failed to create use case. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (!loading) {
      // Reset form and errors
      setFormData({
        title: '',
        description: '',
        topics: [],
        audience: [],
        industries: [],
        gitSource: '',
        boxSource: '',
        owners: '',
        icon: 'Code',
      });
      setValidationErrors({});
      setError(null);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onRequestClose={handleClose}
      onRequestSubmit={handleSubmit}
      modalHeading="Add Use Case"
      primaryButtonText={loading ? 'Creating...' : 'Create Use Case'}
      secondaryButtonText="Cancel"
      primaryButtonDisabled={loading}
      size="md"
    >
      <div className="add-use-case-modal">
        {error && (
          <InlineNotification
            kind="error"
            title="Error"
            subtitle={error}
            lowContrast
            onCloseButtonClick={() => setError(null)}
            style={{ marginBottom: '1rem' }}
          />
        )}

        {loading && (
          <InlineLoading
            description="Creating use case..."
            status="active"
            style={{ marginBottom: '1rem' }}
          />
        )}

        <TextInput
          id="title"
          name="title"
          labelText="Title"
          placeholder="Enter use case title"
          value={formData.title}
          onChange={handleInputChange}
          invalid={!!validationErrors.title}
          invalidText={validationErrors.title}
          disabled={loading}
          required
        />

        <TextArea
          id="description"
          name="description"
          labelText="Description"
          placeholder="Describe the use case and its benefits"
          value={formData.description}
          onChange={handleInputChange}
          invalid={!!validationErrors.description}
          invalidText={validationErrors.description}
          rows={4}
          disabled={loading}
          required
        />

        <fieldset className="add-use-case-modal__fieldset">
          <legend className="add-use-case-modal__legend">Topics (optional)</legend>
          <CheckboxGroup legendText="">
            {TOPIC_OPTIONS.map((topic) => (
              <Checkbox
                key={topic}
                id={`topic-${topic}`}
                labelText={topic}
                checked={formData.topics.includes(topic)}
                onChange={(e) => handleCheckboxChange('topics', topic, e.target.checked)}
                disabled={loading}
              />
            ))}
          </CheckboxGroup>
        </fieldset>

        <fieldset className="add-use-case-modal__fieldset">
          <legend className="add-use-case-modal__legend">Target Audience (optional)</legend>
          <CheckboxGroup legendText="">
            {AUDIENCE_OPTIONS.map((audience) => (
              <Checkbox
                key={audience}
                id={`audience-${audience}`}
                labelText={audience}
                checked={formData.audience.includes(audience)}
                onChange={(e) => handleCheckboxChange('audience', audience, e.target.checked)}
                disabled={loading}
              />
            ))}
          </CheckboxGroup>
        </fieldset>

        <fieldset className="add-use-case-modal__fieldset">
          <legend className="add-use-case-modal__legend">Industries (optional)</legend>
          <CheckboxGroup legendText="">
            {INDUSTRY_OPTIONS.map((industry) => (
              <Checkbox
                key={industry}
                id={`industry-${industry}`}
                labelText={industry}
                checked={formData.industries.includes(industry)}
                onChange={(e) => handleCheckboxChange('industries', industry, e.target.checked)}
                disabled={loading}
              />
            ))}
          </CheckboxGroup>
        </fieldset>

        <TextInput
          id="gitSource"
          name="gitSource"
          labelText="GitHub URL (optional)"
          placeholder="https://github.com/..."
          value={formData.gitSource}
          onChange={handleInputChange}
          helperText="Link to GitHub repository"
          disabled={loading}
        />

        <TextInput
          id="boxSource"
          name="boxSource"
          labelText="Box URL (optional)"
          placeholder="https://box.com/..."
          value={formData.boxSource}
          onChange={handleInputChange}
          helperText="Link to Box.com resource"
          disabled={loading}
        />

        <TextInput
          id="owners"
          name="owners"
          labelText="Owners (optional)"
          placeholder="john.doe@example.com, jane.smith@example.com"
          value={formData.owners}
          onChange={handleInputChange}
          helperText="Enter owner emails separated by commas"
          disabled={loading}
        />

        <Select
          id="icon"
          name="icon"
          labelText="Icon"
          value={formData.icon}
          onChange={handleInputChange}
          disabled={loading}
        >
          <SelectItem value="Code" text="Code" />
          <SelectItem value="DataBase" text="Database" />
          <SelectItem value="ChartLine" text="Chart" />
          <SelectItem value="Chat" text="Chat" />
          <SelectItem value="CloudApp" text="Cloud" />
          <SelectItem value="Security" text="Security" />
          <SelectItem value="Analytics" text="Analytics" />
          <SelectItem value="Api" text="API" />
        </Select>

      </div>
    </Modal>
  );
};

export default AddUseCaseModal;

// Made with Bob
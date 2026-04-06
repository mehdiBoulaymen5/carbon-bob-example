/**
 * Publication Form Component
 *
 * Multi-step form for creating and editing use cases backed by publications.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Grid,
  Column,
  Form,
  TextInput,
  TextArea,
  Select,
  SelectItem,
  Button,
  ProgressIndicator,
  ProgressStep,
  InlineNotification,
  Loading,
  Modal,
  Checkbox,
  CheckboxGroup,
} from '@carbon/react';
import publicationService from '../../services/publication.service';
import './PublicationForm.scss';

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
 * PublicationForm component
 * @returns {React.ReactElement} Use case form
 */
const PublicationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  // Form state
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Form data
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
    status: 'draft',
  });

  // Validation errors
  const [validationErrors, setValidationErrors] = useState({});

  /**
   * Load publication data for editing
   */
  useEffect(() => {
    if (isEditMode) {
      loadPublication();
    }
  }, [id, isEditMode]);

  /**
   * Load publication data
   */
  const loadPublication = async () => {
    try {
      setInitialLoading(true);
      const data = await publicationService.getPublicationById(id);
      
      setFormData({
        title: data.title || '',
        description: data.description || '',
        topics: Array.isArray(data.topics) ? data.topics : [],
        audience: Array.isArray(data.audience) ? data.audience : [],
        industries: Array.isArray(data.industries) ? data.industries : [],
        gitSource: data.git_source || '',
        boxSource: data.box_source || '',
        owners: Array.isArray(data.owners) ? data.owners.join(', ') : '',
        icon: data.icon || 'Code',
        status: data.status || 'draft',
      });
    } catch (err) {
      console.error('Failed to load use case:', err);
      setError(err.message || 'Failed to load use case');
    } finally {
      setInitialLoading(false);
    }
  };

  /**
   * Handle input change
   * @param {Event} e - Input event
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setHasUnsavedChanges(true);
    
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
    setHasUnsavedChanges(true);
  };

  /**
   * Validate current step
   * @returns {boolean} Whether step is valid
   */
  const validateStep = () => {
    const errors = {};

    if (currentStep === 0) {
      // Step 1: Basic Info
      if (!formData.title.trim()) {
        errors.title = 'Title is required';
      }
      if (!formData.description.trim()) {
        errors.description = 'Description is required';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle next step
   */
  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 2));
    }
  };

  /**
   * Handle previous step
   */
  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
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
   * @param {boolean} publish - Whether to publish or save as draft
   */
  const handleSubmit = async (publish = false) => {
    if (!validateStep()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

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
        gitSource: formData.gitSource.trim() || null,
        boxSource: formData.boxSource.trim() || null,
        owners: ownersArray.length > 0 ? ownersArray : null,
        icon: formData.icon,
        status: publish ? 'published' : formData.status,
      };

      if (isEditMode) {
        await publicationService.updatePublication(id, submitData);
      } else {
        await publicationService.createPublication(submitData);
      }

      setSuccess(true);
      setHasUnsavedChanges(false);
      
      // Redirect after short delay
      setTimeout(() => {
        navigate('/admin/publications');
      }, 1500);
    } catch (err) {
      console.error('Failed to save use case:', err);
      setError(err.message || 'Failed to save use case');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowCancelModal(true);
    } else {
      navigate('/admin/publications');
    }
  };

  /**
   * Confirm cancel
   */
  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    navigate('/admin/publications');
  };

  if (initialLoading) {
    return (
      <div className="publication-form">
        <Grid>
          <Column sm={4} md={8} lg={16}>
            <Loading description="Loading use case..." withOverlay={false} />
          </Column>
        </Grid>
      </div>
    );
  }

  return (
    <div className="publication-form">
      <Grid>
        <Column sm={4} md={8} lg={12}>
          <h1 className="publication-form__title">
            {isEditMode ? 'Edit Use Case' : 'Create Use Case'}
          </h1>

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

          {success && (
            <InlineNotification
              kind="success"
              title="Success"
              subtitle={`Use case ${isEditMode ? 'updated' : 'created'} successfully`}
              lowContrast
              hideCloseButton
              style={{ marginBottom: '1rem' }}
            />
          )}

          <ProgressIndicator currentIndex={currentStep} spaceEqually>
            <ProgressStep label="Basic Info" description="Title and description" />
            <ProgressStep label="Details" description="Topics and metadata" />
            <ProgressStep label="Sources" description="Links and visibility" />
          </ProgressIndicator>

          <Form className="publication-form__form">
            {/* Step 1: Basic Info */}
            {currentStep === 0 && (
              <div className="publication-form__step">
                <TextInput
                  id="title"
                  name="title"
                  labelText="Title"
                  placeholder="Enter use case title"
                  value={formData.title}
                  onChange={handleInputChange}
                  invalid={!!validationErrors.title}
                  invalidText={validationErrors.title}
                  required
                />

                <TextArea
                  id="description"
                  name="description"
                  labelText="Description"
                  placeholder="Enter use case description"
                  value={formData.description}
                  onChange={handleInputChange}
                  invalid={!!validationErrors.description}
                  invalidText={validationErrors.description}
                  rows={6}
                  required
                />
              </div>
            )}

            {/* Step 2: Details */}
            {currentStep === 1 && (
              <div className="publication-form__step">
                <fieldset className="publication-form__fieldset">
                  <legend className="publication-form__legend">Topics</legend>
                  <CheckboxGroup legendText="">
                    {TOPIC_OPTIONS.map((topic) => (
                      <Checkbox
                        key={topic}
                        id={`topic-${topic}`}
                        labelText={topic}
                        checked={formData.topics.includes(topic)}
                        onChange={(e) => handleCheckboxChange('topics', topic, e.target.checked)}
                      />
                    ))}
                  </CheckboxGroup>
                </fieldset>

                <fieldset className="publication-form__fieldset">
                  <legend className="publication-form__legend">Target Audience</legend>
                  <CheckboxGroup legendText="">
                    {AUDIENCE_OPTIONS.map((audience) => (
                      <Checkbox
                        key={audience}
                        id={`audience-${audience}`}
                        labelText={audience}
                        checked={formData.audience.includes(audience)}
                        onChange={(e) => handleCheckboxChange('audience', audience, e.target.checked)}
                      />
                    ))}
                  </CheckboxGroup>
                </fieldset>

                <fieldset className="publication-form__fieldset">
                  <legend className="publication-form__legend">Industries</legend>
                  <CheckboxGroup legendText="">
                    {INDUSTRY_OPTIONS.map((industry) => (
                      <Checkbox
                        key={industry}
                        id={`industry-${industry}`}
                        labelText={industry}
                        checked={formData.industries.includes(industry)}
                        onChange={(e) => handleCheckboxChange('industries', industry, e.target.checked)}
                      />
                    ))}
                  </CheckboxGroup>
                </fieldset>

                <TextInput
                  id="icon"
                  name="icon"
                  labelText="Icon"
                  placeholder="Code"
                  value={formData.icon}
                  onChange={handleInputChange}
                  helperText="Carbon icon name"
                />
              </div>
            )}

            {/* Step 3: Sources */}
            {currentStep === 2 && (
              <div className="publication-form__step">
                <TextInput
                  id="gitSource"
                  name="gitSource"
                  labelText="GitHub URL"
                  placeholder="https://github.com/..."
                  value={formData.gitSource}
                  onChange={handleInputChange}
                  helperText="Optional GitHub repository URL"
                />

                <TextInput
                  id="boxSource"
                  name="boxSource"
                  labelText="Box URL"
                  placeholder="https://box.com/..."
                  value={formData.boxSource}
                  onChange={handleInputChange}
                  helperText="Optional Box.com URL"
                />

                <TextInput
                  id="owners"
                  name="owners"
                  labelText="Owners"
                  placeholder="john.doe@example.com, jane.smith@example.com"
                  value={formData.owners}
                  onChange={handleInputChange}
                  helperText="Enter owner emails separated by commas"
                />

                <Select
                  id="status"
                  name="status"
                  labelText="Status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <SelectItem value="draft" text="Draft" />
                  <SelectItem value="published" text="Published" />
                </Select>
              </div>
            )}

            {/* Form Actions */}
            <div className="publication-form__actions">
              <Button
                kind="secondary"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>

              {currentStep > 0 && (
                <Button
                  kind="secondary"
                  onClick={handlePrevious}
                  disabled={loading}
                >
                  Previous
                </Button>
              )}

              {currentStep < 2 ? (
                <Button
                  kind="primary"
                  onClick={handleNext}
                  disabled={loading}
                >
                  Next
                </Button>
              ) : (
                <>
                  <Button
                    kind="secondary"
                    onClick={() => handleSubmit(false)}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save as Draft'}
                  </Button>
                  <Button
                    kind="primary"
                    onClick={() => handleSubmit(true)}
                    disabled={loading}
                  >
                    {loading ? 'Publishing...' : 'Publish'}
                  </Button>
                </>
              )}
            </div>
          </Form>
        </Column>
      </Grid>

      {/* Cancel Confirmation Modal */}
      <Modal
        open={showCancelModal}
        onRequestClose={() => setShowCancelModal(false)}
        onRequestSubmit={handleConfirmCancel}
        modalHeading="Unsaved Changes"
        primaryButtonText="Discard Changes"
        secondaryButtonText="Continue Editing"
        danger
      >
        <p>You have unsaved changes. Are you sure you want to leave?</p>
      </Modal>
    </div>
  );
};

export default PublicationForm;

// Made with Bob
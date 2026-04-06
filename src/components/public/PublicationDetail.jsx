/**
 * PublicationDetail Component
 * 
 * Detailed view of a single publication with full information.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Grid,
  Column,
  Breadcrumb,
  BreadcrumbItem,
  Tag,
  Link,
  Button,
  SkeletonText,
  SkeletonPlaceholder
} from '@carbon/react';
import { ArrowLeft, Launch } from '@carbon/icons-react';
import publicationService from '../../services/publication.service';
import PublicationCard from './PublicationCard';
import './PublicationDetail.scss';

/**
 * PublicationDetail component
 * @returns {React.ReactElement} Publication detail view
 */
const PublicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [publication, setPublication] = useState(null);
  const [relatedPublications, setRelatedPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fromCatalog = useRef(location.state?.fromCatalog || false);

  /**
   * Fetch publication details
   */
  const fetchPublication = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await publicationService.getPublicPublicationById(id);
      setPublication(response.publication);
      setRelatedPublications(response.related || []);

      // Update page title
      if (response.publication) {
        document.title = `${response.publication.title} | Bob Demo Catalog`;
      }
    } catch (err) {
      console.error('Error fetching publication:', err);
      setError(err.message || 'Failed to load publication');
      
      // Redirect to 404 if publication not found
      if (err.status === 404) {
        navigate('/not-found', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublication();
  }, [id]);

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    // Check if user came from catalog (home page) or publications page
    // Default to publications page for backward compatibility
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/publications');
    }
  };

  /**
   * Render loading skeleton
   */
  const renderLoadingSkeleton = () => (
    <div className="publication-detail__loading">
      <Grid>
        <Column sm={4} md={8} lg={16}>
          <SkeletonText heading width="60%" />
          <SkeletonText paragraph lineCount={3} />
          <div style={{ marginTop: '2rem' }}>
            <SkeletonPlaceholder style={{ width: '100%', height: '200px' }} />
          </div>
        </Column>
      </Grid>
    </div>
  );

  if (loading) {
    return renderLoadingSkeleton();
  }

  if (error || !publication) {
    return (
      <Grid>
        <Column sm={4} md={8} lg={16}>
          <div className="publication-detail__error">
            <h2>Publication Not Found</h2>
            <p>{error || 'The requested publication could not be found.'}</p>
            <Button onClick={handleBack}>Back to Publications</Button>
          </div>
        </Column>
      </Grid>
    );
  }

  return (
    <div className="publication-detail">
      <Grid>
        <Column sm={4} md={8} lg={16}>
          <Breadcrumb noTrailingSlash>
            <BreadcrumbItem href="/">Home</BreadcrumbItem>
            {!fromCatalog.current && (
              <BreadcrumbItem href="/publications">Publications</BreadcrumbItem>
            )}
            <BreadcrumbItem isCurrentPage>{publication.title}</BreadcrumbItem>
          </Breadcrumb>
        </Column>
      </Grid>

      <Grid>
        <Column sm={4} md={8} lg={16}>
          <Button
            kind="ghost"
            renderIcon={ArrowLeft}
            onClick={handleBack}
            className="publication-detail__back-button"
          >
            {fromCatalog.current ? 'Back to Use Cases' : 'Back to Publications'}
          </Button>
        </Column>
      </Grid>

      <Grid>
        <Column sm={4} md={8} lg={12}>
          <div className="publication-detail__header">
            <h1 className="publication-detail__title">{publication.title}</h1>
            
            {publication.topics && publication.topics.length > 0 && (
              <div className="publication-detail__topics">
                {publication.topics.map((topic, index) => (
                  <Tag key={index} type="blue" size="md">
                    {topic}
                  </Tag>
                ))}
              </div>
            )}
          </div>

          <div className="publication-detail__content">
            <section className="publication-detail__section">
              <h2 className="publication-detail__section-title">Description</h2>
              <p className="publication-detail__description">
                {publication.description}
              </p>
            </section>

            {publication.audience && publication.audience.length > 0 && (
              <section className="publication-detail__section">
                <h2 className="publication-detail__section-title">Target Audience</h2>
                <div className="publication-detail__tags">
                  {publication.audience.map((aud, index) => (
                    <Tag key={index} type="outline" size="md">
                      {aud}
                    </Tag>
                  ))}
                </div>
              </section>
            )}

            {publication.industries && publication.industries.length > 0 && (
              <section className="publication-detail__section">
                <h2 className="publication-detail__section-title">Industries</h2>
                <div className="publication-detail__tags">
                  {publication.industries.map((industry, index) => (
                    <Tag key={index} type="outline" size="md">
                      {industry}
                    </Tag>
                  ))}
                </div>
              </section>
            )}

            {publication.owners && publication.owners.length > 0 && (
              <section className="publication-detail__section">
                <h2 className="publication-detail__section-title">Owners</h2>
                <div className="publication-detail__tags">
                  {publication.owners.map((owner, index) => (
                    <Tag key={index} type="purple" size="md">
                      {owner}
                    </Tag>
                  ))}
                </div>
              </section>
            )}

            {(publication.git_source || publication.box_source) && (
              <section className="publication-detail__section">
                <h2 className="publication-detail__section-title">Resources</h2>
                <div className="publication-detail__links">
                  {publication.git_source && (
                    <Link
                      href={publication.git_source}
                      target="_blank"
                      rel="noopener noreferrer"
                      renderIcon={Launch}
                    >
                      View on GitHub
                    </Link>
                  )}
                  {publication.box_source && (
                    <Link
                      href={publication.box_source}
                      target="_blank"
                      rel="noopener noreferrer"
                      renderIcon={Launch}
                    >
                      View on Box
                    </Link>
                  )}
                </div>
              </section>
            )}

            <section className="publication-detail__section">
              <h2 className="publication-detail__section-title">Publication Info</h2>
              <dl className="publication-detail__metadata">
                <div className="publication-detail__metadata-item">
                  <dt>Published</dt>
                  <dd>{formatDate(publication.created_at)}</dd>
                </div>
                {publication.updated_at && publication.updated_at !== publication.created_at && (
                  <div className="publication-detail__metadata-item">
                    <dt>Last Updated</dt>
                    <dd>{formatDate(publication.updated_at)}</dd>
                  </div>
                )}
              </dl>
            </section>
          </div>
        </Column>
      </Grid>

      {relatedPublications && relatedPublications.length > 0 && (
        <>
          <Grid>
            <Column sm={4} md={8} lg={16}>
              <h2 className="publication-detail__related-title">
                Related Publications
              </h2>
            </Column>
          </Grid>

          <Grid className="publication-detail__related-grid">
            {relatedPublications.slice(0, 3).map((related) => (
              <Column key={related.id} sm={4} md={4} lg={5}>
                <PublicationCard publication={related} />
              </Column>
            ))}
          </Grid>
        </>
      )}
    </div>
  );
};

export default PublicationDetail;

// Made with Bob
/**
 * Home Component
 * 
 * Public home page with hero section, all publications (use cases), and demo catalog.
 * Features real-time updates via Server-Sent Events.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, Column, Button, SkeletonPlaceholder, InlineNotification } from '@carbon/react';
import { ArrowRight, Renew } from '@carbon/icons-react';
import publicationService from '../../services/publication.service';
import PublicationCard from './PublicationCard';
import DemoCatalog from '../DemoCatalog';
import { useSSE } from '../../contexts/SSEContext';
import { setPageSEO } from '../../utils/seo';
import './Home.scss';

/**
 * Home component
 * @returns {React.ReactElement} Home page view
 */
const Home = () => {
  const navigate = useNavigate();
  const { subscribe } = useSSE();
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPublicationAlert, setNewPublicationAlert] = useState(false);

  /**
   * Fetch all publications (use cases)
   */
  const fetchPublications = async () => {
    try {
      setLoading(true);
      // Fetch all publications (no limit)
      const response = await publicationService.getPublicPublications(1, 100);
      setPublications(response.publications || []);
      setNewPublicationAlert(false);
    } catch (error) {
      console.error('Error fetching publications:', error);
      setPublications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublications();
    
    // Set page SEO
    setPageSEO({
      title: 'Home - Use Cases',
      description: 'Explore all IBM Bob use cases, demonstrations and examples',
      keywords: ['IBM', 'Bob', 'Use Cases', 'Demo', 'Catalog', 'AI', 'Demonstrations']
    });

    // Subscribe to real-time publication updates
    const unsubscribeCreated = subscribe('publication:created', (data) => {
      console.log('New publication created:', data);
      setNewPublicationAlert(true);
    });

    const unsubscribeUpdated = subscribe('publication:updated', (data) => {
      console.log('Publication updated:', data);
      fetchPublications();
    });

    const unsubscribeDeleted = subscribe('publication:deleted', (data) => {
      console.log('Publication deleted:', data);
      fetchPublications();
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, [subscribe]);

  /**
   * Navigate to publications page
   */
  const handleViewAllPublications = () => {
    navigate('/publications');
  };

  /**
   * Refresh publications list
   */
  const handleRefresh = () => {
    fetchPublications();
  };

  return (
    <div className="home">
      {/* Hero Section */}
      <Grid className="home__hero">
        <Column sm={4} md={8} lg={12}>
          <div className="home__hero-content">
            <h1 className="home__hero-title">Bob Demo Catalog</h1>
            <p className="home__hero-subtitle">
              Explore our collection of IBM Bob use cases, demonstrations and examples. 
              Discover how Bob can help you with code generation, data analysis, 
              AI chat integration, and more.
            </p>
            <div className="home__hero-actions">
              <Button
                kind="primary"
                size="lg"
                renderIcon={ArrowRight}
                onClick={handleViewAllPublications}
              >
                Browse All Use Cases
              </Button>
            </div>
          </div>
        </Column>
      </Grid>

      {/* New Publication Alert */}
      {newPublicationAlert && (
        <Grid>
          <Column sm={4} md={8} lg={16}>
            <InlineNotification
              kind="info"
              title="New use case available!"
              subtitle="Click refresh to see the latest additions"
              lowContrast
              hideCloseButton={false}
              onCloseButtonClick={() => setNewPublicationAlert(false)}
              actionButtonLabel="Refresh"
              onActionButtonClick={handleRefresh}
            />
          </Column>
        </Grid>
      )}

      {/* All Use Cases Section */}
      <Grid>
        <Column sm={4} md={8} lg={16}>
          <div className="home__section-header">
            <h2 className="home__section-title">
              All Use Cases {publications.length > 0 && `(${publications.length})`}
            </h2>
            <Button
              kind="ghost"
              renderIcon={Renew}
              onClick={handleRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        </Column>
      </Grid>

      {/* Loading State */}
      {loading && (
        <Grid className="home__featured-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Column key={i} sm={4} md={4} lg={5}>
              <SkeletonPlaceholder style={{ height: '300px', width: '100%' }} />
            </Column>
          ))}
        </Grid>
      )}

      {/* Publications Grid */}
      {!loading && publications.length > 0 && (
        <Grid className="home__featured-grid">
          {publications.map((publication) => (
            <Column key={publication.id} sm={4} md={4} lg={5}>
              <PublicationCard publication={publication} />
            </Column>
          ))}
        </Grid>
      )}

      {/* Empty State */}
      {!loading && publications.length === 0 && (
        <Grid>
          <Column sm={4} md={8} lg={16}>
            <div className="home__empty-state">
              <h3>No use cases available yet</h3>
              <p>Check back soon for new demonstrations and examples!</p>
            </div>
          </Column>
        </Grid>
      )}

      {/* Demo Catalog Section */}
      <Grid>
        <Column sm={4} md={8} lg={16}>
          <div className="home__section-header">
            <h2 className="home__section-title">Demo Catalog</h2>
          </div>
        </Column>
      </Grid>
      
      <DemoCatalog />
    </div>
  );
};

export default Home;

// Made with Bob
/**
 * Home Component
 * 
 * Public home page with hero section, all publications (use cases), and demo catalog.
 * Features real-time updates via Server-Sent Events.
 */

import React, { useState, useEffect } from 'react';
import { Grid, Column, Button, SkeletonPlaceholder, InlineNotification, Tag } from '@carbon/react';
import { Add, Renew } from '@carbon/icons-react';
import publicationService from '../../services/publication.service';
import PublicationCard from './PublicationCard';
import PublicationFilters from './PublicationFilters';
import EmptyState from '../shared/EmptyState';
import AddUseCaseModal from '../shared/AddUseCaseModal';
import { useSSE } from '../../contexts/SSEContext';
import { setPageSEO } from '../../utils/seo';
import './Home.scss';

/**
 * Home component
 * @returns {React.ReactElement} Home page view
 */
const Home = () => {
  const { subscribe } = useSSE();
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [topicOptions, setTopicOptions] = useState([]);
  const [newPublicationAlert, setNewPublicationAlert] = useState(false);
  const [isAddUseCaseModalOpen, setIsAddUseCaseModalOpen] = useState(false);

  /**
   * Sort publications based on selected option
   * @param {Array} pubs - Publications to sort
   * @param {string} sort - Sort option
   * @returns {Array} Sorted publications
   */
  const sortPublications = (pubs, sort) => {
    const sorted = [...pubs];

    switch (sort) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'title-asc':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'title-desc':
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return sorted;
    }
  };

  /**
   * Extract unique topics from publications
   * @param {Array} pubs - Publications array
   */
  const extractTopics = (pubs) => {
    const topicsSet = new Set();

    pubs.forEach((pub) => {
      if (pub.topics && Array.isArray(pub.topics)) {
        pub.topics.forEach((topic) => topicsSet.add(topic));
      }
    });

    const topics = Array.from(topicsSet)
      .sort()
      .map((topic) => ({ id: topic, label: topic }));

    setTopicOptions(topics);
  };

  /**
   * Fetch home-page discovery results
   */
  const fetchPublications = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await publicationService.getPublicPublications(
        1,
        100,
        searchQuery,
        selectedTopic
      );

      const pubs = sortPublications(response.publications || [], sortBy);
      setPublications(pubs);
      extractTopics(response.publications || []);
      setNewPublicationAlert(false);
    } catch (fetchError) {
      console.error('Error fetching publications:', fetchError);
      setError(fetchError.message || 'Failed to load use cases');
      setPublications([]);
      setTopicOptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set page SEO
    setPageSEO({
      title: 'Home - Use Cases',
      description: 'Explore all IBM Bob use cases, demonstrations and examples',
      keywords: ['IBM', 'Bob', 'Use Cases', 'Demo', 'Catalog', 'AI', 'Demonstrations']
    });
  }, []);

  useEffect(() => {
    fetchPublications();
  }, [searchQuery, selectedTopic, sortBy]);

  useEffect(() => {
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
  }, [subscribe, searchQuery, selectedTopic, sortBy]);

  /**
   * Open add use case modal
   */
  const handleOpenAddUseCaseModal = () => {
    setIsAddUseCaseModalOpen(true);
  };

  /**
   * Close add use case modal
   */
  const handleCloseAddUseCaseModal = () => {
    setIsAddUseCaseModalOpen(false);
  };

  /**
   * Handle search change
   * @param {string} query - Search query
   */
  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  /**
   * Handle topic change
   * @param {string} topic - Selected topic
   */
  const handleTopicChange = (topic) => {
    setSelectedTopic(topic);
  };

  /**
   * Handle sort change
   * @param {string} sort - Sort option
   */
  const handleSortChange = (sort) => {
    setSortBy(sort);
  };

  /**
   * Clear active filters
   */
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedTopic('');
    setSortBy('newest');
  };

  /**
   * Check whether discovery filters are active
   * @returns {boolean}
   */
  const hasActiveFilters = () => searchQuery !== '' || selectedTopic !== '';

  /**
   * Refresh publications list
   */
  const handleRefresh = () => {
    fetchPublications();
  };

  return (
    <div className="home">
      <AddUseCaseModal
        open={isAddUseCaseModalOpen}
        onClose={handleCloseAddUseCaseModal}
        onSuccess={fetchPublications}
      />
      {/* Hero Section */}
      <Grid className="home__hero">
        <Column sm={4} md={8} lg={10}>
          <div className="home__hero-content">
            <div className="home__hero-eyebrow">
              <Tag type="cool-gray">IBM Bob</Tag>
              <span>Use case library</span>
            </div>
            <h1 className="home__hero-title">Discover proven Bob use cases faster</h1>
            <p className="home__hero-subtitle">
              Explore practical demos, reusable implementation ideas, and real examples for
              code generation, AI-assisted workflows, data analysis, automation, and more.
            </p>
            <ul className="home__hero-highlights" aria-label="Catalog highlights">
              <li>Browse published use cases by topic and audience</li>
              <li>Open full details to understand the implementation approach</li>
              <li>Contribute new use cases directly from the catalog</li>
            </ul>
            <div className="home__hero-actions">
              <Button
                kind="primary"
                size="lg"
                renderIcon={Add}
                onClick={handleOpenAddUseCaseModal}
              >
                Add new use case
              </Button>
            </div>
          </div>
        </Column>
        <Column sm={4} md={8} lg={6}>
          <div className="home__hero-summary">
            <div className="home__hero-stat">
              <span className="home__hero-stat-value">{loading ? '—' : publications.length}</span>
              <span className="home__hero-stat-label">Published use cases</span>
            </div>
            <div className="home__hero-stat">
              <span className="home__hero-stat-value">Live</span>
              <span className="home__hero-stat-label">Catalog updates and submissions</span>
            </div>
            <div className="home__hero-stat">
              <span className="home__hero-stat-value">Fast</span>
              <span className="home__hero-stat-label">Search, filtering, and detail views</span>
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
              title="New use case available"
              subtitle="Refresh the catalog sections to see the latest published addition."
              lowContrast
              hideCloseButton={false}
              onCloseButtonClick={() => setNewPublicationAlert(false)}
              actionButtonLabel="Refresh now"
              onActionButtonClick={handleRefresh}
            />
          </Column>
        </Grid>
      )}

      {/* Inline Discovery Section */}
      <Grid>
        <Column sm={4} md={8} lg={16}>
          <div className="home__section-header home__section-header--catalog">
            <div>
              <p className="home__section-kicker">Discover</p>
              <h2 className="catalog-title">
                Search and filter demo content {publications.length > 0 && `(${publications.length})`}
              </h2>
              <p className="home__section-description">
                Search by title or description, filter by topic, and open results immediately from the landing page.
              </p>
            </div>
            <div className="home__section-actions">
              <Button
                kind="ghost"
                renderIcon={Renew}
                onClick={handleRefresh}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>
          </div>
        </Column>
      </Grid>

      <div className="home__filters">
        <PublicationFilters
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          selectedTopic={selectedTopic}
          onTopicChange={handleTopicChange}
          topicOptions={topicOptions}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters()}
        />
      </div>

      {error && (
        <Grid>
          <Column sm={4} md={8} lg={16}>
            <EmptyState
              title="We couldn’t load the home-page results"
              message={error}
              action={{
                label: 'Try Again',
                onClick: fetchPublications
              }}
              secondaryAction={{
                label: 'Open browse page',
                onClick: handleViewAllPublications
              }}
            />
          </Column>
        </Grid>
      )}

      {/* Loading State */}
      {!error && loading && (
        <Grid className="home__results-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Column key={i} sm={4} md={4} lg={4}>
              <SkeletonPlaceholder style={{ height: '300px', width: '100%' }} />
            </Column>
          ))}
        </Grid>
      )}

      {/* Results Grid */}
      {!error && !loading && publications.length > 0 && (
        <Grid className="home__results-grid">
          {publications.map((publication) => (
            <Column key={publication.id} sm={4} md={4} lg={4}>
              <PublicationCard publication={publication} />
            </Column>
          ))}
        </Grid>
      )}

      {/* Empty State */}
      {!error && !loading && publications.length === 0 && (
        <Grid>
          <Column sm={4} md={8} lg={16}>
            <EmptyState
              title={hasActiveFilters() ? 'No matching use cases found' : 'No published use cases yet'}
              message={
                hasActiveFilters()
                  ? 'Try a different search term, remove the topic filter, or sort by newest to discover more demos.'
                  : 'The catalog is ready for contributions. Add a new use case or check back soon for the latest demos.'
              }
              action={
                hasActiveFilters()
                  ? {
                      label: 'Clear Filters',
                      onClick: handleClearFilters
                    }
                  : {
                      label: 'Open browse page',
                      onClick: handleViewAllPublications
                    }
              }
              secondaryAction={{
                label: 'Retry loading',
                onClick: handleRefresh
              }}
            />
          </Column>
        </Grid>
      )}
    </div>
  );
};

export default Home;

// Made with Bob
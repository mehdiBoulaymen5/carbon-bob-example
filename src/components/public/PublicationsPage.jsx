/**
 * PublicationsPage Component
 *
 * Public-facing publications list page with search, filter, sort, and pagination.
 * Includes real-time updates via SSE.
 */

import React, { useState, useEffect } from 'react';
import { Grid, Column, Pagination, SkeletonPlaceholder, ToastNotification } from '@carbon/react';
import publicationService from '../../services/publication.service';
import PublicationCard from './PublicationCard';
import PublicationFilters from './PublicationFilters';
import EmptyState from '../shared/EmptyState';
import { useSSE } from '../../contexts/SSEContext';
import './PublicationsPage.scss';

/**
 * PublicationsPage component
 * @returns {React.ReactElement} Publications list view
 */
const PublicationsPage = () => {
  const { subscribe } = useSSE();
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [topicOptions, setTopicOptions] = useState([]);
  const [notification, setNotification] = useState(null);

  /**
   * Fetch publications from API
   */
  const fetchPublications = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await publicationService.getPublicPublications(
        currentPage,
        pageSize,
        searchQuery,
        selectedTopic
      );

      let pubs = response.publications || [];

      // Apply client-side sorting
      pubs = sortPublications(pubs, sortBy);

      setPublications(pubs);
      setTotalItems(response.total || pubs.length);
      
      // Extract unique topics for filter
      extractTopics(pubs);
    } catch (err) {
      console.error('Error fetching publications:', err);
      setError(err.message || 'Failed to load publications');
      setPublications([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sort publications based on sort option
   * @param {Array} pubs - Publications to sort
   * @param {string} sort - Sort option
   * @returns {Array} Sorted publications
   */
  const sortPublications = (pubs, sort) => {
    const sorted = [...pubs];
    
    switch (sort) {
      case 'newest':
        return sorted.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
      case 'oldest':
        return sorted.sort((a, b) => 
          new Date(a.created_at) - new Date(b.created_at)
        );
      case 'title-asc':
        return sorted.sort((a, b) => 
          a.title.localeCompare(b.title)
        );
      case 'title-desc':
        return sorted.sort((a, b) => 
          b.title.localeCompare(a.title)
        );
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
    pubs.forEach(pub => {
      if (pub.topics && Array.isArray(pub.topics)) {
        pub.topics.forEach(topic => topicsSet.add(topic));
      }
    });
    
    const topics = Array.from(topicsSet)
      .sort()
      .map(topic => ({ id: topic, label: topic }));
    
    setTopicOptions(topics);
  };

  /**
   * Handle search change
   * @param {string} query - Search query
   */
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page
  };

  /**
   * Handle topic filter change
   * @param {string} topic - Selected topic
   */
  const handleTopicChange = (topic) => {
    setSelectedTopic(topic);
    setCurrentPage(1); // Reset to first page
  };

  /**
   * Handle sort change
   * @param {string} sort - Sort option
   */
  const handleSortChange = (sort) => {
    setSortBy(sort);
  };

  /**
   * Clear all filters
   */
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedTopic('');
    setSortBy('newest');
    setCurrentPage(1);
  };

  /**
   * Check if any filters are active
   * @returns {boolean} True if filters are active
   */
  const hasActiveFilters = () => {
    return searchQuery !== '' || selectedTopic !== '';
  };

  /**
   * Handle pagination change
   * @param {Object} pageInfo - Page information
   */
  const handlePaginationChange = ({ page, pageSize: newPageSize }) => {
    setCurrentPage(page);
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
    }
  };

  // Fetch publications when dependencies change
  useEffect(() => {
    fetchPublications();
  }, [currentPage, pageSize, searchQuery, selectedTopic, sortBy]);

  // Update document title
  useEffect(() => {
    document.title = 'Publications | Bob Demo Catalog';
  }, []);

  // Subscribe to SSE events for real-time updates
  useEffect(() => {
    // Handle publication created event
    const unsubscribeCreated = subscribe('publication:created', (data) => {
      console.log('Publication created:', data);
      setNotification({
        kind: 'success',
        title: 'New Publication',
        subtitle: `"${data.title}" has been published`,
        timeout: 5000
      });
      // Refresh the list
      fetchPublications();
    });

    // Handle publication updated event
    const unsubscribeUpdated = subscribe('publication:updated', (data) => {
      console.log('Publication updated:', data);
      setNotification({
        kind: 'info',
        title: 'Publication Updated',
        subtitle: `"${data.title}" has been updated`,
        timeout: 5000
      });
      // Refresh the list
      fetchPublications();
    });

    // Handle publication deleted event
    const unsubscribeDeleted = subscribe('publication:deleted', (data) => {
      console.log('Publication deleted:', data);
      setNotification({
        kind: 'warning',
        title: 'Publication Removed',
        subtitle: `"${data.title}" has been removed`,
        timeout: 5000
      });
      // Refresh the list
      fetchPublications();
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, [subscribe, fetchPublications]);

  /**
   * Render loading skeletons
   * @returns {React.ReactElement} Loading skeletons
   */
  const renderLoadingSkeletons = () => {
    return Array.from({ length: pageSize }).map((_, index) => (
      <Column key={index} sm={4} md={4} lg={4}>
        <SkeletonPlaceholder style={{ height: '200px', width: '100%' }} />
      </Column>
    ));
  };

  return (
    <div className="publications-page">
      {notification && (
        <ToastNotification
          kind={notification.kind}
          title={notification.title}
          subtitle={notification.subtitle}
          timeout={notification.timeout}
          onClose={() => setNotification(null)}
          style={{ position: 'fixed', top: '3rem', right: '1rem', zIndex: 9999 }}
        />
      )}

      <Grid>
        <Column sm={4} md={8} lg={16}>
          <div className="publications-page__header">
            <p className="publications-page__eyebrow">Browse use cases</p>
            <h1 className="publications-page__title">Explore the full Bob demo library</h1>
            <p className="publications-page__subtitle">
              Search published use cases by topic, scan the latest additions, and open any entry for implementation details and source links.
            </p>
          </div>
        </Column>
      </Grid>

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

      {error && (
        <Grid>
          <Column sm={4} md={8} lg={16}>
            <EmptyState
              title="We couldn’t load the browse page"
              message={error}
              action={{
                label: 'Try Again',
                onClick: fetchPublications
              }}
              secondaryAction={
                hasActiveFilters()
                  ? {
                      label: 'Clear Filters',
                      onClick: handleClearFilters
                    }
                  : null
              }
            />
          </Column>
        </Grid>
      )}

      {!error && !loading && publications.length === 0 && (
        <Grid>
          <Column sm={4} md={8} lg={16}>
            <EmptyState
              title={hasActiveFilters() ? 'No matching use cases found' : 'No published use cases yet'}
              message={
                hasActiveFilters()
                  ? 'Try a broader search, remove a topic filter, or sort by newest to discover more results.'
                  : 'Newly published use cases will appear here automatically once they are available.'
              }
              action={
                hasActiveFilters()
                  ? {
                      label: 'Clear Filters',
                      onClick: handleClearFilters
                    }
                  : {
                      label: 'Reload',
                      onClick: fetchPublications
                    }
              }
            />
          </Column>
        </Grid>
      )}

      <Grid className="publications-page__grid">
        {loading ? (
          renderLoadingSkeletons()
        ) : (
          publications.map((publication) => (
            <Column key={publication.id} sm={4} md={4} lg={4}>
              <PublicationCard publication={publication} />
            </Column>
          ))
        )}
      </Grid>

      {!loading && publications.length > 0 && totalItems > pageSize && (
        <Grid>
          <Column sm={4} md={8} lg={16}>
            <div className="publications-page__pagination">
              <Pagination
                page={currentPage}
                pageSize={pageSize}
                pageSizes={[12, 24, 36, 48]}
                totalItems={totalItems}
                onChange={handlePaginationChange}
                itemsPerPageText="Publications per page:"
                pageRangeText={(current, total) => 
                  `of ${total} page${total === 1 ? '' : 's'}`
                }
              />
            </div>
          </Column>
        </Grid>
      )}
    </div>
  );
};

export default PublicationsPage;

// Made with Bob
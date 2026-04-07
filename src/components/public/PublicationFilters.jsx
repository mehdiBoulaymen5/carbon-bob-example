/**
 * PublicationFilters Component
 * 
 * Search and filter controls for publications page.
 * Includes search, topic filter, and sort options.
 */

import React from 'react';
import { 
  Search, 
  Dropdown, 
  Button,
  Tag,
  Grid,
  Column
} from '@carbon/react';
import { Close } from '@carbon/icons-react';
import './PublicationFilters.scss';

/**
 * PublicationFilters component
 * @param {Object} props - Component props
 * @param {string} props.searchQuery - Current search query
 * @param {Function} props.onSearchChange - Search change handler
 * @param {string} props.selectedTopic - Selected topic filter
 * @param {Function} props.onTopicChange - Topic change handler
 * @param {Array<Object>} props.topicOptions - Available topic options
 * @param {string} props.sortBy - Current sort option
 * @param {Function} props.onSortChange - Sort change handler
 * @param {Function} props.onClearFilters - Clear all filters handler
 * @param {boolean} props.hasActiveFilters - Whether any filters are active
 * @returns {React.ReactElement} Filter controls
 */
const PublicationFilters = ({
  searchQuery,
  onSearchChange,
  selectedTopic,
  onTopicChange,
  topicOptions,
  sortBy,
  onSortChange,
  onClearFilters,
  hasActiveFilters
}) => {
  const sortOptions = [
    { id: 'newest', label: 'Newest First' },
    { id: 'oldest', label: 'Oldest First' },
    { id: 'title-asc', label: 'Title A-Z' },
    { id: 'title-desc', label: 'Title Z-A' }
  ];

  /**
   * Get selected sort option
   * @returns {Object} Selected sort option
   */
  const getSelectedSortOption = () => {
    return sortOptions.find(opt => opt.id === sortBy) || sortOptions[0];
  };

  /**
   * Get selected topic option
   * @returns {Object|null} Selected topic option
   */
  const getSelectedTopicOption = () => {
    if (!selectedTopic) return null;
    return topicOptions.find(opt => opt.id === selectedTopic);
  };

  return (
    <div className="publication-filters">
      <Grid>
        <Column sm={4} md={8} lg={16}>
          <div className="publication-filters__controls">
            <div className="publication-filters__search">
              <Search
                id="publication-search"
                labelText="Search publications"
                placeholder="Search by title or description..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                size="lg"
              />
            </div>

            <div className="publication-filters__dropdowns">
              <Dropdown
                id="topic-filter"
                titleText="Filter by Topic"
                label="All Topics"
                items={topicOptions}
                itemToString={(item) => (item ? item.label : '')}
                selectedItem={getSelectedTopicOption()}
                onChange={({ selectedItem }) => 
                  onTopicChange(selectedItem ? selectedItem.id : '')
                }
              />

              <Dropdown
                id="sort-filter"
                titleText="Sort By"
                label="Sort"
                items={sortOptions}
                itemToString={(item) => (item ? item.label : '')}
                selectedItem={getSelectedSortOption()}
                onChange={({ selectedItem }) => 
                  onSortChange(selectedItem.id)
                }
              />
            </div>
          </div>
        </Column>

        {hasActiveFilters && (
          <Column sm={4} md={8} lg={16}>
            <div className="publication-filters__active">
              <div className="publication-filters__active-label">
                Active filters:
              </div>
              <div className="publication-filters__active-tags">
                {searchQuery && (
                  <Tag
                    type="blue"
                    filter
                    onClose={() => onSearchChange('')}
                  >
                    Search: {searchQuery}
                  </Tag>
                )}
                {selectedTopic && (
                  <Tag
                    type="blue"
                    filter
                    onClose={() => onTopicChange('')}
                  >
                    Topic: {getSelectedTopicOption()?.label}
                  </Tag>
                )}
              </div>
              <Button
                kind="ghost"
                size="sm"
                renderIcon={Close}
                onClick={onClearFilters}
              >
                Clear all
              </Button>
            </div>
          </Column>
        )}
      </Grid>
    </div>
  );
};

export default PublicationFilters;

// Made with Bob
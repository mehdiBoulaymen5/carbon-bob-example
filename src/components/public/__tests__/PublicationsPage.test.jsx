/**
 * PublicationsPage Component Tests
 * 
 * Tests for the publications page component including:
 * - Publications list rendering
 * - Loading state
 * - Empty state
 * - Filtering and sorting
 * - Pagination
 * - SSE real-time updates
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import PublicationsPage from '../PublicationsPage';
import { createSSEContextValue } from '../../../test/mocks/sse-context';
import * as SSEContext from '../../../contexts/SSEContext';
import publicationService from '../../../services/publication.service';

// Mock publication service
vi.mock('../../../services/publication.service', () => ({
  default: {
    getPublicPublications: vi.fn(),
  },
}));

// Mock SSE context
vi.mock('../../../contexts/SSEContext', async () => {
  const actual = await vi.importActual('../../../contexts/SSEContext');
  return {
    ...actual,
    useSSE: vi.fn(),
  };
});

// Mock child components
vi.mock('../PublicationCard', () => ({
  default: ({ publication }) => (
    <div data-testid={`publication-card-${publication.id}`}>
      {publication.title}
    </div>
  ),
}));

vi.mock('../PublicationFilters', () => ({
  default: ({ searchQuery, onSearchChange, selectedTopic, onTopicChange, sortBy, onSortChange, onClearFilters, hasActiveFilters }) => (
    <div data-testid="publication-filters">
      <input
        data-testid="search-input"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search"
      />
      <select
        data-testid="topic-select"
        value={selectedTopic}
        onChange={(e) => onTopicChange(e.target.value)}
      >
        <option value="">All Topics</option>
        <option value="AI">AI</option>
      </select>
      <select
        data-testid="sort-select"
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
      >
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
      </select>
      {hasActiveFilters && (
        <button onClick={onClearFilters}>Clear Filters</button>
      )}
    </div>
  ),
}));

vi.mock('../../shared/EmptyState', () => ({
  default: ({ title, message, action }) => (
    <div data-testid="empty-state">
      <h2>{title}</h2>
      <p>{message}</p>
      {action && <button onClick={action.onClick}>{action.label}</button>}
    </div>
  ),
}));

describe('PublicationsPage', () => {
  const mockSubscribe = vi.fn();
  const mockUnsubscribe = vi.fn();

  const mockPublications = [
    {
      id: 'pub-1',
      title: 'First Publication',
      description: 'Description 1',
      topics: ['AI', 'Code'],
      status: 'published',
      created_at: '2024-01-15T10:00:00Z',
    },
    {
      id: 'pub-2',
      title: 'Second Publication',
      description: 'Description 2',
      topics: ['Data'],
      status: 'published',
      created_at: '2024-01-14T10:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockSubscribe.mockImplementation(() => mockUnsubscribe);
    SSEContext.useSSE.mockReturnValue(
      createSSEContextValue({
        subscribe: mockSubscribe,
      })
    );
    publicationService.getPublicPublications.mockResolvedValue({
      publications: mockPublications,
      total: mockPublications.length,
    });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <PublicationsPage />
      </BrowserRouter>
    );
  };

  describe('Rendering', () => {
    it('should render page header', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /publications/i })).toBeInTheDocument();
      });
    });

    it('should render page subtitle', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/explore our collection/i)).toBeInTheDocument();
      });
    });

    it('should render publication filters', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('publication-filters')).toBeInTheDocument();
      });
    });
  });

  describe('Publications List', () => {
    it('should render publications list correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('publication-card-pub-1')).toBeInTheDocument();
        expect(screen.getByTestId('publication-card-pub-2')).toBeInTheDocument();
      });
    });

    it('should display all publication items', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('First Publication')).toBeInTheDocument();
        expect(screen.getByText('Second Publication')).toBeInTheDocument();
      });
    });

    it('should call service with correct parameters', async () => {
      renderComponent();

      await waitFor(() => {
        expect(publicationService.getPublicPublications).toHaveBeenCalledWith(
          1,    // page
          12,   // pageSize
          '',   // searchQuery
          ''    // selectedTopic
        );
      });
    });
  });

  describe('Loading State', () => {
    it('should display loading skeletons initially', async () => {
      publicationService.getPublicPublications.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ publications: mockPublications, total: 2 }), 100))
      );
      renderComponent();

      // Check for skeleton placeholders while loading
      await waitFor(() => {
        const skeletons = document.querySelectorAll('.cds--skeleton__placeholder');
        expect(skeletons.length).toBeGreaterThan(0);
      });
    });

    it('should hide loading state after data loads', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('First Publication')).toBeInTheDocument();
      });

      const skeletons = document.querySelectorAll('.cds--skeleton');
      expect(skeletons.length).toBe(0);
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no publications', async () => {
      publicationService.getPublicPublications.mockResolvedValue({
        publications: [],
        total: 0,
      });
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
        expect(screen.getByText(/no publications found/i)).toBeInTheDocument();
      });
    });

    it('should show appropriate message when no results with filters', async () => {
      publicationService.getPublicPublications.mockResolvedValue({
        publications: [],
        total: 0,
      });
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input');
      await userEvent.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText(/try adjusting your search or filters/i)).toBeInTheDocument();
      });
    });

    it('should show clear filters button in empty state with active filters', async () => {
      publicationService.getPublicPublications.mockResolvedValue({
        publications: [],
        total: 0,
      });
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input');
      await userEvent.type(searchInput, 'test');

      await waitFor(() => {
        const clearButtons = screen.getAllByText(/clear filters/i);
        expect(clearButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Filtering', () => {
    it('should filter publications by search query', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'First');

      await waitFor(() => {
        expect(publicationService.getPublicPublications).toHaveBeenCalledWith(
          1,
          12,
          'First',
          ''
        );
      });
    });

    it('should filter publications by topic', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('topic-select')).toBeInTheDocument();
      });

      const topicSelect = screen.getByTestId('topic-select');
      await user.selectOptions(topicSelect, 'AI');

      await waitFor(() => {
        expect(publicationService.getPublicPublications).toHaveBeenCalledWith(
          1,
          12,
          '',
          'AI'
        );
      });
    });

    it('should reset to first page when filtering', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'test');

      await waitFor(() => {
        const calls = publicationService.getPublicPublications.mock.calls;
        const lastCall = calls[calls.length - 1];
        expect(lastCall[0]).toBe(1); // page should be 1
      });
    });

    it('should clear all filters when clear button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      // Apply filters
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'test');

      await waitFor(() => {
        expect(screen.getByText(/clear filters/i)).toBeInTheDocument();
      });

      // Clear filters
      const clearButton = screen.getByText(/clear filters/i);
      await user.click(clearButton);

      await waitFor(() => {
        expect(searchInput).toHaveValue('');
      });
    });
  });

  describe('Sorting', () => {
    it('should sort publications by newest', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('sort-select')).toBeInTheDocument();
      });

      const sortSelect = screen.getByTestId('sort-select');
      await user.selectOptions(sortSelect, 'newest');

      await waitFor(() => {
        expect(publicationService.getPublicPublications).toHaveBeenCalled();
      });
    });

    it('should sort publications by oldest', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('sort-select')).toBeInTheDocument();
      });

      const sortSelect = screen.getByTestId('sort-select');
      await user.selectOptions(sortSelect, 'oldest');

      await waitFor(() => {
        expect(publicationService.getPublicPublications).toHaveBeenCalled();
      });
    });
  });

  describe('Pagination', () => {
    it('should display pagination when total items exceed page size', async () => {
      publicationService.getPublicPublications.mockResolvedValue({
        publications: mockPublications,
        total: 25,
      });
      renderComponent();

      await waitFor(() => {
        const paginationElements = screen.getAllByText(/of 3 pages/i);
        expect(paginationElements.length).toBeGreaterThan(0);
      });
    });

    it('should not display pagination when items fit on one page', async () => {
      publicationService.getPublicPublications.mockResolvedValue({
        publications: mockPublications,
        total: 2,
      });
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('First Publication')).toBeInTheDocument();
      });

      expect(screen.queryByText(/of.*pages/i)).not.toBeInTheDocument();
    });

    it('should handle page change', async () => {
      const user = userEvent.setup();
      publicationService.getPublicPublications.mockResolvedValue({
        publications: mockPublications,
        total: 25,
      });
      renderComponent();

      await waitFor(() => {
        const paginationElements = screen.getAllByText(/of 3 pages/i);
        expect(paginationElements.length).toBeGreaterThan(0);
      });

      const nextButton = screen.getByLabelText(/next page/i);
      await user.click(nextButton);

      await waitFor(() => {
        expect(publicationService.getPublicPublications).toHaveBeenCalledWith(
          2,
          12,
          '',
          ''
        );
      });
    });

    it('should handle page size change', async () => {
      const user = userEvent.setup();
      publicationService.getPublicPublications.mockResolvedValue({
        publications: mockPublications,
        total: 25,
      });
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/publications per page/i)).toBeInTheDocument();
      });

      // Find the page size select by its ID pattern
      const pageSizeSelect = document.querySelector('select[id*="pagination-select"]');
      expect(pageSizeSelect).toBeInTheDocument();
      
      await user.selectOptions(pageSizeSelect, '24');

      await waitFor(() => {
        expect(publicationService.getPublicPublications).toHaveBeenCalledWith(
          1,
          24,
          '',
          ''
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on fetch failure', async () => {
      publicationService.getPublicPublications.mockRejectedValue(
        new Error('Failed to load publications')
      );
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/error loading publications/i)).toBeInTheDocument();
        expect(screen.getByText(/failed to load publications/i)).toBeInTheDocument();
      });
    });

    it('should display try again button on error', async () => {
      publicationService.getPublicPublications.mockRejectedValue(
        new Error('Network error')
      );
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/try again/i)).toBeInTheDocument();
      });
    });

    it('should retry fetching on try again click', async () => {
      const user = userEvent.setup();
      publicationService.getPublicPublications
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          publications: mockPublications,
          total: 2,
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/try again/i)).toBeInTheDocument();
      });

      const tryAgainButton = screen.getByText(/try again/i);
      await user.click(tryAgainButton);

      await waitFor(() => {
        expect(screen.getByText('First Publication')).toBeInTheDocument();
      });
    });
  });

  describe('SSE Real-time Updates', () => {
    it('should subscribe to publication:created events', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalledWith('publication:created', expect.any(Function));
      });
    });

    it('should subscribe to publication:updated events', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalledWith('publication:updated', expect.any(Function));
      });
    });

    it('should subscribe to publication:deleted events', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalledWith('publication:deleted', expect.any(Function));
      });
    });

    it('should refresh list on publication:created event', async () => {
      let createdCallback;
      mockSubscribe.mockImplementation((event, callback) => {
        if (event === 'publication:created') {
          createdCallback = callback;
        }
        return mockUnsubscribe;
      });

      renderComponent();

      await waitFor(() => {
        expect(publicationService.getPublicPublications).toHaveBeenCalledTimes(1);
      });

      // Trigger the event
      createdCallback({ id: 'new-pub', title: 'New Publication' });

      await waitFor(() => {
        expect(publicationService.getPublicPublications).toHaveBeenCalledTimes(2);
      });
    });

    it('should show notification on publication:created event', async () => {
      let createdCallback;
      mockSubscribe.mockImplementation((event, callback) => {
        if (event === 'publication:created') {
          createdCallback = callback;
        }
        return mockUnsubscribe;
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText(/new publication/i)).not.toBeInTheDocument();
      });

      // Trigger the event
      createdCallback({ id: 'new-pub', title: 'Test Publication' });

      await waitFor(() => {
        expect(screen.getByText(/new publication/i)).toBeInTheDocument();
        expect(screen.getByText(/"test publication" has been published/i)).toBeInTheDocument();
      });
    });

    it('should unsubscribe from events on unmount', async () => {
      const { unmount } = renderComponent();

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalled();
      });

      unmount();

      // Should be called at least 3 times (once for each event type)
      expect(mockUnsubscribe).toHaveBeenCalled();
      expect(mockUnsubscribe.mock.calls.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Document Title', () => {
    it('should set document title on mount', async () => {
      renderComponent();

      await waitFor(() => {
        expect(document.title).toBe('Publications | Bob Demo Catalog');
      });
    });
  });
});

// Made with Bob

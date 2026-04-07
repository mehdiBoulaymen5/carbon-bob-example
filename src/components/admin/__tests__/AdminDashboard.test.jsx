/**
 * AdminDashboard Component Tests
 * 
 * Tests for the admin dashboard component including:
 * - Dashboard statistics rendering
 * - Recent activity display
 * - Navigation actions
 * - SSE real-time updates
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from '../AdminDashboard';
import { createSSEContextValue } from '../../../test/mocks/sse-context';
import * as SSEContext from '../../../contexts/SSEContext';
import adminService from '../../../services/admin.service';

// Mock admin service
vi.mock('../../../services/admin.service', () => ({
  default: {
    getDashboardStats: vi.fn(),
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

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AdminDashboard', () => {
  const mockSubscribe = vi.fn();
  const mockUnsubscribe = vi.fn();

  const mockDashboardData = {
    overview: {
      totalPublications: 25,
      publishedPublications: 20,
      draftPublications: 5,
      totalViews: 1250,
    },
    recentActivity: [
      {
        id: '1',
        action: 'CREATE',
        user_email: 'admin@example.com',
        resource_type: 'publication',
        resource_id: 'pub-123',
        timestamp: '2024-01-15T10:30:00Z',
      },
      {
        id: '2',
        action: 'UPDATE',
        user_email: 'admin@example.com',
        resource_type: 'publication',
        resource_id: 'pub-456',
        timestamp: '2024-01-15T09:15:00Z',
      },
    ],
    topViewed: [
      {
        id: 'pub-1',
        title: 'Popular Publication',
        view_count: 500,
        status: 'published',
      },
      {
        id: 'pub-2',
        title: 'Another Popular One',
        view_count: 300,
        status: 'published',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSubscribe.mockImplementation(() => mockUnsubscribe);
    SSEContext.useSSE.mockReturnValue(
      createSSEContextValue({
        subscribe: mockSubscribe,
      })
    );
    adminService.getDashboardStats.mockResolvedValue(mockDashboardData);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );
  };

  describe('Rendering', () => {
    it('should render dashboard header', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
      });
    });

    it('should render action buttons', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add publication/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /view all/i })).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Statistics', () => {
    it('should display total publications count', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('25')).toBeInTheDocument();
        expect(screen.getByText(/total publications/i)).toBeInTheDocument();
      });
    });

    it('should display published publications count', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('20')).toBeInTheDocument();
        expect(screen.getByText(/published/i)).toBeInTheDocument();
      });
    });

    it('should display draft publications count', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText(/drafts/i)).toBeInTheDocument();
      });
    });

    it('should display total views count', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('1250')).toBeInTheDocument();
        expect(screen.getByText(/total views/i)).toBeInTheDocument();
      });
    });

    it('should display zero counts when no data', async () => {
      adminService.getDashboardStats.mockResolvedValue({
        overview: {},
        recentActivity: [],
        topViewed: [],
      });
      renderComponent();

      await waitFor(() => {
        const zeroCounts = screen.getAllByText('0');
        expect(zeroCounts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Recent Activity', () => {
    it('should display recent activity section', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/recent activity/i)).toBeInTheDocument();
      });
    });

    it('should display activity items', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
        expect(screen.getByText('CREATE')).toBeInTheDocument();
        expect(screen.getByText('UPDATE')).toBeInTheDocument();
      });
    });

    it('should display empty state when no activity', async () => {
      adminService.getDashboardStats.mockResolvedValue({
        ...mockDashboardData,
        recentActivity: [],
      });
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/no recent activity/i)).toBeInTheDocument();
      });
    });

    it('should format activity timestamps', async () => {
      renderComponent();

      await waitFor(() => {
        // Check that dates are formatted (not raw ISO strings)
        expect(screen.queryByText('2024-01-15T10:30:00Z')).not.toBeInTheDocument();
      });
    });
  });

  describe('Top Viewed Publications', () => {
    it('should display top viewed section', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/top viewed/i)).toBeInTheDocument();
      });
    });

    it('should display top viewed publications', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Popular Publication')).toBeInTheDocument();
        expect(screen.getByText('Another Popular One')).toBeInTheDocument();
        expect(screen.getByText('500 views')).toBeInTheDocument();
        expect(screen.getByText('300 views')).toBeInTheDocument();
      });
    });

    it('should display empty state when no publications', async () => {
      adminService.getDashboardStats.mockResolvedValue({
        ...mockDashboardData,
        topViewed: [],
      });
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/no publications yet/i)).toBeInTheDocument();
      });
    });

    it('should display publication status', async () => {
      renderComponent();

      await waitFor(() => {
        const statusElements = screen.getAllByText(/published/i);
        expect(statusElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to publication form when "Add Publication" is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add publication/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add publication/i });
      await user.click(addButton);

      expect(mockNavigate).toHaveBeenCalledWith('/admin/publications/new');
    });

    it('should navigate to publications list when "View All" is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view all/i })).toBeInTheDocument();
      });

      const viewAllButton = screen.getByRole('button', { name: /view all/i });
      await user.click(viewAllButton);

      expect(mockNavigate).toHaveBeenCalledWith('/admin/publications');
    });
  });

  describe('Loading State', () => {
    it('should display loading state initially', () => {
      adminService.getDashboardStats.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockDashboardData), 100))
      );
      renderComponent();

      expect(screen.getByText(/loading dashboard\.\.\./i)).toBeInTheDocument();
    });

    it('should hide loading state after data loads', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText(/loading dashboard\.\.\./i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on fetch failure', async () => {
      adminService.getDashboardStats.mockRejectedValue(new Error('Failed to fetch'));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
      });
    });

    it('should display retry button on error', async () => {
      adminService.getDashboardStats.mockRejectedValue(new Error('Network error'));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should retry fetching data when retry button is clicked', async () => {
      const user = userEvent.setup();
      adminService.getDashboardStats
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockDashboardData);
      
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('25')).toBeInTheDocument();
      });
    });

    it('should clear error when close button is clicked', async () => {
      const user = userEvent.setup();
      adminService.getDashboardStats.mockRejectedValue(new Error('Network error'));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close notification/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText(/network error/i)).not.toBeInTheDocument();
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

    it('should refresh dashboard on publication:created event', async () => {
      let createdCallback;
      mockSubscribe.mockImplementation((event, callback) => {
        if (event === 'publication:created') {
          createdCallback = callback;
        }
        return mockUnsubscribe;
      });

      renderComponent();

      await waitFor(() => {
        expect(adminService.getDashboardStats).toHaveBeenCalledTimes(1);
      });

      // Trigger the event
      createdCallback({ id: 'new-pub', title: 'New Publication' });

      await waitFor(() => {
        expect(adminService.getDashboardStats).toHaveBeenCalledTimes(2);
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
        expect(screen.getByText(/"test publication" has been created/i)).toBeInTheDocument();
      });
    });

    it('should show notification on publication:deleted event', async () => {
      let deletedCallback;
      mockSubscribe.mockImplementation((event, callback) => {
        if (event === 'publication:deleted') {
          deletedCallback = callback;
        }
        return mockUnsubscribe;
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText(/publication removed/i)).not.toBeInTheDocument();
      });

      // Trigger the event
      deletedCallback({ id: 'del-pub', title: 'Deleted Publication' });

      await waitFor(() => {
        expect(screen.getByText(/publication removed/i)).toBeInTheDocument();
        expect(screen.getByText(/"deleted publication" has been deleted/i)).toBeInTheDocument();
      });
    });

    it('should unsubscribe from events on unmount', async () => {
      const { unmount } = renderComponent();

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalled();
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(3); // Once for each event type
    });
  });

  describe('Data Fetching', () => {
    it('should fetch dashboard stats on mount', async () => {
      renderComponent();

      await waitFor(() => {
        expect(adminService.getDashboardStats).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle empty dashboard data', async () => {
      adminService.getDashboardStats.mockResolvedValue({
        overview: null,
        recentActivity: null,
        topViewed: null,
      });
      renderComponent();

      await waitFor(() => {
        const zeros = screen.getAllByText('0');
        expect(zeros.length).toBeGreaterThan(0);
      });
    });
  });
});

// Made with Bob

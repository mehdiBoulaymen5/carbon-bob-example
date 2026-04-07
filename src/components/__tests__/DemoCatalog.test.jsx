/**
 * DemoCatalog Component Tests
 * 
 * Tests for the demo catalog component including:
 * - Rendering demo cards
 * - Add Use Case button functionality
 * - Navigation based on user role
 * - Demo items display
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import DemoCatalog from '../DemoCatalog';
import { createAuthContextValue } from '../../test/mocks/auth-context';
import * as AuthContext from '../../contexts/AuthContext';

// Mock the useAuth hook
vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn(),
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

describe('DemoCatalog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    AuthContext.useAuth.mockReturnValue(
      createAuthContextValue({
        isAuthenticated: false,
        user: null,
      })
    );
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <DemoCatalog />
      </BrowserRouter>
    );
  };

  describe('Rendering', () => {
    it('should render catalog header correctly', () => {
      renderComponent();

      expect(screen.getByText(/available demos/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add use case/i })).toBeInTheDocument();
    });

    it('should render all demo cards', () => {
      renderComponent();

      // Check for all 6 demo titles
      expect(screen.getByText(/code generation demo/i)).toBeInTheDocument();
      expect(screen.getByText(/data analysis demo/i)).toBeInTheDocument();
      expect(screen.getByText(/chart visualization demo/i)).toBeInTheDocument();
      expect(screen.getByText(/ai chat integration/i)).toBeInTheDocument();
      expect(screen.getByText(/cloud deployment demo/i)).toBeInTheDocument();
      expect(screen.getByText(/security analysis demo/i)).toBeInTheDocument();
    });

    it('should render demo descriptions', () => {
      renderComponent();

      expect(screen.getByText(/explore how bob can generate clean, efficient code/i)).toBeInTheDocument();
      expect(screen.getByText(/see bob analyze complex datasets/i)).toBeInTheDocument();
    });

    it('should render demo status tags', () => {
      renderComponent();

      // Check for status tags
      const availableTags = screen.getAllByText(/available/i);
      expect(availableTags.length).toBeGreaterThan(0);
      
      expect(screen.getByText(/new/i)).toBeInTheDocument();
      expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
    });

    it('should render demo topic tags', () => {
      renderComponent();

      // Check for various topic tags
      expect(screen.getByText('AI')).toBeInTheDocument();
      expect(screen.getByText('Code')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Security')).toBeInTheDocument();
    });

    it('should render demo icons', () => {
      renderComponent();

      // Check that demo cards have the icon class
      const demoCards = document.querySelectorAll('.demo-card');
      expect(demoCards.length).toBe(6);
      
      demoCards.forEach(card => {
        const icon = card.querySelector('.demo-icon');
        expect(icon).toBeInTheDocument();
      });
    });
  });

  describe('Add Use Case Button', () => {
    it('should display "Add Use Case" button', () => {
      renderComponent();

      const addButton = screen.getByRole('button', { name: /add use case/i });
      expect(addButton).toBeInTheDocument();
    });

    it('should have correct button styling', () => {
      renderComponent();

      const addButton = screen.getByRole('button', { name: /add use case/i });
      expect(addButton).toHaveClass('cds--btn--primary');
    });
  });

  describe('Navigation - Non-Admin Users', () => {
    it('should navigate to publications page for non-authenticated users', async () => {
      const user = userEvent.setup();
      AuthContext.useAuth.mockReturnValue(
        createAuthContextValue({
          isAuthenticated: false,
          user: null,
        })
      );
      renderComponent();

      const addButton = screen.getByRole('button', { name: /add use case/i });
      await user.click(addButton);

      expect(mockNavigate).toHaveBeenCalledWith('/publications');
    });

    it('should navigate to publications page for authenticated non-admin users', async () => {
      const user = userEvent.setup();
      AuthContext.useAuth.mockReturnValue(
        createAuthContextValue({
          isAuthenticated: true,
          user: { id: '1', email: 'user@example.com', role: 'user' },
        })
      );
      renderComponent();

      const addButton = screen.getByRole('button', { name: /add use case/i });
      await user.click(addButton);

      expect(mockNavigate).toHaveBeenCalledWith('/publications');
    });
  });

  describe('Navigation - Admin Users', () => {
    it('should navigate to admin publication creation for admin users', async () => {
      const user = userEvent.setup();
      AuthContext.useAuth.mockReturnValue(
        createAuthContextValue({
          isAuthenticated: true,
          user: { id: '1', email: 'admin@example.com', role: 'admin' },
        })
      );
      renderComponent();

      const addButton = screen.getByRole('button', { name: /add use case/i });
      await user.click(addButton);

      expect(mockNavigate).toHaveBeenCalledWith('/admin/publications/new');
    });

    it('should navigate to correct route when admin is authenticated', async () => {
      const user = userEvent.setup();
      AuthContext.useAuth.mockReturnValue(
        createAuthContextValue({
          isAuthenticated: true,
          user: { id: '2', email: 'admin2@example.com', role: 'admin' },
        })
      );
      renderComponent();

      const addButton = screen.getByRole('button', { name: /add use case/i });
      await user.click(addButton);

      expect(mockNavigate).toHaveBeenCalledWith('/admin/publications/new');
      expect(mockNavigate).not.toHaveBeenCalledWith('/publications');
    });
  });

  describe('Demo Items', () => {
    it('should render all 6 demo items', () => {
      renderComponent();

      const demoCards = document.querySelectorAll('.demo-card');
      expect(demoCards.length).toBe(6);
    });

    it('should render demo with correct structure', () => {
      renderComponent();

      const firstDemo = screen.getByText(/code generation demo/i).closest('.demo-card');
      expect(firstDemo).toBeInTheDocument();
      
      // Check for demo card elements
      expect(firstDemo.querySelector('.demo-card-header')).toBeInTheDocument();
      expect(firstDemo.querySelector('.demo-title')).toBeInTheDocument();
      expect(firstDemo.querySelector('.demo-description')).toBeInTheDocument();
      expect(firstDemo.querySelector('.demo-tags')).toBeInTheDocument();
    });

    it('should render each demo with unique content', () => {
      renderComponent();

      const demoTitles = [
        'Code Generation Demo',
        'Data Analysis Demo',
        'Chart Visualization Demo',
        'AI Chat Integration',
        'Cloud Deployment Demo',
        'Security Analysis Demo'
      ];

      demoTitles.forEach(title => {
        expect(screen.getByText(title)).toBeInTheDocument();
      });
    });

    it('should render demos with appropriate tags', () => {
      renderComponent();

      // Code Generation Demo tags
      const codeDemo = screen.getByText(/code generation demo/i).closest('.demo-card');
      expect(codeDemo.textContent).toContain('AI');
      expect(codeDemo.textContent).toContain('Code');
      expect(codeDemo.textContent).toContain('Automation');
    });

    it('should render demos with correct status badges', () => {
      renderComponent();

      // Check "New" status
      const newDemo = screen.getByText(/ai chat integration/i).closest('.demo-card');
      expect(newDemo.textContent).toContain('New');

      // Check "Coming Soon" status
      const comingSoonDemo = screen.getByText(/security analysis demo/i).closest('.demo-card');
      expect(comingSoonDemo.textContent).toContain('Coming Soon');

      // Check "Available" status
      const availableDemo = screen.getByText(/code generation demo/i).closest('.demo-card');
      expect(availableDemo.textContent).toContain('Available');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button', () => {
      renderComponent();

      const addButton = screen.getByRole('button', { name: /add use case/i });
      expect(addButton).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      renderComponent();

      const heading = screen.getByRole('heading', { name: /available demos/i });
      expect(heading).toBeInTheDocument();
    });

    it('should render demo titles as headings', () => {
      renderComponent();

      const demoTitles = screen.getAllByRole('heading', { level: 3 });
      expect(demoTitles.length).toBe(6);
    });
  });

  describe('Layout', () => {
    it('should use Carbon Grid system', () => {
      renderComponent();

      const grids = document.querySelectorAll('.cds--grid');
      expect(grids.length).toBeGreaterThan(0);
    });

    it('should render demo cards in columns', () => {
      renderComponent();

      const columns = document.querySelectorAll('.demo-card-column');
      expect(columns.length).toBe(6);
    });
  });
});

// Made with Bob

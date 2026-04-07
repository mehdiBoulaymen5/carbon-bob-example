/**
 * Admin Dashboard Component
 *
 * Main dashboard view displaying statistics, recent activity, and quick actions.
 * Includes real-time updates via SSE.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Column,
  Tile,
  Button,
  Loading,
  InlineNotification,
  StructuredListWrapper,
  StructuredListHead,
  StructuredListBody,
  StructuredListRow,
  StructuredListCell,
  ToastNotification,
} from '@carbon/react';
import { Add, View } from '@carbon/icons-react';
import adminService from '../../services/admin.service';
import { useSSE } from '../../contexts/SSEContext';
import './AdminDashboard.scss';

/**
 * Format date to readable string
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get action badge class based on action type
 * @param {string} action - Action type
 * @returns {string} CSS class name
 */
const getActionClass = (action) => {
  const actionMap = {
    CREATE: 'action-create',
    UPDATE: 'action-update',
    DELETE: 'action-delete',
    LOGIN: 'action-login',
  };
  return actionMap[action] || 'action-default';
};

/**
 * AdminDashboard component
 * @returns {React.ReactElement} Dashboard view
 */
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { subscribe } = useSSE();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [notification, setNotification] = useState(null);

  /**
   * Fetch dashboard statistics
   */
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError(err.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // Subscribe to SSE events for real-time dashboard updates
  useEffect(() => {
    // Handle publication created event
    const unsubscribeCreated = subscribe('publication:created', (data) => {
      console.log('Dashboard: Publication created:', data);
      setNotification({
        kind: 'success',
        title: 'New Publication',
        subtitle: `"${data.title}" has been created`,
        timeout: 5000
      });
      // Refresh dashboard stats
      fetchDashboardStats();
    });

    // Handle publication updated event
    const unsubscribeUpdated = subscribe('publication:updated', (data) => {
      console.log('Dashboard: Publication updated:', data);
      // Refresh dashboard stats
      fetchDashboardStats();
    });

    // Handle publication deleted event
    const unsubscribeDeleted = subscribe('publication:deleted', (data) => {
      console.log('Dashboard: Publication deleted:', data);
      setNotification({
        kind: 'warning',
        title: 'Publication Removed',
        subtitle: `"${data.title}" has been deleted`,
        timeout: 5000
      });
      // Refresh dashboard stats
      fetchDashboardStats();
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, [subscribe]);

  /**
   * Handle retry after error
   */
  const handleRetry = () => {
    fetchDashboardStats();
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <Grid>
          <Column sm={4} md={8} lg={16}>
            <Loading description="Loading dashboard..." withOverlay={false} />
          </Column>
        </Grid>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <Grid>
          <Column sm={4} md={8} lg={16}>
            <InlineNotification
              kind="error"
              title="Error"
              subtitle={error}
              lowContrast
              onCloseButtonClick={() => setError(null)}
              actions={
                <Button kind="ghost" size="sm" onClick={handleRetry}>
                  Retry
                </Button>
              }
            />
          </Column>
        </Grid>
      </div>
    );
  }

  const { overview, recentActivity, topViewed } = stats || {};

  return (
    <div className="admin-dashboard">
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
        {/* Header */}
        <Column sm={4} md={8} lg={16}>
          <div className="admin-dashboard__header">
            <h1>Dashboard</h1>
            <div className="admin-dashboard__actions">
              <Button
                kind="primary"
                renderIcon={Add}
                onClick={() => navigate('/admin/publications/new')}
              >
                Add Publication
              </Button>
              <Button
                kind="secondary"
                renderIcon={View}
                onClick={() => navigate('/admin/publications')}
              >
                View All
              </Button>
            </div>
          </div>
        </Column>

        {/* Statistics Cards */}
        <Column sm={4} md={4} lg={4}>
          <Tile className="stat-card">
            <div className="stat-card__value">{overview?.totalPublications || 0}</div>
            <div className="stat-card__label">Total Publications</div>
          </Tile>
        </Column>

        <Column sm={4} md={4} lg={4}>
          <Tile className="stat-card stat-card--published">
            <div className="stat-card__value">{overview?.publishedPublications || 0}</div>
            <div className="stat-card__label">Published</div>
          </Tile>
        </Column>

        <Column sm={4} md={4} lg={4}>
          <Tile className="stat-card stat-card--draft">
            <div className="stat-card__value">{overview?.draftPublications || 0}</div>
            <div className="stat-card__label">Drafts</div>
          </Tile>
        </Column>

        <Column sm={4} md={4} lg={4}>
          <Tile className="stat-card stat-card--views">
            <div className="stat-card__value">{overview?.totalViews || 0}</div>
            <div className="stat-card__label">Total Views</div>
          </Tile>
        </Column>

        {/* Recent Activity */}
        <Column sm={4} md={8} lg={10}>
          <Tile className="dashboard-section">
            <h3 className="dashboard-section__title">Recent Activity</h3>
            {recentActivity && recentActivity.length > 0 ? (
              <StructuredListWrapper>
                <StructuredListHead>
                  <StructuredListRow head>
                    <StructuredListCell head>Action</StructuredListCell>
                    <StructuredListCell head>User</StructuredListCell>
                    <StructuredListCell head>Resource</StructuredListCell>
                    <StructuredListCell head>Time</StructuredListCell>
                  </StructuredListRow>
                </StructuredListHead>
                <StructuredListBody>
                  {recentActivity.map((activity) => (
                    <StructuredListRow key={activity.id}>
                      <StructuredListCell>
                        <span className={`action-badge ${getActionClass(activity.action)}`}>
                          {activity.action}
                        </span>
                      </StructuredListCell>
                      <StructuredListCell>{activity.user_email}</StructuredListCell>
                      <StructuredListCell>
                        {activity.resource_type}
                        {activity.resource_id && ` (${activity.resource_id.substring(0, 8)}...)`}
                      </StructuredListCell>
                      <StructuredListCell>{formatDate(activity.timestamp)}</StructuredListCell>
                    </StructuredListRow>
                  ))}
                </StructuredListBody>
              </StructuredListWrapper>
            ) : (
              <p className="dashboard-section__empty">No recent activity</p>
            )}
          </Tile>
        </Column>

        {/* Top Viewed Publications */}
        <Column sm={4} md={8} lg={6}>
          <Tile className="dashboard-section">
            <h3 className="dashboard-section__title">Top Viewed</h3>
            {topViewed && topViewed.length > 0 ? (
              <div className="top-viewed-list">
                {topViewed.map((pub) => (
                  <div key={pub.id} className="top-viewed-item">
                    <div className="top-viewed-item__title">{pub.title}</div>
                    <div className="top-viewed-item__meta">
                      <span className="top-viewed-item__views">{pub.view_count} views</span>
                      <span className={`top-viewed-item__status status-${pub.status}`}>
                        {pub.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="dashboard-section__empty">No publications yet</p>
            )}
          </Tile>
        </Column>
      </Grid>
    </div>
  );
};

export default AdminDashboard;

// Made with Bob
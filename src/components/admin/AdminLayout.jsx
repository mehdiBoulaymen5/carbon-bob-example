/**
 * Admin Layout Component
 * 
 * Provides the main layout structure for admin pages including header,
 * navigation, and content area. Uses Carbon Design System components.
 */

import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Header,
  HeaderContainer,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
  HeaderPanel,
  Switcher,
  SwitcherItem,
  SideNav,
  SideNavItems,
  SideNavLink,
  SkipToContent,
  Content,
} from '@carbon/react';
import { UserAvatar, Logout } from '@carbon/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import './AdminLayout.scss';

/**
 * AdminLayout component
 * @returns {React.ReactElement} Admin layout with navigation
 */
const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  /**
   * Check if route is active
   * @param {string} path - Route path to check
   * @returns {boolean} True if route is active
   */
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <HeaderContainer
      render={({ isSideNavExpanded, onClickSideNavExpand }) => (
        <>
          <Header aria-label="Admin Dashboard">
            <SkipToContent />
            <HeaderName href="/admin/dashboard" prefix="IBM">
              Admin Dashboard
            </HeaderName>
            <HeaderNavigation aria-label="Admin Navigation">
              <HeaderMenuItem
                href="/admin/dashboard"
                isCurrentPage={isActive('/admin/dashboard')}
              >
                Dashboard
              </HeaderMenuItem>
              <HeaderMenuItem
                href="/admin/publications"
                isCurrentPage={isActive('/admin/publications')}
              >
                Use Cases
              </HeaderMenuItem>
              <HeaderMenuItem
                href="/admin/audit-logs"
                isCurrentPage={isActive('/admin/audit-logs')}
              >
                Audit Logs
              </HeaderMenuItem>
            </HeaderNavigation>
            <HeaderGlobalBar>
              <HeaderGlobalAction
                aria-label="User menu"
                tooltipAlignment="end"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                isActive={isUserMenuOpen}
              >
                <UserAvatar size={20} />
              </HeaderGlobalAction>
            </HeaderGlobalBar>
            <HeaderPanel
              aria-label="User menu panel"
              expanded={isUserMenuOpen}
            >
              <Switcher aria-label="User menu">
                <SwitcherItem aria-label="User info" disabled>
                  <div className="admin-layout__user-info">
                    <strong>{user?.name || 'Admin User'}</strong>
                    <span>{user?.email}</span>
                  </div>
                </SwitcherItem>
                <SwitcherItem
                  aria-label="Logout"
                  onClick={handleLogout}
                >
                  <Logout size={16} />
                  <span>Logout</span>
                </SwitcherItem>
              </Switcher>
            </HeaderPanel>
            <SideNav
              aria-label="Side navigation"
              expanded={isSideNavExpanded}
              onOverlayClick={onClickSideNavExpand}
              isPersistent={false}
            >
              <SideNavItems>
                <SideNavLink
                  href="/admin/dashboard"
                  isActive={isActive('/admin/dashboard')}
                >
                  Dashboard
                </SideNavLink>
                <SideNavLink
                  href="/admin/publications"
                  isActive={isActive('/admin/publications')}
                >
                  Use Cases
                </SideNavLink>
                <SideNavLink
                  href="/admin/audit-logs"
                  isActive={isActive('/admin/audit-logs')}
                >
                  Audit Logs
                </SideNavLink>
              </SideNavItems>
            </SideNav>
          </Header>
          <Content className="admin-layout__content">
            <Outlet />
          </Content>
        </>
      )}
    />
  );
};

export default AdminLayout;

// Made with Bob
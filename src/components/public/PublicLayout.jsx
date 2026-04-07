/**
 * PublicLayout Component
 * 
 * Provides the main layout structure for public-facing pages including
 * header, navigation, and content area with improved styling and footer.
 */

import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Header,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
  Content,
  Grid,
  Column,
} from '@carbon/react';
import { Login } from '@carbon/icons-react';
import './PublicLayout.scss';

/**
 * PublicLayout component
 * @returns {React.ReactElement} Public layout with navigation
 */
const PublicLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  /**
   * Check if route is active
   * @param {string} path - Route path
   * @returns {boolean} True if route is active
   */
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="public-layout">
      <Header aria-label="Bob Demo Catalog">
        <HeaderName element={Link} to="/" prefix="IBM">
          Bob Demo Catalog
        </HeaderName>
        <HeaderNavigation aria-label="Main Navigation">
          <HeaderMenuItem 
            element={Link} 
            to="/"
            isActive={isActive('/')}
          >
            Home
          </HeaderMenuItem>
          <HeaderMenuItem 
            element={Link} 
            to="/publications"
            isActive={isActive('/publications')}
          >
            Publications
          </HeaderMenuItem>
        </HeaderNavigation>
        <HeaderGlobalBar>
          <HeaderGlobalAction
            aria-label="Admin Login"
            tooltipAlignment="end"
            onClick={() => navigate('/admin/login')}
          >
            <Login size={20} />
          </HeaderGlobalAction>
        </HeaderGlobalBar>
      </Header>
      
      <Content>
        <Outlet />
      </Content>
      
      <footer className="public-layout__footer">
        <Grid>
          <Column sm={4} md={8} lg={16}>
            <div className="public-layout__footer-content">
              <div className="public-layout__footer-section">
                <h3 className="public-layout__footer-title">Bob Demo Catalog</h3>
                <p className="public-layout__footer-description">
                  Explore our collection of IBM Bob demonstrations and examples
                </p>
              </div>
              
              <div className="public-layout__footer-section">
                <h4 className="public-layout__footer-subtitle">Quick Links</h4>
                <nav className="public-layout__footer-nav">
                  <Link to="/" className="public-layout__footer-link">
                    Home
                  </Link>
                  <Link to="/publications" className="public-layout__footer-link">
                    Publications
                  </Link>
                  <a 
                    href="/admin/login" 
                    className="public-layout__footer-link"
                  >
                    Admin Login
                  </a>
                </nav>
              </div>
              
              <div className="public-layout__footer-section">
                <h4 className="public-layout__footer-subtitle">Resources</h4>
                <nav className="public-layout__footer-nav">
                  <a 
                    href="https://www.ibm.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="public-layout__footer-link"
                  >
                    IBM.com
                  </a>
                  <a 
                    href="https://carbondesignsystem.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="public-layout__footer-link"
                  >
                    Carbon Design System
                  </a>
                </nav>
              </div>
            </div>
            
            <div className="public-layout__footer-bottom">
              <p className="public-layout__footer-copyright">
                &copy; {new Date().getFullYear()} IBM Bob Demo Catalog. All rights reserved.
              </p>
            </div>
          </Column>
        </Grid>
      </footer>
    </div>
  );
};

export default PublicLayout;

// Made with Bob
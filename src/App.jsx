import { Theme, Header, HeaderName, HeaderNavigation, HeaderMenuItem, Grid, Column } from '@carbon/react';
import DemoCatalog from './components/DemoCatalog';
import './App.scss';

function App() {
  return (
    <Theme theme="g10">
      <Header aria-label="Bob Demo Catalog">
        <HeaderName href="#" prefix="IBM">
          Bob Demo Catalog
        </HeaderName>
        <HeaderNavigation aria-label="Bob Demo Catalog">
          <HeaderMenuItem href="#demos">Demos</HeaderMenuItem>
          <HeaderMenuItem href="#about">About</HeaderMenuItem>
          <HeaderMenuItem href="#contact">Contact</HeaderMenuItem>
        </HeaderNavigation>
      </Header>

      <Grid className="main-content">
        <Column sm={4} md={8} lg={16}>
          <div className="hero-section">
            <h1>Bob Demo Catalog</h1>
            <p>Explore our collection of IBM Bob demonstrations and examples</p>
          </div>
        </Column>
      </Grid>

      <DemoCatalog />

      <Grid className="footer-section">
        <Column sm={4} md={8} lg={16}>
          <footer>
            <p>&copy; 2026 IBM Bob Demo Catalog. All rights reserved.</p>
          </footer>
        </Column>
      </Grid>
    </Theme>
  );
}

export default App;

// Made with Bob

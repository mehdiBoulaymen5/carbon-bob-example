# Testing Guide

Comprehensive testing documentation for the Bob Demo Catalog application.

## Table of Contents

- [Testing Strategy Overview](#testing-strategy-overview)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Manual Testing Checklist](#manual-testing-checklist)
- [Security Testing](#security-testing)
- [Performance Testing](#performance-testing)
- [Browser Compatibility Testing](#browser-compatibility-testing)
- [Mobile Responsiveness Testing](#mobile-responsiveness-testing)
- [Accessibility Testing](#accessibility-testing)
- [Test Data Setup](#test-data-setup)
- [Common Testing Issues](#common-testing-issues)

## Testing Strategy Overview

### Testing Pyramid

Our testing strategy follows the testing pyramid approach:

```
        /\
       /  \      E2E Tests (10%)
      /____\     - Critical user flows
     /      \    - Cross-browser testing
    /        \   
   /__________\  Integration Tests (30%)
  /            \ - API endpoints
 /              \- Database operations
/________________\ Unit Tests (60%)
                  - Functions, components
                  - Business logic
```

### Testing Goals

- **Code Coverage**: Aim for 80%+ coverage
- **Critical Path**: 100% coverage of authentication and publication management
- **Regression Prevention**: Automated tests for all bug fixes
- **Performance**: Response times under 200ms for API calls
- **Security**: All security features tested

### Testing Tools

#### Backend
- **Jest**: Unit and integration testing
- **Supertest**: API endpoint testing
- **pg-mem**: In-memory PostgreSQL for tests

#### Frontend
- **Vitest**: Unit testing (Vite-native)
- **React Testing Library**: Component testing
- **Playwright** or **Cypress**: E2E testing

## Unit Testing

### Backend Unit Tests

#### Testing Controllers

**Location**: `backend/src/controllers/__tests__/`

**Example Test Structure**:

```javascript
// auth.controller.test.js
const authController = require('../auth.controller');
const authService = require('../../services/auth.service');

jest.mock('../../services/auth.service');

describe('Auth Controller', () => {
  describe('login', () => {
    it('should return token on successful login', async () => {
      const req = {
        body: { email: 'admin@example.com', password: 'password123' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      
      authService.login.mockResolvedValue({
        token: 'jwt-token',
        user: { id: '1', email: 'admin@example.com' }
      });
      
      await authController.login(req, res);
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({ token: 'jwt-token' })
      });
    });
    
    it('should return 401 on invalid credentials', async () => {
      // Test implementation
    });
  });
});
```

#### Testing Utilities

**Location**: `backend/src/utils/__tests__/`

**Test Cases**:
- JWT token generation and verification
- Password hashing and comparison
- Audit log creation
- Input sanitization

**Example**:

```javascript
// jwt.test.js
const jwt = require('../jwt');

describe('JWT Utilities', () => {
  describe('generateToken', () => {
    it('should generate valid JWT token', () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const token = jwt.generateToken(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });
  });
  
  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const payload = { userId: '123' };
      const token = jwt.generateToken(payload);
      const decoded = jwt.verifyToken(token);
      
      expect(decoded.userId).toBe('123');
    });
    
    it('should throw error for invalid token', () => {
      expect(() => jwt.verifyToken('invalid-token')).toThrow();
    });
  });
});
```

#### Testing Middleware

**Location**: `backend/src/middleware/__tests__/`

**Test Cases**:
- Authentication middleware
- Authorization checks
- Input validation
- CSRF protection
- Rate limiting

### Frontend Unit Tests

#### Testing Components

**Location**: `src/components/**/__tests__/`

**Example Test Structure**:

```javascript
// AdminLogin.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminLogin from '../AdminLogin';
import { AuthProvider } from '../../../contexts/AuthContext';

describe('AdminLogin', () => {
  it('renders login form', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <AdminLogin />
        </AuthProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
  
  it('shows validation errors for empty fields', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <AdminLogin />
        </AuthProvider>
      </BrowserRouter>
    );
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });
});
```

#### Testing Hooks

**Location**: `src/hooks/__tests__/`

**Test Cases**:
- Custom hooks behavior
- State management
- Side effects

#### Testing Services

**Location**: `src/services/__tests__/`

**Test Cases**:
- API service methods
- Error handling
- Request/response formatting

**Example**:

```javascript
// publication.service.test.js
import publicationService from '../publication.service';
import api from '../api';

jest.mock('../api');

describe('Publication Service', () => {
  describe('getAllPublications', () => {
    it('should fetch publications with pagination', async () => {
      const mockData = {
        publications: [{ id: '1', title: 'Test' }],
        pagination: { page: 1, totalPages: 1 }
      };
      
      api.get.mockResolvedValue({ data: { data: mockData } });
      
      const result = await publicationService.getAllPublications(1, 20);
      
      expect(api.get).toHaveBeenCalledWith('/admin/publications', {
        params: expect.objectContaining({ page: 1, limit: 20 })
      });
      expect(result).toEqual(mockData);
    });
  });
});
```

### Running Unit Tests

#### Backend Tests

```bash
cd backend
npm test                    # Run all tests
npm test -- --coverage      # Run with coverage
npm test -- --watch         # Watch mode
npm test auth.controller    # Run specific test file
```

#### Frontend Tests

```bash
npm test                    # Run all tests
npm test -- --coverage      # Run with coverage
npm test -- --watch         # Watch mode
npm test AdminLogin         # Run specific test file
```

## Integration Testing

### API Endpoint Testing

**Location**: `backend/src/__tests__/integration/`

#### Authentication Endpoints

```javascript
// auth.integration.test.js
const request = require('supertest');
const app = require('../../server');
const db = require('../../config/database');

describe('Authentication API', () => {
  beforeAll(async () => {
    // Setup test database
    await db.query('DELETE FROM users WHERE email LIKE \'%test%\'');
  });
  
  afterAll(async () => {
    // Cleanup
    await db.closePool();
  });
  
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'correct-password'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });
    
    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'wrong-password'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
    
    it('should enforce rate limiting', async () => {
      // Make multiple requests to trigger rate limit
      const requests = Array(101).fill().map(() =>
        request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'test' })
      );
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);
      
      expect(rateLimited).toBe(true);
    });
  });
});
```

#### Publication Endpoints

```javascript
// publications.integration.test.js
describe('Publications API', () => {
  let authToken;
  let testPublicationId;
  
  beforeAll(async () => {
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password' });
    
    authToken = loginResponse.body.data.token;
  });
  
  describe('POST /api/admin/publications', () => {
    it('should create publication with valid data', async () => {
      const response = await request(app)
        .post('/api/admin/publications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Publication',
          description: 'Test description',
          topics: ['AI', 'ML'],
          audience: ['Developers'],
          industries: ['Technology'],
          status: 'published'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      
      testPublicationId = response.body.data.id;
    });
    
    it('should reject publication without authentication', async () => {
      const response = await request(app)
        .post('/api/admin/publications')
        .send({ title: 'Test' });
      
      expect(response.status).toBe(401);
    });
  });
  
  describe('GET /api/publications', () => {
    it('should return published publications', async () => {
      const response = await request(app)
        .get('/api/publications')
        .query({ page: 1, limit: 20 });
      
      expect(response.status).toBe(200);
      expect(response.body.data.publications).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toBeDefined();
    });
  });
});
```

### Database Integration Tests

**Test Cases**:
- CRUD operations
- Transaction handling
- Constraint validation
- Index performance
- Full-text search

```javascript
// database.integration.test.js
describe('Database Operations', () => {
  describe('Publications Table', () => {
    it('should enforce unique constraints', async () => {
      // Test duplicate prevention
    });
    
    it('should cascade deletes properly', async () => {
      // Test foreign key constraints
    });
    
    it('should perform full-text search', async () => {
      const result = await db.query(`
        SELECT * FROM publications
        WHERE to_tsvector('english', title || ' ' || description)
        @@ to_tsquery('english', 'AI & machine')
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
    });
  });
});
```

### SSE Connection Testing

```javascript
// sse.integration.test.js
describe('SSE Connections', () => {
  it('should establish public SSE connection', (done) => {
    const EventSource = require('eventsource');
    const es = new EventSource('http://localhost:3000/api/events');
    
    es.onopen = () => {
      expect(es.readyState).toBe(EventSource.OPEN);
      es.close();
      done();
    };
    
    es.onerror = (error) => {
      done(error);
    };
  });
  
  it('should receive publication events', (done) => {
    const es = new EventSource('http://localhost:3000/api/events');
    
    es.addEventListener('publication:created', (event) => {
      const data = JSON.parse(event.data);
      expect(data.type).toBe('publication:created');
      expect(data.data).toBeDefined();
      es.close();
      done();
    });
    
    // Trigger event by creating publication
    setTimeout(() => {
      request(app)
        .post('/api/admin/publications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ /* publication data */ });
    }, 100);
  });
});
```

## End-to-End Testing

### E2E Testing Setup

**Tool**: Playwright or Cypress

**Installation**:

```bash
# Playwright
npm install -D @playwright/test

# Cypress
npm install -D cypress
```

### Critical User Flows

#### 1. Admin Authentication Flow

```javascript
// e2e/admin-auth.spec.js
import { test, expect } from '@playwright/test';

test.describe('Admin Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('http://localhost:5173/admin/login');
    
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*admin\/dashboard/);
    await expect(page.locator('h1')).toContainText('Dashboard');
  });
  
  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:5173/admin/login');
    
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'wrong-password');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error-message')).toBeVisible();
  });
  
  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/admin/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Logout
    await page.click('button[aria-label="User menu"]');
    await page.click('text=Logout');
    
    await expect(page).toHaveURL(/.*admin\/login/);
  });
});
```

#### 2. Publication Management Flow

```javascript
// e2e/publication-management.spec.js
test.describe('Publication Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://localhost:5173/admin/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*admin\/dashboard/);
  });
  
  test('should create new publication', async ({ page }) => {
    await page.goto('http://localhost:5173/admin/publications');
    await page.click('button:has-text("Add Publication")');
    
    await page.fill('input[name="title"]', 'E2E Test Publication');
    await page.fill('textarea[name="description"]', 'Test description');
    await page.selectOption('select[name="status"]', 'published');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.success-notification')).toBeVisible();
    await expect(page.locator('text=E2E Test Publication')).toBeVisible();
  });
  
  test('should edit existing publication', async ({ page }) => {
    await page.goto('http://localhost:5173/admin/publications');
    
    // Find and click edit button for first publication
    await page.click('button[aria-label="Edit"]:first-of-type');
    
    await page.fill('input[name="title"]', 'Updated Title');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.success-notification')).toBeVisible();
    await expect(page.locator('text=Updated Title')).toBeVisible();
  });
  
  test('should delete publication', async ({ page }) => {
    await page.goto('http://localhost:5173/admin/publications');
    
    await page.click('button[aria-label="Delete"]:first-of-type');
    await page.click('button:has-text("Delete")'); // Confirm
    
    await expect(page.locator('.success-notification')).toBeVisible();
  });
  
  test('should perform bulk delete', async ({ page }) => {
    await page.goto('http://localhost:5173/admin/publications');
    
    // Select multiple publications
    await page.click('input[type="checkbox"]:nth-of-type(1)');
    await page.click('input[type="checkbox"]:nth-of-type(2)');
    
    await page.click('button:has-text("Delete selected")');
    await page.click('button:has-text("Delete")'); // Confirm
    
    await expect(page.locator('.success-notification')).toBeVisible();
  });
});
```

#### 3. Real-time Updates Flow

```javascript
// e2e/realtime-updates.spec.js
test.describe('Real-time Updates', () => {
  test('should receive real-time updates across tabs', async ({ browser }) => {
    // Open two browser contexts (tabs)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Navigate both to publications page
    await page1.goto('http://localhost:5173/publications');
    await page2.goto('http://localhost:5173/publications');
    
    // Login in admin tab and create publication
    const adminPage = await context1.newPage();
    await adminPage.goto('http://localhost:5173/admin/login');
    await adminPage.fill('input[name="email"]', 'admin@example.com');
    await adminPage.fill('input[name="password"]', 'password123');
    await adminPage.click('button[type="submit"]');
    
    await adminPage.goto('http://localhost:5173/admin/publications');
    await adminPage.click('button:has-text("Add Publication")');
    await adminPage.fill('input[name="title"]', 'Real-time Test');
    await adminPage.fill('textarea[name="description"]', 'Test');
    await adminPage.selectOption('select[name="status"]', 'published');
    await adminPage.click('button[type="submit"]');
    
    // Check if both public pages received the update
    await expect(page1.locator('text=Real-time Test')).toBeVisible({ timeout: 5000 });
    await expect(page2.locator('text=Real-time Test')).toBeVisible({ timeout: 5000 });
    
    await context1.close();
    await context2.close();
  });
});
```

### Running E2E Tests

```bash
# Playwright
npx playwright test
npx playwright test --headed        # With browser UI
npx playwright test --debug         # Debug mode
npx playwright show-report          # View report

# Cypress
npx cypress open                    # Interactive mode
npx cypress run                     # Headless mode
npx cypress run --spec "e2e/admin-auth.spec.js"  # Specific test
```

## Manual Testing Checklist

### Authentication Testing

#### Login Functionality
- [ ] Login with valid credentials succeeds
- [ ] Login with invalid email shows error
- [ ] Login with invalid password shows error
- [ ] Login with empty fields shows validation errors
- [ ] Login form shows loading state during authentication
- [ ] Successful login redirects to dashboard
- [ ] Failed login shows appropriate error message
- [ ] Remember me functionality works (if implemented)
- [ ] Password visibility toggle works
- [ ] Rate limiting prevents brute force attacks

#### Session Management
- [ ] User stays logged in after page refresh
- [ ] Session expires after configured time
- [ ] Expired session redirects to login
- [ ] Logout clears session completely
- [ ] Logout redirects to login page
- [ ] Multiple tabs maintain same session
- [ ] Session persists across browser restarts (if remember me)

#### Authorization
- [ ] Unauthenticated users cannot access admin routes
- [ ] Authenticated users can access admin routes
- [ ] Direct URL access to admin routes requires authentication
- [ ] API calls include authentication token
- [ ] Expired tokens are handled gracefully

### Publication Management Testing

#### Create Publication
- [ ] Add Publication button opens form
- [ ] All required fields are marked
- [ ] Form validation works for each field
- [ ] Title field accepts valid input (3-200 characters)
- [ ] Description field accepts valid input
- [ ] Topics can be added and removed
- [ ] Audience can be selected
- [ ] Industries can be selected
- [ ] Git source URL validation works
- [ ] Box source URL validation works
- [ ] Icon selection works
- [ ] Status can be set to draft or published
- [ ] Metadata field accepts JSON
- [ ] Form shows loading state during submission
- [ ] Success notification appears after creation
- [ ] New publication appears in list
- [ ] Published publication appears on public site
- [ ] Draft publication does not appear on public site
- [ ] Cancel button discards changes
- [ ] Form resets after successful submission

#### Read/View Publications
- [ ] Publications list loads correctly
- [ ] Pagination works correctly
- [ ] Page size selector works
- [ ] Publications display all relevant information
- [ ] Status badges show correct colors
- [ ] View counts display correctly
- [ ] Created/updated dates format correctly
- [ ] Empty state shows when no publications
- [ ] Loading skeleton shows while fetching
- [ ] Error state shows on fetch failure

#### Update Publication
- [ ] Edit button opens form with existing data
- [ ] All fields populate with current values
- [ ] Changes can be made to any field
- [ ] Validation works on update
- [ ] Save button updates publication
- [ ] Success notification appears
- [ ] Updated data reflects in list
- [ ] Changing status from draft to published works
- [ ] Changing status from published to draft works
- [ ] Cancel button discards changes
- [ ] Unsaved changes warning appears (if implemented)

#### Delete Publication
- [ ] Delete button shows confirmation modal
- [ ] Confirmation modal displays publication title
- [ ] Cancel button closes modal without deleting
- [ ] Confirm button deletes publication
- [ ] Success notification appears after deletion
- [ ] Publication removed from list
- [ ] Deleted publication removed from public site
- [ ] Audit log records deletion

#### Bulk Operations
- [ ] Checkbox selection works for multiple publications
- [ ] Select all checkbox works
- [ ] Bulk delete button appears when items selected
- [ ] Bulk delete shows count of selected items
- [ ] Bulk delete confirmation modal appears
- [ ] Bulk delete removes all selected publications
- [ ] Success notification shows count deleted
- [ ] Selection clears after bulk operation

### Search and Filter Testing

#### Search Functionality
- [ ] Search input accepts text
- [ ] Search triggers on Enter key
- [ ] Search triggers on button click
- [ ] Search results update correctly
- [ ] Search works for title matches
- [ ] Search works for description matches
- [ ] Search is case-insensitive
- [ ] Search handles special characters
- [ ] Clear search button works
- [ ] Empty search shows all results
- [ ] No results message appears when appropriate

#### Filter Functionality
- [ ] Status filter dropdown works
- [ ] Filtering by published status works
- [ ] Filtering by draft status works
- [ ] Topic filter works
- [ ] Industry filter works
- [ ] Multiple filters can be combined
- [ ] Clear filters button works
- [ ] Filters persist during pagination
- [ ] Filter count badge shows active filters

#### Sorting
- [ ] Sort by created date works (ascending/descending)
- [ ] Sort by updated date works
- [ ] Sort by title works (alphabetically)
- [ ] Sort by view count works
- [ ] Sort direction toggle works
- [ ] Sort persists during pagination
- [ ] Sort indicator shows current sort

### Pagination Testing
- [ ] First page loads correctly
- [ ] Next page button works
- [ ] Previous page button works
- [ ] Page number buttons work
- [ ] First page button works
- [ ] Last page button works
- [ ] Page size selector works (10, 20, 50, 100)
- [ ] Pagination info shows correct counts
- [ ] Pagination disabled when only one page
- [ ] Pagination resets when filters change

### Real-time Updates Testing

#### SSE Connection
- [ ] SSE connection establishes on page load
- [ ] Connection status indicator shows connected
- [ ] Connection reconnects after disconnect
- [ ] Heartbeat keeps connection alive
- [ ] Connection closes on page unload

#### Public Updates
- [ ] New published publication appears automatically
- [ ] Updated publication reflects changes
- [ ] Deleted publication disappears
- [ ] Updates appear without page refresh
- [ ] Multiple clients receive same updates
- [ ] Update notifications appear (if implemented)

#### Admin Updates
- [ ] Admin receives all publication events
- [ ] Dashboard stats update in real-time
- [ ] Publication list updates automatically
- [ ] Audit logs update in real-time
- [ ] Updates from other admin sessions appear

### Public Viewing Testing

#### Publications Page
- [ ] Public publications page loads
- [ ] Only published publications appear
- [ ] Publications display correctly
- [ ] Filters work on public page
- [ ] Search works on public page
- [ ] Pagination works on public page
- [ ] Publication cards show all information
- [ ] Publication cards are clickable

#### Publication Detail Page
- [ ] Detail page loads for valid publication
- [ ] All publication information displays
- [ ] Related publications show
- [ ] View count increments
- [ ] Back button works
- [ ] 404 page shows for invalid ID
- [ ] Draft publications return 404

### Audit Log Testing
- [ ] Audit logs page loads
- [ ] All actions are logged
- [ ] Login events appear
- [ ] Logout events appear
- [ ] Create events appear with details
- [ ] Update events show changes
- [ ] Delete events appear
- [ ] Filters work (action, date range)
- [ ] Pagination works
- [ ] User information displays correctly
- [ ] IP address and user agent recorded
- [ ] Timestamps are accurate

### Error Handling Testing

#### Network Errors
- [ ] Network error shows user-friendly message
- [ ] Retry mechanism works
- [ ] Offline state detected
- [ ] Connection restored notification

#### Validation Errors
- [ ] Field-level validation errors display
- [ ] Form-level validation errors display
- [ ] Error messages are clear and helpful
- [ ] Errors clear when corrected

#### Server Errors
- [ ] 500 errors show generic message
- [ ] 404 errors show not found message
- [ ] 401 errors redirect to login
- [ ] 403 errors show permission denied
- [ ] Error boundaries catch React errors

#### Edge Cases
- [ ] Very long titles handled
- [ ] Very long descriptions handled
- [ ] Special characters in input handled
- [ ] Empty arrays handled
- [ ] Null values handled
- [ ] Concurrent edits handled

## Security Testing

### Authentication Security

#### Password Security
- [ ] Passwords are hashed (not stored in plain text)
- [ ] Password minimum length enforced (8 characters)
- [ ] Password complexity requirements work (if implemented)
- [ ] Password visibility toggle doesn't expose password in DOM
- [ ] Failed login attempts are rate limited
- [ ] Account lockout after multiple failures (if implemented)

#### Token Security
- [ ] JWT tokens are properly signed
- [ ] Token expiration is enforced
- [ ] Expired tokens are rejected
- [ ] Invalid tokens are rejected
- [ ] Tokens are not exposed in URLs
- [ ] Tokens are stored securely (httpOnly cookies or secure storage)
- [ ] Token refresh mechanism works
- [ ] Refresh tokens are properly validated

### Authorization Testing
- [ ] Admin-only routes require authentication
- [ ] API endpoints enforce authorization
- [ ] Users cannot access other users' data
- [ ] Role-based access control works
- [ ] Privilege escalation is prevented

### CSRF Protection
- [ ] CSRF tokens are generated
- [ ] CSRF tokens are validated on state-changing requests
- [ ] Missing CSRF token returns 403
- [ ] Invalid CSRF token returns 403
- [ ] CSRF tokens are unique per session
- [ ] CSRF protection works with AJAX requests

### XSS Prevention
- [ ] User input is sanitized
- [ ] HTML entities are escaped in output
- [ ] Script tags in input are neutralized
- [ ] Event handlers in input are removed
- [ ] React's built-in XSS protection works
- [ ] Content Security Policy headers present

### SQL Injection Prevention
- [ ] Parameterized queries are used
- [ ] User input is validated before database queries
- [ ] Special SQL characters are escaped
- [ ] ORM/query builder prevents injection
- [ ] Database errors don't expose schema

### Rate Limiting
- [ ] Rate limiting is enforced (100 requests per 15 minutes)
- [ ] Rate limit headers are present
- [ ] Rate limit exceeded returns 429
- [ ] Rate limit resets after window
- [ ] Different endpoints have appropriate limits
- [ ] Rate limiting doesn't affect legitimate users

### Input Validation
- [ ] All input fields are validated
- [ ] Server-side validation matches client-side
- [ ] Validation errors are descriptive
- [ ] Invalid data types are rejected
- [ ] Array inputs are validated
- [ ] JSON inputs are validated
- [ ] URL inputs are validated
- [ ] Email format is validated

### Security Headers
- [ ] X-Content-Type-Options: nosniff present
- [ ] X-Frame-Options: DENY present
- [ ] X-XSS-Protection: 1; mode=block present
- [ ] Strict-Transport-Security present (HTTPS)
- [ ] Content-Security-Policy present
- [ ] Referrer-Policy present

## Performance Testing

### API Performance

#### Response Time Testing

**Tools**: Apache Bench, Artillery, k6

**Test Scenarios**:

```bash
# Test login endpoint
ab -n 1000 -c 10 -p login.json -T application/json \
  http://localhost:3000/api/auth/login

# Test publications list
ab -n 1000 -c 10 \
  http://localhost:3000/api/publications?page=1&limit=20
```

**Performance Targets**:
- Login: < 200ms average
- Publications list: < 150ms average
- Publication detail: < 100ms average
- Create publication: < 300ms average
- Update publication: < 250ms average
- Delete publication: < 200ms average

#### Load Testing

**Artillery Configuration** (`artillery-config.yml`):

```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"
scenarios:
  - name: "Browse publications"
    flow:
      - get:
          url: "/api/publications?page=1&limit=20"
      - think: 2
      - get:
          url: "/api/publications/{{ $randomString() }}"
```

**Run Load Test**:

```bash
artillery run artillery-config.yml
```

**Success Criteria**:
- 95th percentile response time < 500ms
- Error rate < 1%
- Throughput > 100 requests/second

### Database Performance

#### Query Performance
- [ ] Publications list query < 50ms
- [ ] Full-text search query < 100ms
- [ ] Audit log query < 75ms
- [ ] Dashboard stats query < 150ms
- [ ] Indexes are used effectively
- [ ] No N+1 query problems

#### Connection Pool
- [ ] Connection pool size is appropriate
- [ ] Connections are reused
- [ ] No connection leaks
- [ ] Pool handles high load

### Frontend Performance

#### Page Load Performance

**Tools**: Lighthouse, WebPageTest

**Metrics to Test**:
- [ ] First Contentful Paint (FCP) < 1.5s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Time to Interactive (TTI) < 3.5s
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] First Input Delay (FID) < 100ms

#### Bundle Size
- [ ] Main bundle < 500KB (gzipped)
- [ ] Vendor bundle < 300KB (gzipped)
- [ ] Code splitting implemented
- [ ] Lazy loading for routes
- [ ] Tree shaking enabled

#### Runtime Performance
- [ ] Component render time < 16ms (60fps)
- [ ] No memory leaks
- [ ] Event handlers cleaned up
- [ ] Large lists virtualized
- [ ] Images optimized and lazy loaded

### SSE Performance
- [ ] Connection establishment < 100ms
- [ ] Event delivery latency < 50ms
- [ ] Handles 100+ concurrent connections
- [ ] Reconnection works reliably
- [ ] No memory leaks in long-running connections

## Browser Compatibility Testing

### Supported Browsers

| Browser | Minimum Version | Status |
|---------|----------------|--------|
| Chrome | 90+ | ✅ Primary |
| Firefox | 88+ | ✅ Primary |
| Safari | 14+ | ✅ Primary |
| Edge | 90+ | ✅ Primary |
| Opera | 76+ | ⚠️ Secondary |

### Testing Checklist

#### Chrome
- [ ] All features work
- [ ] Layout renders correctly
- [ ] Animations smooth
- [ ] DevTools work
- [ ] Extensions don't interfere

#### Firefox
- [ ] All features work
- [ ] Layout renders correctly
- [ ] Animations smooth
- [ ] Developer tools work
- [ ] Privacy features don't break functionality

#### Safari
- [ ] All features work
- [ ] Layout renders correctly
- [ ] Animations smooth
- [ ] iOS Safari works
- [ ] Private browsing works

#### Edge
- [ ] All features work
- [ ] Layout renders correctly
- [ ] Chromium features work
- [ ] IE mode not required

### Cross-Browser Issues

**Common Issues to Test**:
- [ ] CSS Grid/Flexbox compatibility
- [ ] ES6+ features support
- [ ] Fetch API support
- [ ] EventSource (SSE) support
- [ ] LocalStorage support
- [ ] Date/Time formatting
- [ ] File upload
- [ ] Copy to clipboard

## Mobile Responsiveness Testing

### Device Testing Matrix

| Device Type | Screen Size | Test Priority |
|-------------|-------------|---------------|
| Mobile | 320px - 480px | High |
| Tablet | 768px - 1024px | High |
| Desktop | 1280px+ | High |
| Large Desktop | 1920px+ | Medium |

### Responsive Breakpoints

```scss
// Mobile: < 672px
// Tablet: 672px - 1056px
// Desktop: 1056px - 1312px
// Large: > 1312px
```

### Mobile Testing Checklist

#### Layout
- [ ] Content fits screen width
- [ ] No horizontal scrolling
- [ ] Text is readable without zooming
- [ ] Images scale appropriately
- [ ] Navigation is accessible
- [ ] Forms are usable
- [ ] Buttons are tap-friendly (44x44px minimum)

#### Touch Interactions
- [ ] Tap targets are large enough
- [ ] Swipe gestures work (if implemented)
- [ ] Pinch to zoom works
- [ ] Long press works
- [ ] No accidental taps

#### Performance
- [ ] Page loads quickly on 3G
- [ ] Images are optimized
- [ ] Minimal JavaScript execution
- [ ] Smooth scrolling
- [ ] No jank during interactions

#### Specific Components
- [ ] Admin login form works on mobile
- [ ] Dashboard is usable on mobile
- [ ] Publication list scrolls smoothly
- [ ] Publication form is usable
- [ ] Modals work on mobile
- [ ] Dropdowns work on mobile
- [ ] Date pickers work on mobile

### Testing Tools
- Chrome DevTools Device Mode
- Firefox Responsive Design Mode
- BrowserStack
- Real devices (iOS, Android)

## Accessibility Testing

### WCAG 2.1 Compliance

**Target Level**: AA

### Testing Checklist

#### Keyboard Navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] No keyboard traps
- [ ] Skip links work
- [ ] Escape key closes modals
- [ ] Enter/Space activate buttons
- [ ] Arrow keys navigate lists/menus

#### Screen Reader Testing

**Tools**: NVDA (Windows), JAWS (Windows), VoiceOver (Mac/iOS)

- [ ] All images have alt text
- [ ] Form labels are associated with inputs
- [ ] Error messages are announced
- [ ] Success messages are announced
- [ ] Loading states are announced
- [ ] Dynamic content updates announced
- [ ] ARIA labels are present where needed
- [ ] ARIA roles are correct
- [ ] Landmark regions defined

#### Visual Accessibility
- [ ] Color contrast ratio ≥ 4.5:1 for normal text
- [ ] Color contrast ratio ≥ 3:1 for large text
- [ ] Color is not the only indicator
- [ ] Text can be resized to 200%
- [ ] No loss of content when zoomed
- [ ] Focus indicators have 3:1 contrast

#### Forms
- [ ] All form fields have labels
- [ ] Required fields are indicated
- [ ] Error messages are descriptive
- [ ] Error messages are associated with fields
- [ ] Fieldsets group related fields
- [ ] Legends describe fieldsets

#### Content
- [ ] Headings are hierarchical (h1, h2, h3)
- [ ] Lists use proper markup
- [ ] Tables have headers
- [ ] Links have descriptive text
- [ ] Language is specified
- [ ] Page titles are descriptive

### Automated Accessibility Testing

**Tools**: axe DevTools, Lighthouse, WAVE

```bash
# Run Lighthouse accessibility audit
lighthouse http://localhost:5173 --only-categories=accessibility

# Run axe-core tests
npm run test:a11y
```

### Manual Accessibility Testing

**Test with**:
- Keyboard only (no mouse)
- Screen reader
- High contrast mode
- Zoom at 200%
- Color blindness simulator

## Test Data Setup

### Creating Test Users

```sql
-- Create admin user
INSERT INTO users (email, password_hash, name, role)
VALUES (
  'admin@example.com',
  '$2b$10$YourHashedPasswordHere',
  'Test Admin',
  'admin'
);

-- Create viewer user (if role exists)
INSERT INTO users (email, password_hash, name, role)
VALUES (
  'viewer@example.com',
  '$2b$10$YourHashedPasswordHere',
  'Test Viewer',
  'viewer'
);
```

### Generating Sample Publications

```javascript
// scripts/seed-publications.js
const db = require('../backend/src/config/database');

const samplePublications = [
  {
    title: 'AI-Powered Data Analysis',
    description: 'Comprehensive guide to using AI for data analysis',
    topics: ['AI', 'Machine Learning', 'Data Science'],
    audience: ['Data Scientists', 'Developers'],
    industries: ['Technology', 'Finance'],
    status: 'published'
  },
  // Add more samples...
];

async function seedPublications() {
  for (const pub of samplePublications) {
    await db.query(`
      INSERT INTO publications (title, description, topics, audience, industries, status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [pub.title, pub.description, pub.topics, pub.audience, pub.industries, pub.status, userId]);
  }
}
```

### Database Seeding Script

```bash
# Run seed script
node scripts/seed-publications.js

# Reset database
npm run db:reset

# Seed test data
npm run db:seed
```

### Test Data Cleanup

```javascript
// Clean up test data after tests
afterAll(async () => {
  await db.query('DELETE FROM publications WHERE title LIKE \'%Test%\'');
  await db.query('DELETE FROM users WHERE email LIKE \'%test%\'');
  await db.query('DELETE FROM audit_logs WHERE user_email LIKE \'%test%\'');
});
```

## Common Testing Issues

### Issue: Tests Fail Intermittently

**Symptoms**: Tests pass sometimes, fail other times

**Causes**:
- Race conditions
- Timing issues
- Shared state between tests
- Network flakiness

**Solutions**:
- Use proper async/await
- Add appropriate timeouts
- Isolate test data
- Mock network calls
- Use `beforeEach` to reset state

### Issue: Database Connection Errors

**Symptoms**: "Connection refused" or "Too many connections"

**Causes**:
- Database not running
- Connection pool exhausted
- Connections not closed

**Solutions**:
```javascript
// Ensure connections are closed
afterAll(async () => {
  await db.closePool();
});

// Use connection pooling
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000
});
```

### Issue: SSE Tests Timeout

**Symptoms**: SSE connection tests hang or timeout

**Causes**:
- Connection not established
- Events not received
- Connection not closed

**Solutions**:
```javascript
// Set appropriate timeout
test('SSE connection', (done) => {
  const es = new EventSource(url);
  
  const timeout = setTimeout(() => {
    es.close();
    done(new Error('Timeout'));
  }, 5000);
  
  es.onopen = () => {
    clearTimeout(timeout);
    es.close();
    done();
  };
});
```

### Issue: Frontend Tests Can't Find Elements

**Symptoms**: "Unable to find element" errors

**Causes**:
- Async rendering
- Wrong selectors
- Elements not mounted

**Solutions**:
```javascript
// Use waitFor for async elements
await waitFor(() => {
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});

// Use findBy queries (built-in waiting)
const element = await screen.findByText('Expected Text');

// Check if element exists first
const element = screen.queryByText('Might Not Exist');
expect(element).toBeNull();
```

### Issue: CORS Errors in Tests

**Symptoms**: CORS policy errors in browser tests

**Causes**:
- Wrong origin configuration
- Missing CORS headers
- Preflight request issues

**Solutions**:
```javascript
// Configure test CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'test' 
    ? '*' 
    : process.env.CORS_ORIGIN
}));
```

### Issue: Authentication Fails in Tests

**Symptoms**: 401 errors in authenticated requests

**Causes**:
- Token not included
- Token expired
- Wrong token format

**Solutions**:
```javascript
// Include token in requests
const response = await request(app)
  .get('/api/admin/publications')
  .set('Authorization', `Bearer ${token}`);

// Generate fresh token for each test
beforeEach(async () => {
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@example.com', password: 'password' });
  
  token = loginResponse.body.data.token;
});
```

## Continuous Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: bob_demo_catalog_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          npm ci
          cd backend && npm ci
      
      - name: Run backend tests
        run: cd backend && npm test -- --coverage
        env:
          DB_HOST: localhost
          DB_NAME: bob_demo_catalog_test
          DB_USER: postgres
          DB_PASSWORD: postgres
      
      - name: Run frontend tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Test Coverage Goals

### Coverage Targets

- **Overall**: 80%+
- **Critical paths**: 100%
  - Authentication
  - Publication CRUD
  - Authorization
- **Business logic**: 90%+
- **UI components**: 70%+
- **Utilities**: 90%+

### Viewing Coverage Reports

```bash
# Generate coverage report
npm test -- --coverage

# View HTML report
open coverage/lcov-report/index.html
```

---

**Last Updated**: April 2024  
**Version**: 1.0.0

For questions or issues with testing, please refer to the [Development Guide](./DEVELOPMENT_GUIDE.md) or contact the development team.
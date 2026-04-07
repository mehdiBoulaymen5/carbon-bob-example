# CI/CD Test Pipeline Architecture

**Version:** 1.0  
**Last Updated:** 2026-04-06  
**Application:** Bob Demo Catalog - React + Node.js Full-Stack Application

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Pipeline Architecture](#pipeline-architecture)
3. [Testing Strategy](#testing-strategy)
4. [Test Specifications](#test-specifications)
5. [CI/CD Configuration](#cicd-configuration)
6. [Deployment Strategy](#deployment-strategy)
7. [Monitoring & Notifications](#monitoring--notifications)
8. [Implementation Roadmap](#implementation-roadmap)
9. [Best Practices](#best-practices)
10. [Appendices](#appendices)

---

## Executive Summary

This document outlines a comprehensive CI/CD test pipeline architecture for the Bob Demo Catalog application, a full-stack React + Node.js application with PostgreSQL database, featuring real-time updates via Server-Sent Events (SSE) and Carbon Design System components.

### Key Objectives

- **Quality Assurance:** Achieve 70%+ code coverage with comprehensive testing
- **Fast Feedback:** Parallel execution for sub-10-minute pipeline runs
- **Reliability:** Automated testing for all critical user journeys
- **Security:** Integrated security scanning and vulnerability checks
- **Deployment Confidence:** Automated staging deployments with health checks

### Technology Stack

- **Frontend:** React 18.3, Vite 6.0, Carbon Design System v1.68
- **Backend:** Node.js 18+, Express 4.18, PostgreSQL 14
- **Testing:** Jest, Vitest, React Testing Library, Playwright
- **CI/CD:** GitHub Actions
- **Deployment:** Docker, Docker Compose

---

## Pipeline Architecture

### 1. Multi-Stage Pipeline Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                         TRIGGER EVENTS                           │
│  • Push to main/develop    • Pull Request    • Manual Trigger   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      STAGE 1: SETUP & INSTALL                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Checkout   │→ │ Cache Setup  │→ │   Install    │          │
│  │     Code     │  │ Dependencies │  │ Dependencies │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  Duration: ~1-2 minutes                                          │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STAGE 2: CODE QUALITY (Parallel)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Frontend   │  │   Backend    │  │   Security   │          │
│  │     Lint     │  │     Lint     │  │    Scan      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  Duration: ~30-60 seconds                                        │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STAGE 3: UNIT TESTS (Parallel)                │
│  ┌──────────────────────────────┐  ┌──────────────────────────┐│
│  │      Frontend Unit Tests     │  │   Backend Unit Tests     ││
│  │  • Components (RTL)          │  │  • Controllers           ││
│  │  • Hooks                     │  │  • Services              ││
│  │  • Services                  │  │  • Utilities             ││
│  │  • Utils                     │  │  • Middleware            ││
│  │  Coverage: 70%+              │  │  Coverage: 70%+          ││
│  └──────────────────────────────┘  └──────────────────────────┘│
│  Duration: ~2-3 minutes                                          │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                  STAGE 4: INTEGRATION TESTS                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              API Integration Tests                       │   │
│  │  • Authentication endpoints                              │   │
│  │  • Publication CRUD operations                           │   │
│  │  • SSE connection & events                               │   │
│  │  • Database operations                                   │   │
│  │  • Middleware integration                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│  Duration: ~2-3 minutes                                          │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       STAGE 5: BUILD                             │
│  ┌──────────────────────────────┐  ┌──────────────────────────┐│
│  │      Frontend Build          │  │    Backend Build         ││
│  │  • Vite production build     │  │  • Docker image build    ││
│  │  • Bundle size analysis      │  │  • Dependency check      ││
│  │  • Asset optimization        │  │                          ││
│  └──────────────────────────────┘  └──────────────────────────┘│
│  Duration: ~2-3 minutes                                          │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STAGE 6: E2E TESTS                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              End-to-End Tests (Playwright)               │   │
│  │  • Admin authentication flow                             │   │
│  │  • Publication management (CRUD)                         │   │
│  │  • Public browsing & filtering                           │   │
│  │  • Real-time updates (SSE)                               │   │
│  │  • Cross-browser testing                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│  Duration: ~3-5 minutes                                          │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                  STAGE 7: DEPLOY TO STAGING                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Deploy     │→ │    Health    │→ │    Smoke     │          │
│  │  Containers  │  │    Checks    │  │    Tests     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  Duration: ~2-3 minutes                                          │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STAGE 8: REPORTING                            │
│  • Coverage reports    • Test results    • Performance metrics  │
│  • Security scan       • Bundle analysis • Deployment status    │
└─────────────────────────────────────────────────────────────────┘

Total Pipeline Duration: ~12-18 minutes
```

### 2. Parallel Execution Strategy

**Optimization Goals:**
- Reduce total pipeline time by 40-50%
- Maximize resource utilization
- Maintain test isolation

**Parallel Job Groups:**

```yaml
Group 1 (Code Quality):
  - frontend-lint
  - backend-lint
  - security-scan

Group 2 (Unit Tests):
  - frontend-unit-tests
  - backend-unit-tests

Group 3 (Build):
  - frontend-build
  - backend-build
```

### 3. Caching Strategy

**Cache Layers:**

1. **Node Modules Cache**
   - Key: `${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}`
   - Paths: `node_modules/`, `backend/node_modules/`
   - Restore Keys: `${{ runner.os }}-node-`

2. **Vite Build Cache**
   - Key: `${{ runner.os }}-vite-${{ hashFiles('**/vite.config.js') }}`
   - Paths: `.vite/`, `dist/`

3. **Docker Layer Cache**
   - Strategy: GitHub Container Registry
   - Layers: Base images, dependencies

4. **Test Results Cache**
   - Key: `${{ runner.os }}-test-${{ github.sha }}`
   - Paths: `coverage/`, `test-results/`

### 4. Environment Configuration

**Environment Variables for CI:**

```bash
# Frontend
VITE_API_URL=http://localhost:3000/api
NODE_ENV=test

# Backend
NODE_ENV=test
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bob_demo_catalog_test
DB_USER=postgres
DB_PASSWORD=test_password
JWT_SECRET=test_jwt_secret_key_for_ci
JWT_EXPIRES_IN=1h
BCRYPT_ROUNDS=4  # Lower for faster tests

# Test Configuration
CI=true
PLAYWRIGHT_BROWSERS_PATH=0
```

---

## Testing Strategy

### 1. Testing Pyramid Distribution

```
         /\
        /E2\      E2E Tests (10%)
       /____\     ~15 critical scenarios
      /      \    
     /  INT   \   Integration Tests (30%)
    /__________\  ~45 API & DB tests
   /            \ 
  /     UNIT     \ Unit Tests (60%)
 /________________\ ~90 component/function tests

Total: ~150 tests
Target Coverage: 70%+ overall
Critical Paths: 100% coverage
```

### 2. Coverage Requirements

| Component | Minimum Coverage | Target Coverage |
|-----------|-----------------|-----------------|
| Frontend Components | 65% | 75% |
| Frontend Services | 70% | 80% |
| Frontend Hooks | 70% | 85% |
| Backend Controllers | 75% | 85% |
| Backend Services | 80% | 90% |
| Backend Middleware | 80% | 90% |
| Backend Utilities | 85% | 95% |
| **Overall** | **70%** | **80%** |

### 3. Test Types & Tools

#### Unit Tests
- **Frontend:** Vitest + React Testing Library
- **Backend:** Jest + Supertest
- **Focus:** Individual components, functions, utilities
- **Execution Time:** < 3 minutes

#### Integration Tests
- **Tool:** Jest + Supertest + pg-mem
- **Focus:** API endpoints, database operations, middleware chains
- **Execution Time:** < 3 minutes

#### E2E Tests
- **Tool:** Playwright
- **Focus:** Critical user journeys, cross-browser compatibility
- **Browsers:** Chromium, Firefox, WebKit
- **Execution Time:** < 5 minutes

#### Visual Regression Tests
- **Tool:** Playwright + Percy/Chromatic
- **Focus:** UI component snapshots
- **Execution:** On PR only

---

## Test Specifications

### 1. Frontend Component Tests

See [FRONTEND_TEST_SPECS.md](FRONTEND_TEST_SPECS.md) for detailed specifications including:
- AdminLogin component (15 tests)
- DemoCatalog component (10 tests)
- PublicationsPage component (20 tests)
- AdminDashboard component (12 tests)
- PublicationForm component (18 tests)
- All hooks (useDataFetching, useDebounce, usePagination)
- All services (auth, publication, SSE)
- All contexts (AuthContext, SSEContext)

### 2. Backend Unit Tests

See [BACKEND_TEST_SPECS.md](BACKEND_TEST_SPECS.md) for detailed specifications including:
- Controllers (auth, publication, SSE, admin)
- Middleware (auth, validation, security, errorHandler)
- Utilities (jwt, password, audit, response)
- Repositories (publication, user, base)

### 3. Integration Tests

See [INTEGRATION_TEST_SPECS.md](INTEGRATION_TEST_SPECS.md) for detailed specifications including:
- Authentication API endpoints (8 tests)
- Publication API endpoints (15 tests)
- SSE API endpoints (10 tests)
- Database operations (12 tests)

### 4. E2E Test Scenarios

See [E2E_TEST_SPECS.md](E2E_TEST_SPECS.md) for detailed specifications including:
- Admin authentication flow (5 scenarios)
- Publication management flow (5 scenarios)
- Public browsing flow (4 scenarios)
- Real-time updates flow (3 scenarios)
- Cross-browser compatibility tests

---

## CI/CD Configuration

### 1. GitHub Actions Workflow Structure

**Main Workflow File:** `.github/workflows/ci-cd.yml`

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  workflow_dispatch:

env:
  NODE_VERSION: '18'
  POSTGRES_VERSION: '14'

jobs:
  # Stage 1: Setup
  setup:
    name: Setup & Install Dependencies
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: |
            node_modules
            backend/node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-
      
      - name: Install frontend dependencies
        run: npm ci
      
      - name: Install backend dependencies
        run: cd backend && npm ci

  # Stage 2: Code Quality (Parallel)
  lint-frontend:
    name: Lint Frontend
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  lint-backend:
    name: Lint Backend
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: cd backend && npm ci
      - run: cd backend && npm run lint

  security-scan:
    name: Security Scan
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run npm audit
        run: |
          npm audit --audit-level=moderate
          cd backend && npm audit --audit-level=moderate
      - name: Run Snyk scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  # Stage 3: Unit Tests (Parallel)
  test-frontend:
    name: Frontend Unit Tests
    needs: [lint-frontend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: frontend

  test-backend:
    name: Backend Unit Tests
    needs: [lint-backend]
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14-alpine
        env:
          POSTGRES_DB: bob_demo_catalog_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: test_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: cd backend && npm ci
      - name: Run tests
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: bob_demo_catalog_test
          DB_USER: postgres
          DB_PASSWORD: test_password
          JWT_SECRET: test_jwt_secret
          NODE_ENV: test
        run: cd backend && npm run test:unit -- --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info
          flags: backend

  # Stage 4: Integration Tests
  test-integration:
    name: Integration Tests
    needs: [test-frontend, test-backend]
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14-alpine
        env:
          POSTGRES_DB: bob_demo_catalog_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: test_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: cd backend && npm ci
      - name: Run integration tests
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: bob_demo_catalog_test
          DB_USER: postgres
          DB_PASSWORD: test_password
          JWT_SECRET: test_jwt_secret
          NODE_ENV: test
        run: cd backend && npm run test:integration

  # Stage 5: Build (Parallel)
  build-frontend:
    name: Build Frontend
    needs: [test-frontend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - name: Analyze bundle size
        run: |
          npm run build -- --mode production
          du -sh dist/*
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: frontend-build
          path: dist/

  build-backend:
    name: Build Backend Docker Image
    needs: [test-backend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      - name: Build Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: false
          tags: bob-demo-backend:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # Stage 6: E2E Tests
  test-e2e:
    name: E2E Tests
    needs: [build-frontend, build-backend, test-integration]
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14-alpine
        env:
          POSTGRES_DB: bob_demo_catalog_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: test_password
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - name: Install dependencies
        run: |
          npm ci
          cd backend && npm ci
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Start backend
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: bob_demo_catalog_test
          DB_USER: postgres
          DB_PASSWORD: test_password
          JWT_SECRET: test_jwt_secret
          NODE_ENV: test
          PORT: 3000
        run: |
          cd backend && npm start &
          sleep 10
      - name: Start frontend
        run: |
          npm run dev &
          sleep 5
      - name: Run E2E tests
        run: npm run test:e2e
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  # Stage 7: Deploy to Staging
  deploy-staging:
    name: Deploy to Staging
    needs: [test-e2e]
    if: github.ref == 'refs/heads/develop' || github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.bobdemo.com
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to staging
        run: |
          # Add deployment script here
          echo "Deploying to staging..."
      - name: Health check
        run: |
          sleep 30
          curl -f https://staging.bobdemo.com/health || exit 1
      - name: Run smoke tests
        run: |
          # Add smoke test script here
          echo "Running smoke tests..."

  # Stage 8: Report
  report:
    name: Generate Reports
    needs: [test-e2e, deploy-staging]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Download coverage reports
        uses: actions/download-artifact@v3
      - name: Generate combined report
        run: |
          echo "Generating combined coverage report..."
      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ CI/CD Pipeline completed successfully!'
            })
```

### 2. Job Dependencies

```
setup
  ├── lint-frontend ──> test-frontend ──> build-frontend ─┐
  ├── lint-backend ──> test-backend ──> build-backend ────┤
  └── security-scan                                        │
                                                           ├──> test-integration ──> test-e2e ──> deploy-staging ──> report
                                                           │
                                                           └────────────────────────────────────────────────────────────┘
```

### 3. Test Database Configuration

**Docker Compose for CI:**

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  test-db:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: bob_demo_catalog_test
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: test_password
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
```

### 4. Required GitHub Secrets

```
SNYK_TOKEN              # For security scanning
CODECOV_TOKEN           # For coverage reporting
STAGING_DEPLOY_KEY      # For staging deployment
DOCKER_USERNAME         # For Docker registry
DOCKER_PASSWORD         # For Docker registry
SLACK_WEBHOOK_URL       # For notifications
```

---

## Deployment Strategy

### 1. Staging Environment

**Infrastructure:**
- **Platform:** Docker Compose on cloud VM
- **Database:** PostgreSQL 14 (separate instance)
- **Reverse Proxy:** Nginx
- **SSL:** Let's Encrypt

**Deployment Process:**

```bash
# 1. Pull latest images
docker-compose -f docker-compose.staging.yml pull

# 2. Run database migrations
docker-compose -f docker-compose.staging.yml run backend npm run migrate

# 3. Deploy with zero-downtime
docker-compose -f docker-compose.staging.yml up -d --no-deps --build

# 4. Health check
curl -f https://staging.bobdemo.com/health

# 5. Smoke tests
npm run test:smoke
```

### 2. Health Check Endpoints

**Backend Health Check:** `GET /health`

```json
{
  "status": "healthy",
  "timestamp": "2026-04-06T19:00:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "version": "1.0.0"
}
```

**Frontend Health Check:** `GET /`
- Returns 200 OK with HTML

### 3. Smoke Tests

```javascript
// smoke-tests.spec.js
describe('Smoke Tests', () => {
  test('backend health endpoint responds', async () => {
    const response = await fetch('https://staging.bobdemo.com/health');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });
  
  test('frontend loads successfully', async () => {
    const response = await fetch('https://staging.bobdemo.com');
    expect(response.status).toBe(200);
  });
  
  test('API authentication works', async () => {
    const response = await fetch('https://staging.bobdemo.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'test_password'
      })
    });
    expect(response.status).toBe(200);
  });
  
  test('database connection works', async () => {
    const response = await fetch('https://staging.bobdemo.com/api/publications');
    expect(response.status).toBe(200);
  });
});
```

### 4. Rollback Strategy

**Automated Rollback Triggers:**
- Health check failure after deployment
- Smoke test failure
- Error rate > 5% in first 5 minutes

**Rollback Process:**

```bash
# 1. Revert to previous Docker images
docker-compose -f docker-compose.staging.yml down
docker-compose -f docker-compose.staging.yml up -d --no-deps

# 2. Verify health
curl -f https://staging.bobdemo.com/health

# 3. Notify team
echo "Rollback completed" | slack-notify
```

---

## Monitoring & Notifications

### 1. Pipeline Failure Notifications

**Slack Integration:**

```yaml
- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: |
      Pipeline failed for ${{ github.repository }}
      Branch: ${{ github.ref }}
      Commit: ${{ github.sha }}
      Author: ${{ github.actor }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

**Email Notifications:**
- Configured in GitHub repository settings
- Sent to: dev-team@example.com
- Triggers: Pipeline failure, deployment failure

### 2. Test Coverage Reporting

**Codecov Integration:**

```yaml
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
    flags: frontend,backend
    fail_ci_if_error: true
    verbose: true
```

**Coverage Badge:**
```markdown
[![codecov](https://codecov.io/gh/username/repo/branch/main/graph/badge.svg)](https://codecov.io/gh/username/repo)
```

### 3. Performance Metrics

**Bundle Size Tracking:**

```yaml
- name: Analyze bundle size
  uses: andresz1/size-limit-action@v1
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    skip_step: install
```

**Lighthouse CI:**

```yaml
- name: Run Lighthouse CI
  uses: treosh/lighthouse-ci-action@v9
  with:
    urls: |
      https://staging.bobdemo.com
      https://staging.bobdemo.com/publications
    uploadArtifacts: true
```

### 4. Error Reporting

**Sentry Integration:**

```javascript
// Frontend: src/main.jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});

// Backend: backend/src/server.js
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

---

## Implementation Roadmap

### Phase 1: Basic Pipeline Setup (Week 1-2)

**Objectives:**
- Set up GitHub Actions workflow
- Configure basic CI pipeline
- Implement code quality checks

**Tasks:**
1. Create `.github/workflows/ci-cd.yml`
2. Configure Node.js and PostgreSQL services
3. Set up dependency caching
4. Implement linting for frontend and backend
5. Add security scanning (npm audit)
6. Configure environment variables

**Deliverables:**
- Working CI pipeline with linting
- Security scan integration
- Documentation

**Success Criteria:**
- Pipeline runs on every PR
- Linting catches code quality issues
- Security vulnerabilities are detected

### Phase 2: Test Implementation (Week 3-5)

**Objectives:**
- Implement comprehensive unit tests
- Add integration tests
- Achieve 70%+ code coverage

**Tasks:**

**Week 3: Frontend Unit Tests**
1. Set up Vitest and React Testing Library
2. Write component tests (AdminLogin, DemoCatalog, PublicationsPage)
3. Write hook tests (useDataFetching, useDebounce, usePagination)
4. Write service tests (auth, publication, SSE)
5. Write context tests (AuthContext, SSEContext)
6. Configure coverage reporting

**Week 4: Backend Unit Tests**
7. Set up Jest and Supertest
8. Write controller tests (auth, publication, SSE, admin)
9. Write middleware tests (auth, validation, security)
10. Write utility tests (jwt, password, audit)
11. Configure coverage reporting

**Week 5: Integration Tests**
12. Set up test database (pg-mem or Docker)
13. Write API endpoint tests (authentication, publications, SSE)
14. Write database operation tests
15. Configure integration test suite

**Deliverables:**
- ~90 unit tests (frontend + backend)
- ~45 integration tests
- 70%+ code coverage
- Coverage reports in CI

**Success Criteria:**
- All tests pass in CI
- Coverage thresholds met
- Tests run in < 5 minutes

### Phase 3: Advanced Testing (Week 6-7)

**Objectives:**
- Implement E2E tests
- Add visual regression testing
- Cross-browser testing

**Tasks:**

**Week 6: E2E Tests**
1. Set up Playwright
2. Write admin authentication flow tests
3. Write publication management flow tests
4. Write public browsing flow tests
5. Write real-time updates flow tests
6. Configure test artifacts upload

**Week 7: Visual & Cross-Browser**
7. Set up Percy or Chromatic
8. Create visual regression test suite
9. Configure cross-browser testing (Chrome, Firefox, Safari)
10. Optimize E2E test execution time

**Deliverables:**
- ~15 E2E test scenarios
- Visual regression test suite
- Cross-browser test configuration
- Test reports and artifacts

**Success Criteria:**
- E2E tests cover critical user journeys
- Tests run in < 5 minutes
- Visual regressions are detected
- Tests pass on all browsers

### Phase 4: Deployment Automation (Week 8-9)

**Objectives:**
- Automate staging deployments
- Implement health checks
- Add smoke tests

**Tasks:**

**Week 8: Staging Deployment**
1. Set up staging environment
2. Create deployment scripts
3. Configure Docker image building
4. Implement zero-downtime deployment
5. Add deployment notifications

**Week 9: Health & Smoke Tests**
6. Implement health check endpoints
7. Write smoke test suite
8. Configure automated rollback
9. Set up monitoring and alerting
10. Document deployment process

**Deliverables:**
- Automated staging deployment
- Health check system
- Smoke test suite
- Rollback mechanism
- Deployment documentation

**Success Criteria:**
- Deployments are fully automated
- Health checks prevent bad deployments
- Rollback works automatically
- Team is notified of deployments

### Phase 5: Monitoring & Optimization (Week 10)

**Objectives:**
- Implement comprehensive monitoring
- Optimize pipeline performance
- Document best practices

**Tasks:**
1. Set up Codecov integration
2. Configure Sentry error tracking
3. Implement bundle size tracking
4. Add Lighthouse CI
5. Optimize caching strategy
6. Parallelize more jobs
7. Create dashboard for metrics
8. Write comprehensive documentation
9. Train team on CI/CD system
10. Establish maintenance procedures

**Deliverables:**
- Monitoring dashboards
- Optimized pipeline (< 12 minutes)
- Complete documentation
- Team training materials

**Success Criteria:**
- Pipeline runs in < 12 minutes
- All metrics are tracked
- Team is trained
- Documentation is complete

---

## Best Practices

### 1. Test Writing Guidelines

**Unit Tests:**
- Test one thing at a time
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Aim for fast execution (< 100ms per test)

**Integration Tests:**
- Test realistic scenarios
- Use test database
- Clean up after each test
- Test error cases
- Verify side effects

**E2E Tests:**
- Focus on critical user journeys
- Use data-testid attributes
- Implement proper waits
- Handle flaky tests
- Keep tests independent

### 2. CI/CD Best Practices

**Pipeline Design:**
- Fail fast (run quick tests first)
- Parallelize independent jobs
- Cache aggressively
- Use matrix builds for cross-platform testing
- Keep pipelines under 15 minutes

**Security:**
- Scan dependencies regularly
- Use secrets management
- Implement SAST/DAST
- Review security reports
- Update dependencies promptly

**Deployment:**
- Use blue-green or canary deployments
- Implement health checks
- Have rollback strategy
- Monitor post-deployment
- Document deployment process

### 3. Code Quality Standards

**Linting Rules:**
- ESLint for JavaScript/React
- Prettier for code formatting
- Enforce consistent style
- No console.log in production
- Handle all promises

**Coverage Thresholds:**
```json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 70,
        "functions": 70,
        "lines": 70,
        "statements": 70
      }
    }
  }
}
```

### 4. Maintenance Guidelines

**Regular Tasks:**
- Update dependencies monthly
- Review and update tests quarterly
- Optimize pipeline performance
- Clean up old artifacts
- Update documentation

**Monitoring:**
- Track pipeline success rate
- Monitor test execution time
- Review coverage trends
- Analyze failure patterns
- Track deployment frequency

---

## Appendices

### Appendix A: Required Package Installations

**Frontend Testing:**
```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0",
    "@vitest/ui": "^1.0.0",
    "jsdom": "^23.0.0",
    "playwright": "^1.40.0",
    "@playwright/test": "^1.40.0"
  }
}
```

**Backend Testing:**
```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.0",
    "pg-mem": "^2.6.0",
    "@types/jest": "^29.5.0"
  }
}
```

### Appendix B: Configuration Files

See separate files:
- `vitest.config.js` - Frontend test configuration
- `jest.config.js` - Backend test configuration
- `playwright.config.js` - E2E test configuration
- `.github/workflows/ci-cd.yml` - GitHub Actions workflow

### Appendix C: Test Data Setup

**Test User:**
```sql
INSERT INTO users (email, password_hash, role, created_at)
VALUES ('admin@example.com', '$2b$10$...', 'admin', NOW());
```

**Test Publications:**
```sql
INSERT INTO publications (title, description, category, url, created_at)
VALUES 
  ('Test Publication 1', 'Description 1', 'Technology', 'https://example.com/1', NOW()),
  ('Test Publication 2', 'Description 2', 'Design', 'https://example.com/2', NOW());
```

### Appendix D: Troubleshooting Guide

**Common Issues:**

1. **Tests timeout in CI**
   - Increase timeout values
   - Check for race conditions
   - Verify service health

2. **Flaky E2E tests**
   - Use proper waits
   - Avoid hard-coded delays
   - Check for timing issues

3. **Coverage not meeting threshold**
   - Identify uncovered code
   - Add missing tests
   - Review coverage reports

4. **Deployment failures**
   - Check health endpoints
   - Verify environment variables
   - Review deployment logs

### Appendix E: Useful Commands

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run specific test file
npm run test -- path/to/test.spec.js

# Update snapshots
npm run test -- -u

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage -- --reporter=html
```

---

**Document End**

For questions or clarifications, contact the DevOps team or refer to the project wiki.
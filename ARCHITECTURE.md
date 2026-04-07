# Admin Profile System with Publication Management - Technical Architecture

## Executive Summary

This document outlines the technical architecture for implementing a comprehensive admin profile system with publication management capabilities for the Bob Demo Catalog application. The solution extends the existing React/Vite/Carbon Design System frontend with a secure backend API, database layer, and authentication system.

**Current State:**
- React 18 + Vite frontend with Carbon Design System v11
- Static demo catalog with client-side state management
- Docker deployment to IBM Cloud Code Engine
- No backend or persistent storage

**Target State:**
- Full-stack application with secure admin portal
- RESTful API backend with authentication
- PostgreSQL database for persistent storage
- Role-based access control (RBAC)
- Public and admin-only views
- Comprehensive audit logging
- Real-time updates capability

---

## 1. Technology Stack Decisions

### 1.1 Backend Framework: Node.js with Express

**Rationale:**
- **JavaScript Ecosystem Alignment**: Matches frontend technology, enabling code sharing and unified development
- **Performance**: Non-blocking I/O ideal for API operations
- **Rich Ecosystem**: Extensive middleware and library support
- **Team Efficiency**: Single language across stack reduces context switching
- **IBM Cloud Compatibility**: Well-supported on Code Engine

**Key Dependencies:**
```json
{
  "express": "^4.18.2",
  "express-validator": "^7.0.1",
  "helmet": "^7.1.0",
  "cors": "^2.8.5",
  "compression": "^1.7.4",
  "express-rate-limit": "^7.1.5",
  "jsonwebtoken": "^9.0.2",
  "bcrypt": "^5.1.1",
  "pg": "^8.11.3",
  "dotenv": "^16.3.1",
  "winston": "^3.11.0"
}
```

### 1.2 Database: PostgreSQL

**Rationale:**
- **ACID Compliance**: Ensures data integrity for critical admin operations
- **Relational Model**: Perfect for structured publication data with relationships
- **JSON Support**: Native JSONB for flexible metadata storage
- **Full-Text Search**: Built-in capabilities for publication search
- **IBM Cloud Integration**: Available as managed service (IBM Cloud Databases for PostgreSQL)
- **Audit Trail**: Excellent support for temporal data and logging

**Alternative Considered:** MongoDB
- Rejected due to lack of ACID guarantees and weaker consistency model for admin operations

### 1.3 Authentication Strategy: JWT (JSON Web Tokens)

**Rationale:**
- **Stateless**: No server-side session storage required
- **Scalable**: Works seamlessly with Code Engine's auto-scaling
- **Mobile-Ready**: Easy to implement for future mobile apps
- **Standard**: Industry-standard with broad library support
- **Secure**: When implemented with proper practices (short expiry, refresh tokens, HTTPS)

**Implementation Details:**
- **Access Token**: Short-lived (15 minutes), stored in memory
- **Refresh Token**: Long-lived (7 days), stored in httpOnly cookie
- **Token Rotation**: Refresh tokens rotated on each use
- **Revocation**: Token blacklist in database for logout/security events

### 1.4 Frontend State Management: React Context + Custom Hooks

**Rationale:**
- **Built-in Solution**: No additional dependencies
- **Sufficient Complexity**: Application state is manageable without Redux
- **Carbon Compatibility**: Works seamlessly with Carbon components
- **Learning Curve**: Minimal for team already familiar with React

**State Structure:**
```javascript
// AuthContext: User authentication state
// PublicationContext: Publication data and operations
// NotificationContext: Toast notifications and alerts
```

**Alternative Considered:** Redux Toolkit
- Rejected as overkill for current application complexity

### 1.5 Real-Time Updates: Server-Sent Events (SSE)

**Rationale:**
- **Simplicity**: Easier than WebSockets for one-way server-to-client updates
- **HTTP-Based**: Works through firewalls and proxies
- **Automatic Reconnection**: Built-in browser support
- **Sufficient**: Meets requirements for publication update notifications

---

## 2. System Architecture

### 2.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     IBM Cloud Code Engine                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │   Frontend App   │         │   Backend API    │          │
│  │   (React/Vite)   │◄───────►│  (Node/Express)  │          │
│  │   Port: 8080     │  HTTPS  │   Port: 3000     │          │
│  │   (nginx)        │         │                  │          │
│  └──────────────────┘         └────────┬─────────┘          │
│                                         │                     │
└─────────────────────────────────────────┼─────────────────────┘
                                          │
                                          │ SSL/TLS
                                          ▼
                              ┌───────────────────────┐
                              │  IBM Cloud Databases  │
                              │    for PostgreSQL     │
                              │   (Managed Service)   │
                              └───────────────────────┘
```

### 2.2 Deployment Architecture

**Two-Container Approach:**

1. **Frontend Container** (Existing)
   - Nginx serving React SPA
   - Port 8080
   - Static assets with caching
   - Proxies API requests to backend

2. **Backend Container** (New)
   - Node.js Express API
   - Port 3000
   - Connects to PostgreSQL
   - Handles authentication and business logic

**Nginx Configuration Update:**
```nginx
# Add to nginx.conf
location /api/ {
    proxy_pass http://backend-service:3000/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 2.3 Frontend Architecture

**Directory Structure:**
```
src/
├── main.jsx                    # Application entry point
├── App.jsx                     # Root component with routing
├── index.scss                  # Global styles
├── components/
│   ├── DemoCatalog.jsx        # Existing public catalog
│   ├── DemoCatalog.scss
│   ├── admin/                 # Admin-only components
│   │   ├── AdminLogin.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── PublicationList.jsx
│   │   ├── PublicationForm.jsx
│   │   ├── PublicationEditor.jsx
│   │   ├── StatisticsPanel.jsx
│   │   ├── AuditLogViewer.jsx
│   │   └── ProtectedRoute.jsx
│   ├── public/                # Public-facing components
│   │   ├── PublicationDetail.jsx
│   │   ├── PublicationGrid.jsx
│   │   └── SearchBar.jsx
│   └── shared/                # Reusable components
│       ├── LoadingSpinner.jsx
│       ├── ErrorBoundary.jsx
│       ├── ConfirmDialog.jsx
│       └── Toast.jsx
├── contexts/
│   ├── AuthContext.jsx        # Authentication state
│   ├── PublicationContext.jsx # Publication data
│   └── NotificationContext.jsx # Toast notifications
├── hooks/
│   ├── useAuth.js             # Authentication hook
│   ├── usePublications.js     # Publication operations
│   ├── useApi.js              # API client hook
│   └── useDebounce.js         # Debounce utility
├── services/
│   ├── api.js                 # Axios instance with interceptors
│   ├── authService.js         # Auth API calls
│   └── publicationService.js  # Publication API calls
├── utils/
│   ├── validators.js          # Form validation
│   ├── formatters.js          # Data formatting
│   └── constants.js           # App constants
└── routes/
    └── index.jsx              # Route configuration
```

**Routing Structure:**
```javascript
// Public Routes
/                              → Home (DemoCatalog)
/publications                  → Public publication grid
/publications/:id              → Publication detail view
/about                         → About page
/contact                       → Contact page

// Admin Routes (Protected)
/admin/login                   → Admin login
/admin/dashboard               → Admin dashboard with stats
/admin/publications            → Publication management list
/admin/publications/new        → Create new publication
/admin/publications/:id/edit   → Edit publication
/admin/audit-logs              → Audit log viewer
```

### 2.4 Backend Architecture

**Directory Structure:**
```
backend/
├── server.js                  # Application entry point
├── app.js                     # Express app configuration
├── config/
│   ├── database.js            # PostgreSQL connection
│   ├── jwt.js                 # JWT configuration
│   └── constants.js           # App constants
├── middleware/
│   ├── auth.js                # JWT verification
│   ├── rbac.js                # Role-based access control
│   ├── validation.js          # Request validation
│   ├── errorHandler.js        # Global error handler
│   ├── rateLimiter.js         # Rate limiting
│   ├── sanitizer.js           # Input sanitization
│   └── auditLogger.js         # Audit logging
├── routes/
│   ├── auth.routes.js         # Authentication endpoints
│   ├── publications.routes.js # Publication CRUD
│   ├── admin.routes.js        # Admin operations
│   └── public.routes.js       # Public endpoints
├── controllers/
│   ├── auth.controller.js     # Auth business logic
│   ├── publications.controller.js
│   ├── admin.controller.js
│   └── public.controller.js
├── models/
│   ├── User.js                # User model
│   ├── Publication.js         # Publication model
│   └── AuditLog.js            # Audit log model
├── services/
│   ├── authService.js         # Authentication logic
│   ├── tokenService.js        # JWT operations
│   ├── publicationService.js  # Publication business logic
│   └── auditService.js        # Audit logging
├── utils/
│   ├── logger.js              # Winston logger
│   ├── validators.js          # Validation schemas
│   └── helpers.js             # Utility functions
└── tests/
    ├── unit/
    └── integration/
```

---

## 3. Authentication Flow

### 3.1 Login Flow Diagram

```
┌─────────┐                ┌──────────┐              ┌──────────┐
│ Browser │                │ Frontend │              │ Backend  │
└────┬────┘                └────┬─────┘              └────┬─────┘
     │                          │                         │
     │  1. Enter credentials    │                         │
     ├─────────────────────────►│                         │
     │                          │                         │
     │                          │  2. POST /api/auth/login│
     │                          ├────────────────────────►│
     │                          │     {email, password}   │
     │                          │                         │
     │                          │                         │  3. Validate
     │                          │                         │     credentials
     │                          │                         │
     │                          │  4. Access + Refresh    │
     │                          │◄────────────────────────┤
     │                          │     tokens              │
     │                          │                         │
     │  5. Store access token   │                         │
     │     in memory            │                         │
     │  6. Store refresh token  │                         │
     │     in httpOnly cookie   │                         │
     │                          │                         │
     │  7. Redirect to dashboard│                         │
     │◄─────────────────────────┤                         │
     │                          │                         │
```

### 3.2 API Request Flow with Token Refresh

```
┌─────────┐                ┌──────────┐              ┌──────────┐
│ Browser │                │ Frontend │              │ Backend  │
└────┬────┘                └────┬─────┘              └────┬─────┘
     │                          │                         │
     │  1. API Request          │                         │
     │                          │  2. GET /api/publications│
     │                          ├────────────────────────►│
     │                          │  Authorization: Bearer  │
     │                          │  <access-token>         │
     │                          │                         │
     │                          │                         │  3. Verify token
     │                          │                         │
     │                          │  4. Token expired (401) │
     │                          │◄────────────────────────┤
     │                          │                         │
     │                          │  5. POST /api/auth/refresh│
     │                          ├────────────────────────►│
     │                          │  Cookie: refresh-token  │
     │                          │                         │
     │                          │                         │  6. Verify refresh
     │                          │                         │     token
     │                          │                         │
     │                          │  7. New access token    │
     │                          │◄────────────────────────┤
     │                          │                         │
     │  8. Retry original       │                         │
     │     request with new     │                         │
     │     access token         │                         │
     │                          │  9. GET /api/publications│
     │                          ├────────────────────────►│
     │                          │  Authorization: Bearer  │
     │                          │  <new-access-token>     │
     │                          │                         │
     │                          │  10. Success (200)      │
     │                          │◄────────────────────────┤
     │                          │                         │
```

---

## 4. Component Specifications

### 4.1 Admin Components

#### AdminLogin.jsx
**Purpose:** Admin authentication interface

**Props:** None

**State:**
```javascript
{
  email: string,
  password: string,
  rememberMe: boolean,
  isLoading: boolean,
  error: string | null
}
```

**Carbon Components:**
- `Form`, `TextInput`, `PasswordInput`
- `Button`, `Checkbox`
- `InlineNotification`

**Key Features:**
- Email/password validation
- Remember me functionality
- Error handling with user feedback
- Loading states during authentication
- Redirect after successful login

#### AdminDashboard.jsx
**Purpose:** Main admin landing page with statistics

**Props:** None

**Data Requirements:**
```javascript
{
  totalPublications: number,
  publishedCount: number,
  draftCount: number,
  recentActivity: Array<AuditLog>,
  systemStatus: object
}
```

**Carbon Components:**
- `Grid`, `Column`, `Tile`
- `StructuredList`
- `Button`, `Tag`

**Key Features:**
- Publication count statistics
- Recent activity feed
- Quick action buttons
- System health indicators

#### PublicationList.jsx
**Purpose:** Paginated list of all publications with management actions

**Props:** None

**State:**
```javascript
{
  publications: Array<Publication>,
  selectedRows: Array<string>,
  sortColumn: string,
  sortDirection: 'ASC' | 'DESC',
  searchQuery: string,
  currentPage: number,
  pageSize: number,
  totalCount: number
}
```

**Carbon Components:**
- `DataTable` with sorting and selection
- `Search`, `Button`, `Tag`
- `Pagination`
- `OverflowMenu` for row actions

**Key Features:**
- Sortable columns
- Search and filter
- Bulk actions (delete, publish)
- Status indicators
- Row-level actions (edit, delete, view)

#### PublicationForm.jsx
**Purpose:** Create/edit publication form

**Props:**
```javascript
{
  publicationId?: string,  // For edit mode
  onSuccess: () => void,
  onCancel: () => void
}
```

**Form Fields:**
```javascript
{
  title: string (required, 3-200 chars),
  description: string (required, 10-2000 chars),
  topics: Array<string> (1-10 items),
  audience: Array<string>,
  industries: Array<string>,
  gitSource: string (URL),
  boxSource: string (URL),
  status: 'draft' | 'published',
  icon: string
}
```

**Carbon Components:**
- `Form`, `TextInput`, `TextArea`
- `MultiSelect`, `FileUploader`
- `Button`, `ProgressIndicator`
- `Modal` for confirmations

**Key Features:**
- Multi-step form wizard
- Field validation
- Auto-save drafts
- Image upload
- Rich text editor for description
- Tag management

### 4.2 Public Components

#### PublicationDetail.jsx
**Purpose:** Detailed view of a single publication

**Props:**
```javascript
{
  publicationId: string
}
```

**Carbon Components:**
- `Grid`, `Column`, `Tile`
- `Tag`, `Button`
- `Breadcrumb`

**Key Features:**
- Full publication information
- Related publications
- Social sharing
- Contact/demo request

#### PublicationGrid.jsx
**Purpose:** Grid view of publications for public users

**Props:**
```javascript
{
  filters?: {
    topics?: Array<string>,
    industries?: Array<string>,
    search?: string
  }
}
```

**Carbon Components:**
- `Grid`, `Column`, `Tile`
- `Search`, `Tag`
- `Button`

**Key Features:**
- Responsive grid layout
- Filtering by tags
- Search functionality
- Load more pagination

---

## 5. API Endpoints

### 5.1 Authentication Endpoints

#### POST /api/auth/login
**Purpose:** Authenticate admin user

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "securePassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "role": "admin",
      "name": "Admin User"
    },
    "accessToken": "jwt-token",
    "expiresIn": 900
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

#### POST /api/auth/refresh
**Purpose:** Refresh access token

**Request:** Refresh token in httpOnly cookie

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "new-jwt-token",
    "expiresIn": 900
  }
}
```

#### POST /api/auth/logout
**Purpose:** Invalidate refresh token

**Headers:** `Authorization: Bearer <access-token>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET /api/auth/me
**Purpose:** Get current user information

**Headers:** `Authorization: Bearer <access-token>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@example.com",
    "role": "admin",
    "name": "Admin User",
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

### 5.2 Publication Management (Admin)

#### GET /api/admin/publications
**Purpose:** List all publications with pagination

**Headers:** `Authorization: Bearer <access-token>`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `sort` (default: createdAt)
- `order` (default: DESC)
- `search` (optional)
- `status` (optional: draft|published)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "publications": [
      {
        "id": "uuid",
        "title": "Code Generation Demo",
        "description": "...",
        "status": "published",
        "topics": ["AI", "Code"],
        "viewCount": 150,
        "createdAt": "2026-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalPages": 5,
      "totalCount": 95
    }
  }
}
```

#### POST /api/admin/publications
**Purpose:** Create new publication

**Headers:** `Authorization: Bearer <access-token>`

**Request Body:**
```json
{
  "title": "New Demo",
  "description": "Demo description",
  "topics": ["AI", "Code"],
  "audience": ["Developers"],
  "industries": ["Technology"],
  "gitSource": "https://github.com/...",
  "boxSource": "https://box.com/...",
  "icon": "Code",
  "status": "draft"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "New Demo",
    ...
  },
  "message": "Publication created successfully"
}
```

#### PUT /api/admin/publications/:id
**Purpose:** Update existing publication

**Headers:** `Authorization: Bearer <access-token>`

**Request Body:** Same as POST

**Success Response (200):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Publication updated successfully"
}
```

#### DELETE /api/admin/publications/:id
**Purpose:** Delete publication

**Headers:** `Authorization: Bearer <access-token>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Publication deleted successfully"
}
```

### 5.3 Public Endpoints

#### GET /api/publications
**Purpose:** List published publications

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `search` (optional)
- `topics` (optional, comma-separated)
- `industries` (optional, comma-separated)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "publications": [...],
    "pagination": {...}
  }
}
```

#### GET /api/publications/:id
**Purpose:** Get single published publication

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Code Generation Demo",
    "description": "...",
    "topics": ["AI", "Code"],
    "viewCount": 151,
    "relatedPublications": [...]
  }
}
```

---

## 6. Database Schema

### 6.1 Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT users_role_check CHECK (role IN ('admin', 'viewer'))
);

CREATE INDEX idx_users_email ON users(email);
```

### 6.2 Publications Table

```sql
CREATE TABLE publications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  topics TEXT[] NOT NULL DEFAULT '{}',
  audience TEXT[] NOT NULL DEFAULT '{}',
  industries TEXT[] NOT NULL DEFAULT '{}',
  git_source VARCHAR(500),
  box_source VARCHAR(500),
  icon VARCHAR(50) NOT NULL DEFAULT 'Code',
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT publications_status_check CHECK (status IN ('draft', 'published')),
  CONSTRAINT publications_title_length CHECK (char_length(title) >= 3)
);

CREATE INDEX idx_publications_status ON publications(status);
CREATE INDEX idx_publications_created_at ON publications(created_at DESC);
CREATE INDEX idx_publications_topics ON publications USING GIN(topics);
CREATE INDEX idx_publications_full_text ON publications USING GIN(
  to_tsvector('english', title || ' ' || description)
);
```

### 6.3 Audit Logs Table

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT audit_logs_action_check CHECK (action IN ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'))
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
```

### 6.4 Refresh Tokens Table

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT refresh_tokens_token_hash_unique UNIQUE (token_hash)
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

---

## 7. Security Implementation

### 7.1 Authentication Security

**Password Hashing:**
```javascript
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

// Hash password
const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

// Verify password
const isValid = await bcrypt.compare(password, hashedPassword);
```

**JWT Configuration:**
```javascript
const jwt = require('jsonwebtoken');

// Generate access token
const accessToken = jwt.sign(
  { sub: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '15m' }
);

// Generate refresh token
const refreshToken = jwt.sign(
  { sub: user.id, type: 'refresh' },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: '7d' }
);
```

### 7.2 Input Validation

**Express Validator Example:**
```javascript
const { body, validationResult } = require('express-validator');

const publicationValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters')
    .escape(),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters')
    .escape(),
  
  body('topics')
    .isArray({ min: 1, max: 10 })
    .withMessage('Must select 1-10 topics'),
  
  body('gitSource')
    .optional()
    .isURL()
    .withMessage('Must be a valid URL'),
  
  body('status')
    .isIn(['draft', 'published'])
    .withMessage('Invalid status')
];
```

### 7.3 CSRF Protection

```javascript
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// Apply to state-changing routes
app.post('/api/admin/*', csrfProtection, (req, res) => {
  // Route handler
});

// Generate token
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

### 7.4 Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests, please try again later'
});

// Strict limit for authentication
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
```

### 7.5 Security Headers

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

## 8. Implementation Phases

### Phase 1: Backend Foundation (Week 1-2)

**Objectives:**
- Set up Node.js/Express backend
- Configure PostgreSQL database
- Implement authentication system

**Tasks:**
1. Initialize backend project structure
2. Set up PostgreSQL connection and migrations
3. Create database schema
4. Implement JWT authentication
5. Create user model and auth endpoints
6. Set up middleware (auth, validation, error handling)
7. Configure security headers and CORS
8. Write unit tests for auth

**Deliverables:**
- Working backend API with authentication
- Database schema deployed
- API documentation
- Unit test coverage >80%

**Dependencies:** None

### Phase 2: Publication API (Week 2-3)

**Objectives:**
- Implement publication CRUD operations
- Add audit logging
- Create admin endpoints

**Tasks:**
1. Create publication model and service
2. Implement CRUD endpoints
3. Add validation and sanitization
4. Implement audit logging middleware
5. Create statistics endpoints
6. Add rate limiting
7. Write integration tests

**Deliverables:**
- Complete publication API
- Audit logging system
- Integration test coverage >70%

**Dependencies:** Phase 1 complete

### Phase 3: Frontend Authentication (Week 3-4)

**Objectives:**
- Implement admin login
- Set up routing
- Create authentication context

**Tasks:**
1. Set up React Router
2. Create AuthContext and hooks
3. Implement AdminLogin component
4. Create ProtectedRoute component
5. Add token refresh logic
6. Implement logout functionality
7. Add loading and error states
8. Write component tests

**Deliverables:**
- Working admin login
- Protected route system
- Token management
- Component test coverage >80%

**Dependencies:** Phase 2 complete

### Phase 4: Admin Dashboard (Week 4-5)

**Objectives:**
- Create admin dashboard
- Implement publication list
- Add statistics panel

**Tasks:**
1. Create AdminDashboard component
2. Implement StatisticsPanel
3. Create PublicationList with DataTable
4. Add search and filtering
5. Implement pagination
6. Create PublicationContext
7. Add real-time updates (SSE)
8. Write component tests

**Deliverables:**
- Functional admin dashboard
- Publication list with management
- Statistics display
- Real-time updates

**Dependencies:** Phase 3 complete

### Phase 5: Publication Management (Week 5-6)

**Objectives:**
- Create publication form
- Implement CRUD operations
- Add validation

**Tasks:**
1. Create PublicationForm component
2. Implement form validation
3. Add multi-step wizard
4. Create PublicationEditor
5. Implement auto-save drafts
6. Add image upload
7. Create ConfirmDialog component
8. Add toast notifications
9. Write component tests

**Deliverables:**
- Complete publication management
- Form validation
- Auto-save functionality
- User feedback system

**Dependencies:** Phase 4 complete

### Phase 6: Public Views (Week 6-7)

**Objectives:**
- Create public publication views
- Implement search
- Add filtering

**Tasks:**
1. Create PublicationGrid component
2. Implement PublicationDetail
3. Add SearchBar component
4. Implement filtering by tags
5. Add pagination
6. Optimize for performance
7. Write component tests

**Deliverables:**
- Public publication views
- Search and filter functionality
- Responsive design

**Dependencies:** Phase 5 complete

### Phase 7: Audit Logging & Analytics (Week 7-8)

**Objectives:**
- Create audit log viewer
- Implement analytics dashboard
- Add export functionality

**Tasks:**
1. Create AuditLogViewer component
2. Implement log filtering
3. Add date range picker
4. Create analytics charts
5. Implement export functionality
6. Add data visualization
7. Write component tests

**Deliverables:**
- Audit log viewer
- Analytics dashboard
- Export capabilities

**Dependencies:** Phase 6 complete

### Phase 8: Testing & Deployment (Week 8-9)

**Objectives:**
- End-to-end testing
- Performance optimization
- Production deployment

**Tasks:**
1. Write E2E tests
2. Performance testing and optimization
3. Security audit
4. Update Docker configurations
5. Deploy to IBM Cloud Code Engine
6. Configure monitoring and logging
7. Create deployment documentation

**Deliverables:**
- E2E test suite
- Production-ready application
- Deployment documentation
- Monitoring setup

**Dependencies:** Phase 7 complete

---

## 9. Deployment Configuration

### 9.1 Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["node", "server.js"]
```

### 9.2 Code Engine Deployment

```bash
# Create backend application
ibmcloud ce application create \
  --name bob-catalog-backend \
  --build-source https://github.com/your-repo/backend \
  --build-context-dir backend \
  --port 3000 \
  --min-scale 1 \
  --max-scale 5 \
  --cpu 0.5 \
  --memory 1G \
  --env-from-secret db-credentials \
  --env-from-secret jwt-secrets

# Update frontend to proxy to backend
ibmcloud ce application update \
  --name carbon-react-app \
  --env BACKEND_URL=https://bob-catalog-backend.xxx.codeengine.appdomain.cloud
```

### 9.3 Environment Variables

**Backend (.env):**
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname
DB_SSL=true

# JWT
JWT_SECRET=your-256-bit-secret
JWT_REFRESH_SECRET=your-256-bit-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Application
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-frontend-url.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 10. Monitoring & Maintenance

### 10.1 Logging Strategy

**Winston Configuration:**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### 10.2 Health Checks

```javascript
// healthcheck.js
const http = require('http');

const options = {
  host: 'localhost',
  port: 3000,
  path: '/health',
  timeout: 2000
};

const request = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', () => {
  process.exit(1);
});

request.end();
```

### 10.3 Monitoring Metrics

**Key Metrics to Track:**
- API response times
- Error rates
- Authentication success/failure rates
- Database query performance
- Publication view counts
- User activity patterns
- System resource usage

---

## 11. Future Enhancements

### 11.1 Short-term (3-6 months)

1. **Multi-language Support**
   - Internationalization (i18n)
   - Content translation

2. **Advanced Search**
   - Elasticsearch integration
   - Faceted search
   - Search suggestions

3. **Email Notifications**
   - Publication approval workflow
   - Activity digests
   - System alerts

### 11.2 Long-term (6-12 months)

1. **Role Expansion**
   - Content reviewer role
   - Read-only viewer role
   - Custom permissions

2. **Version Control**
   - Publication versioning
   - Rollback capability
   - Change history

3. **API for External Integration**
   - Public API for publication data
   - Webhook support
   - API key management

4. **Advanced Analytics**
   - User behavior tracking
   - A/B testing
   - Conversion tracking

---

## 12. Conclusion

This architecture provides a comprehensive, secure, and scalable solution for implementing an admin profile system with publication management. The design leverages modern technologies, follows security best practices, and integrates seamlessly with the existing React/Vite/Carbon setup.

**Key Strengths:**
- ✅ Secure authentication with JWT
- ✅ Role-based access control
- ✅ Comprehensive audit logging
- ✅ Scalable architecture
- ✅ IBM Cloud Code Engine compatible
- ✅ Modern tech stack
- ✅ Clear implementation phases

**Next Steps:**
1. Review and approve this architecture
2. Set up development environment
3. Begin Phase 1 implementation
4. Establish CI/CD pipeline
5. Configure monitoring and logging

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-02  
**Author:** Bob Planning Mode  
**Status:** Ready for Review
# Bob Catalog Backend API

Backend API for the Bob Catalog Admin Profile System with Publication Management.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Security Features](#security-features)
- [Development](#development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Overview

This is a Node.js/Express backend API that provides:
- JWT-based authentication with refresh tokens
- Role-based access control (Admin/Viewer)
- Publication CRUD operations
- Audit logging for all admin actions
- Full-text search capabilities
- Rate limiting and security headers
- CSRF protection

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Database**: PostgreSQL 14+ or JSON file storage for demo deployments
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: express-validator
- **Security**: helmet, cors, express-rate-limit

## Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- PostgreSQL 14.x or higher only when [`STORAGE_MODE`](backend/.env.example) is set to `database`

## Installation

1. **Clone the repository** (if not already done):
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

## Configuration

1. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Configure environment variables** in `.env`:

   ```bash
   # Storage Configuration
   STORAGE_MODE=database
   FILE_STORAGE_DIR=./data
   FILE_STORAGE_PATH=./data/app-data.json
   DEMO_ADMIN_EMAIL=admin@example.com
   DEMO_ADMIN_PASSWORD=admin123
   DEMO_ADMIN_NAME=System Administrator

   # Database Configuration
   DATABASE_URL=postgresql://username:password@localhost:5432/bob_catalog
   DB_SSL=false

   # JWT Configuration (Generate secure random strings)
   JWT_SECRET=your-super-secret-jwt-key-min-256-bits
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-256-bits
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   
   # Application Configuration
   NODE_ENV=development
   PORT=3000
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:5173
   
   # CSRF Configuration
   CSRF_SECRET=your-csrf-secret-key
   
   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   AUTH_RATE_LIMIT_MAX_REQUESTS=5
   ```

   **Important**: Generate secure random strings for secrets in production:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

## Database Setup

### PostgreSQL mode

Use this when [`STORAGE_MODE`](backend/.env.example) is set to `database`.

1. **Create PostgreSQL database**:
   ```bash
   createdb bob_catalog
   ```

2. **Run database schema**:
   ```bash
   psql -d bob_catalog -f src/config/database.sql
   ```

   This will create:
   - Users table with default admin user
   - Publications table with full-text search
   - Audit logs table
   - Refresh tokens table
   - All necessary indexes and constraints

3. **Default Admin Credentials**:
   - Email: `admin@example.com`
   - Password: `Admin123!`

   **⚠️ IMPORTANT**: Change this password immediately after first login!

### File storage mode

Use this when [`STORAGE_MODE`](backend/.env.example) is set to `file`.

1. No PostgreSQL setup is required.
2. On first startup, the backend creates [`app-data.json`](backend/src/config/fileStore.js) under the configured file storage path.
3. A default admin user is created from:
   - [`DEMO_ADMIN_EMAIL`](backend/.env.example)
   - [`DEMO_ADMIN_PASSWORD`](backend/.env.example)
   - [`DEMO_ADMIN_NAME`](backend/.env.example)

This mode is intended for demo and single-instance deployments. Data is persisted to the local filesystem and is not suitable for horizontally scaled production workloads.

## Running the Application

### Development Mode

```bash
npm run dev
```

This starts the server with nodemon for auto-reloading on file changes.

### Production Mode

```bash
npm start
```

The server will start on the port specified in `.env` (default: 3000).

When using file storage mode, the backend skips PostgreSQL connection checks and serves the same API contract using the JSON-backed store.

## API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication Endpoints

#### POST /api/auth/login
Login and receive access token.

**Request Body**:
```json
{
  "email": "admin@example.com",
  "password": "Admin123!"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "name": "System Administrator",
      "role": "admin"
    },
    "accessToken": "jwt-token",
    "expiresIn": 900
  }
}
```

#### POST /api/auth/refresh
Refresh access token using refresh token cookie.

#### POST /api/auth/logout
Logout and revoke refresh token.

#### GET /api/auth/me
Get current user information (requires authentication).

### Publication Endpoints (Admin)

All admin endpoints require `Authorization: Bearer <token>` header.

#### GET /api/admin/publications
Get all publications with pagination and filtering.

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 20)
- `sort` (default: created_at)
- `order` (default: DESC)
- `search` (optional)
- `status` (optional: draft|published)

#### POST /api/admin/publications
Create new publication.

**Request Body**:
```json
{
  "title": "Demo Title",
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

#### PUT /api/admin/publications/:id
Update existing publication.

#### DELETE /api/admin/publications/:id
Delete publication.

### Publication Endpoints (Public)

#### GET /api/publications
Get published publications (no authentication required).

**Query Parameters**:
- `page`, `limit`, `search`
- `topics` (comma-separated)
- `industries` (comma-separated)

#### GET /api/publications/:id
Get single published publication by ID.

### Admin Dashboard Endpoints

#### GET /api/admin/dashboard/stats
Get dashboard statistics.

#### GET /api/admin/audit-logs
Get audit logs with filtering.

#### GET /api/admin/health
Get system health status.

## Security Features

### Implemented Security Measures

1. **Authentication**:
   - JWT access tokens (15 min expiry)
   - Refresh tokens (7 day expiry) with rotation
   - httpOnly cookies for refresh tokens

2. **Authorization**:
   - Role-based access control (RBAC)
   - Admin-only endpoints protection

3. **Input Validation**:
   - express-validator for all inputs
   - SQL injection prevention via parameterized queries
   - XSS protection via input sanitization

4. **Rate Limiting**:
   - General API: 100 requests per 15 minutes
   - Auth endpoints: 5 requests per 15 minutes

5. **Security Headers**:
   - Helmet.js for security headers
   - CORS configuration
   - CSP (Content Security Policy)

6. **CSRF Protection**:
   - Double-submit cookie pattern
   - Token validation on state-changing operations

7. **Audit Logging**:
   - All admin actions logged
   - IP address and user agent tracking
   - Success/failure tracking

## Development

### Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.js  # Database connection
│   │   └── database.sql # Database schema
│   ├── controllers/     # Business logic
│   │   ├── auth.controller.js
│   │   ├── publication.controller.js
│   │   └── admin.controller.js
│   ├── middleware/      # Express middleware
│   │   ├── auth.js      # Authentication
│   │   ├── security.js  # Security measures
│   │   └── validation.js # Input validation
│   ├── routes/          # API routes
│   │   ├── auth.routes.js
│   │   ├── publication.routes.js
│   │   └── admin.routes.js
│   ├── utils/           # Utility functions
│   │   ├── jwt.js       # JWT operations
│   │   ├── password.js  # Password hashing
│   │   └── audit.js     # Audit logging
│   └── server.js        # Application entry point
├── .env.example         # Environment template
├── .dockerignore
├── Dockerfile
├── package.json
└── README.md
```

### Adding New Endpoints

1. Create controller function in appropriate controller file
2. Add validation schema in `middleware/validation.js`
3. Define route in appropriate route file
4. Add authentication/authorization middleware as needed

### Database Migrations

For schema changes:
1. Update `src/config/database.sql`
2. Create migration script if needed
3. Test on development database first

## Deployment

### Docker Deployment

1. **Build Docker image**:
   ```bash
   docker build -t bob-catalog-backend .
   ```

2. **Run container**:
   ```bash
   docker run -p 3000:3000 \
     -e DATABASE_URL=postgresql://... \
     -e JWT_SECRET=... \
     -e JWT_REFRESH_SECRET=... \
     bob-catalog-backend
   ```

### IBM Cloud Code Engine

```bash
ibmcloud ce application create \
  --name bob-catalog-backend \
  --build-source . \
  --port 3000 \
  --min-scale 1 \
  --max-scale 5 \
  --cpu 0.5 \
  --memory 1G \
  --env-from-secret db-credentials \
  --env-from-secret jwt-secrets
```

### Environment Variables for Production

Ensure these are set in production:
- `NODE_ENV=production`
- `DB_SSL=true`
- Strong random values for all secrets
- Correct `CORS_ORIGIN` for your frontend
- `COOKIE_SECURE=true`

## Troubleshooting

### Database Connection Issues

**Problem**: Cannot connect to database

**Solutions**:
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL format
- Ensure database exists: `psql -l`
- Check firewall/network settings

### Authentication Issues

**Problem**: Token expired errors

**Solutions**:
- Tokens expire after 15 minutes (access) / 7 days (refresh)
- Implement token refresh in frontend
- Check system time synchronization

### CORS Errors

**Problem**: CORS policy blocking requests

**Solutions**:
- Verify `CORS_ORIGIN` in `.env` matches frontend URL
- Check if credentials are being sent with requests
- Ensure frontend sends proper headers

### Rate Limiting

**Problem**: Too many requests error

**Solutions**:
- Wait for rate limit window to reset (15 minutes)
- Adjust limits in `.env` if needed for development
- Implement exponential backoff in client

## Support

For issues and questions:
1. Check this README
2. Review ARCHITECTURE.md for system design
3. Check application logs
4. Review audit logs for security issues

## License

ISC
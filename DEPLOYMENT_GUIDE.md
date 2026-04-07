# Deployment Guide

Complete guide for deploying the Bob Demo Catalog application in various environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Building for Production](#building-for-production)
- [Docker Deployment](#docker-deployment)
- [IBM Cloud Code Engine Deployment](#ibm-cloud-code-engine-deployment)
- [Security Checklist](#security-checklist)
- [Monitoring and Logging](#monitoring-and-logging)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **PostgreSQL**: v14.x or higher
- **Docker**: v20.x or higher (for containerized deployment)
- **Docker Compose**: v2.x or higher (for local Docker setup)

### Optional Tools

- **Git**: For version control
- **IBM Cloud CLI**: For IBM Cloud deployments
- **pgAdmin**: For database management

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd bob-demo-catalog
```

### 2. Install Dependencies

#### Backend

```bash
cd backend
npm install
```

#### Frontend

```bash
cd ..
npm install
```

### 3. Configure Environment Variables

#### Backend Environment

Create `backend/.env` from the example:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your local settings:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bob_demo_catalog
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend Environment

Create `.env` in the root directory:

```env
VITE_API_URL=http://localhost:3000/api
```

### 4. Setup Database

#### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE bob_demo_catalog;

# Exit psql
\q
```

#### Run Database Schema

```bash
cd backend
psql -U postgres -d bob_demo_catalog -f src/config/database.sql
```

### 5. Create Admin User

After running the schema, create an admin user:

```sql
-- Connect to database
psql -U postgres -d bob_demo_catalog

-- Insert admin user (password: admin123)
INSERT INTO users (email, password_hash, name, role)
VALUES (
  'admin@example.com',
  '$2b$10$YourHashedPasswordHere',
  'Admin User',
  'admin'
);
```

**Note**: Generate a proper password hash using bcrypt before inserting.

### 6. Start Development Servers

#### Backend

```bash
cd backend
npm run dev
```

Backend will run on `http://localhost:3000`

#### Frontend

```bash
# In root directory
npm run dev
```

Frontend will run on `http://localhost:5173`

### 7. Access the Application

- **Public Site**: http://localhost:5173
- **Admin Login**: http://localhost:5173/admin/login
- **API Health**: http://localhost:3000/health

## Environment Variables

### Backend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | Yes |
| `PORT` | Server port | `3000` | Yes |
| `DB_HOST` | Database host | `localhost` | Yes |
| `DB_PORT` | Database port | `5432` | Yes |
| `DB_NAME` | Database name | - | Yes |
| `DB_USER` | Database user | - | Yes |
| `DB_PASSWORD` | Database password | - | Yes |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `JWT_EXPIRES_IN` | JWT expiration | `24h` | Yes |
| `CORS_ORIGIN` | Allowed CORS origin | - | Yes |
| `BCRYPT_ROUNDS` | Password hash rounds | `10` | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` | No |

### Frontend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API URL | - | Yes |

## Database Setup

### Schema Overview

The application uses PostgreSQL with the following main tables:

- **users**: Admin user accounts
- **publications**: Publication records
- **audit_logs**: Activity audit trail

### Database Migrations

Currently, the application uses a single SQL schema file. For production:

1. Backup existing database before changes
2. Apply schema updates carefully
3. Test in staging environment first

### Database Backup

```bash
# Backup database
pg_dump -U postgres bob_demo_catalog > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
psql -U postgres bob_demo_catalog < backup_20240402_120000.sql
```

## Building for Production

### Backend Build

The backend doesn't require a build step but ensure:

```bash
cd backend
npm install --production
```

### Frontend Build

```bash
# Build frontend
npm run build

# Output will be in dist/ directory
```

### Build Optimization

- Minification is enabled by default
- Source maps are generated for debugging
- Assets are optimized and hashed

## Docker Deployment

### Using Docker Compose

The easiest way to deploy with Docker:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Docker Containers

#### Backend Container

```bash
cd backend
docker build -t bob-demo-backend .
docker run -d \
  --name bob-backend \
  -p 3000:3000 \
  --env-file .env \
  bob-demo-backend
```

#### Frontend Container

```bash
docker build -t bob-demo-frontend .
docker run -d \
  --name bob-frontend \
  -p 80:80 \
  bob-demo-frontend
```

### Docker Environment Variables

Pass environment variables using:

- `--env-file` flag
- `-e` flag for individual variables
- Docker Compose environment section

## IBM Cloud Code Engine Deployment

### Prerequisites

1. Install IBM Cloud CLI
2. Install Code Engine plugin
3. Login to IBM Cloud

```bash
ibmcloud login
ibmcloud plugin install code-engine
```

### Deploy Backend

```bash
# Create Code Engine project
ibmcloud ce project create --name bob-demo-catalog

# Select project
ibmcloud ce project select --name bob-demo-catalog

# Create PostgreSQL service (or use existing)
# Configure database connection

# Deploy backend application
ibmcloud ce application create \
  --name bob-backend \
  --image <your-registry>/bob-demo-backend:latest \
  --port 3000 \
  --env NODE_ENV=production \
  --env DB_HOST=<db-host> \
  --env DB_NAME=<db-name> \
  --env DB_USER=<db-user> \
  --env-from-secret db-credentials \
  --env-from-secret jwt-secret \
  --min-scale 1 \
  --max-scale 5 \
  --cpu 0.5 \
  --memory 1G
```

### Deploy Frontend

```bash
# Deploy frontend application
ibmcloud ce application create \
  --name bob-frontend \
  --image <your-registry>/bob-demo-frontend:latest \
  --port 80 \
  --env VITE_API_URL=<backend-url> \
  --min-scale 1 \
  --max-scale 3 \
  --cpu 0.25 \
  --memory 512M
```

### Configure Secrets

```bash
# Create secret for database credentials
ibmcloud ce secret create \
  --name db-credentials \
  --from-literal DB_PASSWORD=<password>

# Create secret for JWT
ibmcloud ce secret create \
  --name jwt-secret \
  --from-literal JWT_SECRET=<secret>
```

### Custom Domain

```bash
# Add custom domain
ibmcloud ce application update bob-frontend \
  --domain-mapping <your-domain.com>
```

## Security Checklist

### Pre-Deployment

- [ ] Change all default passwords
- [ ] Generate strong JWT secret (min 32 characters)
- [ ] Configure CORS for production domain only
- [ ] Enable HTTPS/TLS
- [ ] Review and update rate limits
- [ ] Disable debug logging in production
- [ ] Remove development dependencies
- [ ] Scan for vulnerabilities (`npm audit`)

### Database Security

- [ ] Use strong database password
- [ ] Restrict database access to application only
- [ ] Enable SSL for database connections
- [ ] Regular database backups
- [ ] Implement backup retention policy

### Application Security

- [ ] Environment variables not committed to git
- [ ] Secrets stored securely (vault/secrets manager)
- [ ] Input validation enabled
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection headers configured
- [ ] CSRF protection enabled
- [ ] Rate limiting configured

### Network Security

- [ ] Firewall rules configured
- [ ] Only necessary ports exposed
- [ ] DDoS protection enabled
- [ ] CDN configured (if applicable)

## Monitoring and Logging

### Application Logs

#### Backend Logging

Logs are written to stdout/stderr. Configure log aggregation:

```bash
# View Docker logs
docker logs -f bob-backend

# View Code Engine logs
ibmcloud ce application logs --name bob-backend
```

#### Frontend Logging

Frontend logs are in browser console. Use error tracking service:

- Sentry
- LogRocket
- Datadog RUM

### Health Checks

#### Backend Health Endpoint

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-04-02T15:00:00.000Z",
  "uptime": 3600
}
```

### Monitoring Metrics

Monitor these key metrics:

- **Response Time**: API endpoint latency
- **Error Rate**: 4xx and 5xx responses
- **Database Connections**: Active connections
- **Memory Usage**: Application memory
- **CPU Usage**: Application CPU
- **SSE Connections**: Active real-time connections

### Recommended Tools

- **Application Performance**: New Relic, Datadog
- **Log Management**: ELK Stack, Splunk
- **Uptime Monitoring**: Pingdom, UptimeRobot
- **Error Tracking**: Sentry, Rollbar

## Troubleshooting

### Common Issues

#### Database Connection Failed

**Symptoms**: Backend fails to start, database connection errors

**Solutions**:
1. Verify database is running: `pg_isready -h localhost -p 5432`
2. Check credentials in `.env`
3. Verify database exists: `psql -U postgres -l`
4. Check firewall rules
5. Verify PostgreSQL is accepting connections

#### CORS Errors

**Symptoms**: Frontend can't connect to backend, CORS errors in console

**Solutions**:
1. Check `CORS_ORIGIN` in backend `.env`
2. Ensure frontend URL matches CORS origin
3. Verify protocol (http vs https)
4. Check for trailing slashes

#### JWT Token Errors

**Symptoms**: Authentication fails, "Invalid token" errors

**Solutions**:
1. Verify `JWT_SECRET` is set
2. Check token expiration time
3. Clear browser localStorage
4. Verify token format in requests

#### SSE Connection Issues

**Symptoms**: Real-time updates not working

**Solutions**:
1. Check browser console for SSE errors
2. Verify `/api/events` endpoint is accessible
3. Check for proxy/load balancer timeout settings
4. Verify CORS headers for SSE
5. Check network tab for EventSource connection

#### Build Failures

**Symptoms**: `npm run build` fails

**Solutions**:
1. Clear node_modules: `rm -rf node_modules && npm install`
2. Clear npm cache: `npm cache clean --force`
3. Check Node.js version: `node --version`
4. Review build error messages
5. Check for TypeScript errors

#### Docker Issues

**Symptoms**: Container fails to start

**Solutions**:
1. Check Docker logs: `docker logs <container-name>`
2. Verify environment variables
3. Check port conflicts: `lsof -i :3000`
4. Verify image built correctly
5. Check Docker daemon status

### Performance Issues

#### Slow API Responses

1. Check database query performance
2. Add database indexes
3. Enable query caching
4. Optimize N+1 queries
5. Review rate limiting settings

#### High Memory Usage

1. Check for memory leaks
2. Review SSE connection management
3. Optimize database connection pooling
4. Monitor Node.js heap usage
5. Consider horizontal scaling

### Getting Help

- **Documentation**: Review ARCHITECTURE.md and API_DOCUMENTATION.md
- **Logs**: Check application and database logs
- **Community**: Search for similar issues
- **Support**: Contact development team

## Additional Resources

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [IBM Cloud Code Engine](https://cloud.ibm.com/docs/codeengine)
- [Carbon Design System](https://carbondesignsystem.com/)

---

**Last Updated**: April 2024  
**Version**: 1.0.0
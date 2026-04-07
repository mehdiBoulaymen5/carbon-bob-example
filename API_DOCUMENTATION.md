# API Documentation

Complete API reference for the Bob Demo Catalog backend.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

## Table of Contents

- [Authentication](#authentication)
- [Public Endpoints](#public-endpoints)
- [Admin Endpoints](#admin-endpoints)
- [Server-Sent Events (SSE)](#server-sent-events-sse)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Security](#security)

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Admin endpoints require a valid JWT token in the Authorization header.

### Login

Authenticate and receive a JWT token.

**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "email": "admin@example.com",
  "password": "your_password"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "admin"
    }
  },
  "message": "Login successful"
}
```

**Error Response** (401 Unauthorized):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

### Logout

Invalidate the current session.

**Endpoint**: `POST /auth/logout`

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Get Current User

Get authenticated user information.

**Endpoint**: `GET /auth/me`

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

## Public Endpoints

### Get Published Publications

Retrieve a paginated list of published publications.

**Endpoint**: `GET /publications`

**Query Parameters**:
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `search` (string, optional): Search query for title/description
- `topics` (string, optional): Comma-separated topics filter
- `industries` (string, optional): Comma-separated industries filter

**Example Request**:
```
GET /publications?page=1&limit=12&search=AI&topics=Machine Learning,Data Science
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "publications": [
      {
        "id": "uuid",
        "title": "AI-Powered Data Analysis",
        "description": "Comprehensive guide to AI data analysis",
        "topics": ["Machine Learning", "Data Science"],
        "audience": ["Data Scientists", "Developers"],
        "industries": ["Technology", "Finance"],
        "git_source": "https://github.com/example/repo",
        "box_source": "https://box.com/example",
        "icon": "DataAnalysis",
        "view_count": 150,
        "published_at": "2024-04-01T10:00:00.000Z",
        "created_at": "2024-03-15T08:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "totalPages": 5,
      "totalCount": 58
    }
  }
}
```

### Get Publication by ID

Retrieve a single published publication with related publications.

**Endpoint**: `GET /publications/:id`

**Parameters**:
- `id` (string, required): Publication UUID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "AI-Powered Data Analysis",
    "description": "Comprehensive guide to AI data analysis",
    "topics": ["Machine Learning", "Data Science"],
    "audience": ["Data Scientists", "Developers"],
    "industries": ["Technology", "Finance"],
    "git_source": "https://github.com/example/repo",
    "box_source": "https://box.com/example",
    "icon": "DataAnalysis",
    "view_count": 151,
    "published_at": "2024-04-01T10:00:00.000Z",
    "created_at": "2024-03-15T08:30:00.000Z",
    "relatedPublications": [
      {
        "id": "uuid",
        "title": "Related Publication",
        "description": "Brief description",
        "topics": ["Machine Learning"],
        "icon": "Analytics",
        "view_count": 89
      }
    ]
  }
}
```

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Publication not found"
  }
}
```

## Admin Endpoints

All admin endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Get All Publications (Admin)

Retrieve all publications with admin details.

**Endpoint**: `GET /admin/publications`

**Query Parameters**:
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `sort` (string, optional): Sort field (default: created_at)
  - Options: `created_at`, `updated_at`, `title`, `view_count`
- `order` (string, optional): Sort order (default: DESC)
  - Options: `ASC`, `DESC`
- `search` (string, optional): Search query
- `status` (string, optional): Filter by status
  - Options: `published`, `draft`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "publications": [
      {
        "id": "uuid",
        "title": "Publication Title",
        "description": "Description",
        "topics": ["Topic1", "Topic2"],
        "audience": ["Audience1"],
        "industries": ["Industry1"],
        "git_source": "https://github.com/example/repo",
        "box_source": "https://box.com/example",
        "icon": "Icon",
        "status": "published",
        "metadata": {},
        "view_count": 100,
        "created_by": "uuid",
        "updated_by": "uuid",
        "created_by_name": "Admin User",
        "updated_by_name": "Admin User",
        "published_at": "2024-04-01T10:00:00.000Z",
        "created_at": "2024-03-15T08:30:00.000Z",
        "updated_at": "2024-03-20T14:15:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalPages": 3,
      "totalCount": 58
    }
  }
}
```

### Create Publication

Create a new publication.

**Endpoint**: `POST /admin/publications`

**Request Body**:
```json
{
  "title": "New Publication",
  "description": "Detailed description of the publication",
  "topics": ["Topic1", "Topic2"],
  "audience": ["Developers", "Data Scientists"],
  "industries": ["Technology", "Finance"],
  "gitSource": "https://github.com/example/repo",
  "boxSource": "https://box.com/example",
  "icon": "DataAnalysis",
  "status": "published",
  "metadata": {
    "customField": "value"
  }
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "New Publication",
    "description": "Detailed description",
    "topics": ["Topic1", "Topic2"],
    "audience": ["Developers", "Data Scientists"],
    "industries": ["Technology", "Finance"],
    "git_source": "https://github.com/example/repo",
    "box_source": "https://box.com/example",
    "icon": "DataAnalysis",
    "status": "published",
    "metadata": {"customField": "value"},
    "view_count": 0,
    "created_by": "uuid",
    "updated_by": "uuid",
    "published_at": "2024-04-02T15:00:00.000Z",
    "created_at": "2024-04-02T15:00:00.000Z",
    "updated_at": "2024-04-02T15:00:00.000Z"
  },
  "message": "Publication created successfully"
}
```

### Update Publication

Update an existing publication.

**Endpoint**: `PUT /admin/publications/:id`

**Parameters**:
- `id` (string, required): Publication UUID

**Request Body** (all fields optional):
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "topics": ["Updated Topic"],
  "status": "draft"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Updated Title",
    "description": "Updated description",
    "topics": ["Updated Topic"],
    "status": "draft",
    "updated_at": "2024-04-02T15:30:00.000Z"
  },
  "message": "Publication updated successfully"
}
```

### Delete Publication

Delete a publication.

**Endpoint**: `DELETE /admin/publications/:id`

**Parameters**:
- `id` (string, required): Publication UUID

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Publication deleted successfully"
}
```

### Get Dashboard Statistics

Retrieve dashboard statistics.

**Endpoint**: `GET /admin/dashboard/stats`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalPublications": 58,
      "publishedPublications": 45,
      "draftPublications": 13,
      "totalViews": 5420
    },
    "recentActivity": [
      {
        "id": "uuid",
        "action": "CREATE",
        "resource_type": "publication",
        "resource_id": "uuid",
        "user_email": "admin@example.com",
        "timestamp": "2024-04-02T14:30:00.000Z"
      }
    ],
    "topViewed": [
      {
        "id": "uuid",
        "title": "Popular Publication",
        "view_count": 350,
        "status": "published"
      }
    ]
  }
}
```

### Get Audit Logs

Retrieve audit logs with filtering.

**Endpoint**: `GET /admin/audit-logs`

**Query Parameters**:
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 50)
- `action` (string, optional): Filter by action type
  - Options: `LOGIN`, `LOGOUT`, `CREATE`, `UPDATE`, `DELETE`
- `resourceType` (string, optional): Filter by resource type
- `userId` (string, optional): Filter by user ID
- `startDate` (string, optional): Start date (ISO 8601)
- `endDate` (string, optional): End date (ISO 8601)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "user_email": "admin@example.com",
        "action": "CREATE",
        "resource_type": "publication",
        "resource_id": "uuid",
        "changes": {},
        "ip_address": "192.168.1.1",
        "user_agent": "Mozilla/5.0...",
        "success": true,
        "timestamp": "2024-04-02T15:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "totalPages": 10,
      "totalCount": 487
    }
  }
}
```

## Server-Sent Events (SSE)

### Public SSE Endpoint

Subscribe to real-time publication updates.

**Endpoint**: `GET /events`

**Connection**: EventSource

**Event Types**:
- `connected` - Initial connection established
- `publication:created` - New publication published
- `publication:updated` - Publication updated
- `publication:deleted` - Publication deleted

**Event Format**:
```javascript
data: {
  "type": "publication:created",
  "data": {
    "id": "uuid",
    "title": "New Publication",
    "status": "published"
  },
  "timestamp": "2024-04-02T15:00:00.000Z"
}
```

**Client Example**:
```javascript
const eventSource = new EventSource('http://localhost:3000/api/events');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event received:', data);
};

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
};
```

### Admin SSE Endpoint

Subscribe to admin real-time updates (requires authentication).

**Endpoint**: `GET /admin/events`

**Headers**:
```
Authorization: Bearer <token>
```

**Note**: Since EventSource doesn't support custom headers, pass the token as a query parameter:
```
GET /admin/events?token=<your-jwt-token>
```

**Event Types**: Same as public endpoint

### SSE Connection Statistics

Get current SSE connection statistics.

**Endpoint**: `GET /events/stats`

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "publicConnections": 15,
  "adminConnections": 3,
  "totalConnections": 18
}
```

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate) |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

### Error Examples

**Validation Error**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required"
  }
}
```

**Authentication Error**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication token is required"
  }
}
```

**Rate Limit Error**:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later"
  }
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Window**: 15 minutes (900,000 ms)
- **Max Requests**: 100 per window per IP
- **Headers**: Rate limit info included in response headers
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets

**Example Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1712073600000
```

## Security

### CSRF Protection

All state-changing requests (POST, PUT, DELETE) require a CSRF token.

**Get CSRF Token**:
```
GET /csrf-token
```

**Response**:
```json
{
  "success": true,
  "csrfToken": "token-value"
}
```

**Include in Requests**:
```
X-CSRF-Token: token-value
```

### CORS

CORS is configured to allow requests from specified origins only. The `CORS_ORIGIN` environment variable controls allowed origins.

### Input Sanitization

All input is sanitized to prevent:
- SQL injection
- XSS attacks
- Command injection
- Path traversal

### Password Security

- Passwords are hashed using bcrypt
- Minimum 8 characters required
- Configurable hash rounds (default: 10)

## Health Check

Check API health status.

**Endpoint**: `GET /health`

**Response** (200 OK):
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-04-02T15:00:00.000Z",
  "uptime": 3600
}
```

## Versioning

Current API version: **v1**

The API does not currently use URL versioning. Future versions may use:
- URL versioning: `/api/v2/...`
- Header versioning: `Accept: application/vnd.api+json; version=2`

## Best Practices

### Pagination

Always use pagination for list endpoints:
```
GET /publications?page=1&limit=20
```

### Filtering

Combine multiple filters:
```
GET /publications?topics=AI,ML&industries=Tech&search=analysis
```

### Error Handling

Always check the `success` field:
```javascript
if (response.success) {
  // Handle success
} else {
  // Handle error using response.error
}
```

### Authentication

Store JWT securely:
- Use httpOnly cookies (if supported)
- Store in memory (not localStorage for sensitive apps)
- Implement token refresh mechanism

### SSE Connections

Handle reconnection:
```javascript
eventSource.onerror = () => {
  // Implement exponential backoff
  setTimeout(() => reconnect(), delay);
};
```

## Support

For API issues or questions:
- Check this documentation
- Review error messages
- Check application logs
- Contact development team

---

**API Version**: 1.0.0  
**Last Updated**: April 2024  
**Base URL**: `/api`
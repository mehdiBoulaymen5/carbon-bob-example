# 🚀 Refactoring Quick Reference Guide

Quick reference for using the new refactored code patterns.

## 📚 Table of Contents

- [Backend Patterns](#backend-patterns)
- [Frontend Patterns](#frontend-patterns)
- [Common Recipes](#common-recipes)

---

## Backend Patterns

### Response Handling

```javascript
const response = require('../utils/response');

// Success (200)
response.success(res, data);
response.success(res, data, 'Custom message');

// Created (201)
response.created(res, data);

// No Content (204)
response.noContent(res);

// Errors
response.badRequest(res, 'Invalid input');
response.unauthorized(res, 'Not authenticated');
response.forbidden(res, 'Access denied');
response.notFound(res, 'User');
response.conflict(res, 'Email already exists');
response.validationError(res, errors);
response.internalError(res);

// Paginated
response.paginated(res, items, {
  page: 1,
  limit: 20,
  totalPages: 5,
  totalCount: 100
});
```

### Error Handling

```javascript
const { AppError, asyncHandler } = require('../middleware/errorHandler');

// Wrap async functions
exports.myFunction = asyncHandler(async (req, res) => {
  // Your code here
  
  // Throw operational errors
  if (!item) {
    throw new AppError('Item not found', 404, 'NOT_FOUND');
  }
  
  return response.success(res, item);
});
```

### Using Constants

```javascript
const {
  TOKEN_EXPIRY,
  TOKEN_EXPIRY_MS,
  PAGINATION,
  USER_ROLES,
  PUBLICATION_STATUS,
  AUDIT_ACTIONS,
  HTTP_STATUS,
  ERROR_CODES
} = require('../config/constants');

// Examples
const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS.REFRESH_TOKEN);
const limit = PAGINATION.DEFAULT_LIMIT;
if (user.role === USER_ROLES.ADMIN) { /* ... */ }
if (pub.status === PUBLICATION_STATUS.PUBLISHED) { /* ... */ }
```

### Repository Pattern

```javascript
const userRepository = require('../repositories/user.repository');
const publicationRepository = require('../repositories/publication.repository');

// Find operations
const user = await userRepository.findById(id);
const user = await userRepository.findByEmail(email);
const users = await userRepository.findAll({ where: { role: 'admin' } });

// Create
const newUser = await userRepository.create({
  email: 'test@example.com',
  name: 'Test User',
  role: 'admin'
});

// Update
const updated = await userRepository.updateById(id, { name: 'New Name' });

// Delete
const deleted = await userRepository.deleteById(id);

// Pagination
const result = await publicationRepository.paginate({
  page: 1,
  limit: 20,
  where: { status: 'published' },
  orderBy: { created_at: 'DESC' }
});
// result = { items: [...], pagination: { ... } }

// Custom methods
const published = await publicationRepository.findPublished();
const topViewed = await publicationRepository.getTopViewed(10);
await publicationRepository.incrementViewCount(id);
```

### Token Service

```javascript
const tokenService = require('../services/token.service');

// Generate token pair
const tokens = await tokenService.generateTokenPair(user);
// { accessToken, refreshToken, expiresIn }

// Rotate refresh token
const result = await tokenService.rotateRefreshToken(refreshToken);

// Revoke tokens
await tokenService.revokeRefreshTokenByString(refreshToken);
await tokenService.revokeAllUserTokens(userId);

// Cookie management
tokenService.setRefreshTokenCookie(res, refreshToken);
tokenService.clearRefreshTokenCookie(res);

// Cleanup
await tokenService.cleanupExpiredTokens();
```

---

## Frontend Patterns

### useDebounce Hook

```javascript
import { useDebounce } from '../hooks/useDebounce';

const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebounce(searchQuery, 500);

useEffect(() => {
  // This only runs 500ms after user stops typing
  fetchData(debouncedSearch);
}, [debouncedSearch]);
```

### usePagination Hook

```javascript
import { usePagination } from '../hooks/usePagination';

const pagination = usePagination({
  initialPage: 1,
  initialPageSize: 20,
  pageSizeOptions: [10, 20, 30, 40, 50]
});

// Update total items when data loads
useEffect(() => {
  pagination.setTotalItems(data.totalCount);
}, [data]);

// Use in component
<Pagination
  page={pagination.page}
  pageSize={pagination.pageSize}
  pageSizes={pagination.pageSizeOptions}
  totalItems={pagination.totalItems}
  onChange={pagination.handlePaginationChange}
/>

// Access state
pagination.page          // Current page
pagination.pageSize      // Items per page
pagination.totalPages    // Total pages
pagination.hasNext       // Has next page
pagination.hasPrev       // Has previous page
pagination.offset        // Offset for API calls

// Actions
pagination.goToPage(3)
pagination.nextPage()
pagination.prevPage()
pagination.changePageSize(30)
pagination.reset()
```

### useNotification Hook

```javascript
import { useNotification } from '../hooks/useNotification';

const notification = useNotification();

// Show notifications
notification.success('Success!', 'Operation completed');
notification.error('Error!', 'Something went wrong', 0); // No auto-dismiss
notification.warning('Warning!', 'Please check this');
notification.info('Info', 'FYI');

// Custom notification
notification.showNotification({
  kind: 'success',
  title: 'Custom',
  subtitle: 'Custom notification',
  timeout: 3000
});

// Dismiss
notification.dismissNotification(id);
notification.clearAll();

// Render notifications
{notification.notifications.map(notif => (
  <ToastNotification
    key={notif.id}
    kind={notif.kind}
    title={notif.title}
    subtitle={notif.subtitle}
    timeout={notif.timeout}
    onClose={() => notification.dismissNotification(notif.id)}
  />
))}
```

### useDataFetching Hook

```javascript
import { useDataFetching } from '../hooks/useDataFetching';

const {
  data,
  loading,
  error,
  lastFetch,
  refetch,
  clearCache,
  reset,
  isStale
} = useDataFetching(
  async ({ signal }) => {
    // Fetch function with abort signal support
    return await api.getData({ signal });
  },
  [dependency1, dependency2], // Dependencies
  {
    initialData: [],
    cacheKey: 'myData',
    cacheDuration: 5 * 60 * 1000, // 5 minutes
    enabled: true,
    onSuccess: (data) => console.log('Success:', data),
    onError: (error) => console.error('Error:', error)
  }
);

// Use in component
if (loading) return <Loading />;
if (error) return <Error message={error} />;
return <DataDisplay data={data} />;

// Manual refetch
<Button onClick={refetch}>Refresh</Button>
```

### Formatters

```javascript
import {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatNumber,
  formatPercentage,
  formatFileSize,
  truncate,
  capitalize,
  toTitleCase,
  formatCurrency,
  formatArray,
  formatBoolean,
  formatStatus
} from '../utils/formatters';

// Dates
formatDate('2024-01-15')                    // "Jan 15, 2024"
formatDateTime('2024-01-15T10:30:00')       // "Jan 15, 2024, 10:30 AM"
formatRelativeTime('2024-01-15T10:30:00')  // "2 hours ago"

// Numbers
formatNumber(1234567)                       // "1,234,567"
formatPercentage(0.856, 1)                  // "85.6%"
formatFileSize(1536000)                     // "1.46 MB"

// Strings
truncate('Long text here...', 20)           // "Long text here..."
capitalize('hello world')                   // "Hello world"
toTitleCase('hello world')                  // "Hello World"

// Currency
formatCurrency(1234.56)                     // "$1,234.56"
formatCurrency(1234.56, 'EUR', 'de-DE')    // "1.234,56 €"

// Arrays
formatArray(['a', 'b', 'c'])               // "a, b, c"
formatArray(['a', 'b', 'c'], ' | ')        // "a | b | c"

// Boolean
formatBoolean(true)                         // "Yes"
formatBoolean(false)                        // "No"

// Status
formatStatus('published')                   // { label: 'Published', color: 'green' }
```

---

## Common Recipes

### Complete CRUD Controller

```javascript
const repository = require('../repositories/item.repository');
const response = require('../utils/response');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { PAGINATION } = require('../config/constants');

// List with pagination
exports.list = asyncHandler(async (req, res) => {
  const { page = 1, limit = PAGINATION.DEFAULT_LIMIT, search } = req.query;
  
  const options = {
    page: parseInt(page),
    limit: parseInt(limit)
  };
  
  if (search) {
    options.where = { name: { operator: 'ILIKE', value: `%${search}%` } };
  }
  
  const result = await repository.paginate(options);
  return response.paginated(res, result.items, result.pagination);
});

// Get by ID
exports.getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await repository.findById(id);
  
  if (!item) {
    throw new AppError('Item not found', 404, 'NOT_FOUND');
  }
  
  return response.success(res, item);
});

// Create
exports.create = asyncHandler(async (req, res) => {
  const data = req.body;
  const item = await repository.create(data);
  return response.created(res, item, 'Item created successfully');
});

// Update
exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  
  const item = await repository.updateById(id, data);
  
  if (!item) {
    throw new AppError('Item not found', 404, 'NOT_FOUND');
  }
  
  return response.success(res, item, 'Item updated successfully');
});

// Delete
exports.delete = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await repository.deleteById(id);
  
  if (!item) {
    throw new AppError('Item not found', 404, 'NOT_FOUND');
  }
  
  return response.success(res, item, 'Item deleted successfully');
});
```

### Complete React Component with Hooks

```javascript
import React, { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { usePagination } from '../hooks/usePagination';
import { useNotification } from '../hooks/useNotification';
import { useDataFetching } from '../hooks/useDataFetching';
import { formatDate, truncate } from '../utils/formatters';
import { DataTable, Pagination, Search } from '@carbon/react';

const MyComponent = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const pagination = usePagination();
  const notification = useNotification();
  
  const { data, loading, error, refetch } = useDataFetching(
    async () => {
      return await api.getData({
        page: pagination.page,
        limit: pagination.pageSize,
        search: debouncedSearch
      });
    },
    [pagination.page, pagination.pageSize, debouncedSearch],
    {
      cacheKey: `data-${pagination.page}-${debouncedSearch}`,
      onSuccess: (result) => {
        pagination.setTotalItems(result.totalCount);
      },
      onError: (err) => {
        notification.error('Error', err.message);
      }
    }
  );
  
  const handleDelete = async (id) => {
    try {
      await api.delete(id);
      notification.success('Success', 'Item deleted');
      refetch();
    } catch (err) {
      notification.error('Error', err.message);
    }
  };
  
  if (loading) return <Loading />;
  if (error) return <Error message={error} />;
  
  return (
    <div>
      <Search
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search..."
      />
      
      <DataTable
        rows={data.items}
        headers={headers}
      />
      
      <Pagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        totalItems={pagination.totalItems}
        onChange={pagination.handlePaginationChange}
      />
      
      {notification.notifications.map(notif => (
        <ToastNotification
          key={notif.id}
          {...notif}
          onClose={() => notification.dismissNotification(notif.id)}
        />
      ))}
    </div>
  );
};
```

---

## Tips & Best Practices

### Backend

1. **Always use asyncHandler** for async route handlers
2. **Use AppError** for operational errors
3. **Use response helpers** for consistent API responses
4. **Use constants** instead of magic numbers
5. **Use repositories** for database operations
6. **Use services** for business logic

### Frontend

1. **Use useDebounce** for search inputs
2. **Use usePagination** for paginated lists
3. **Use useNotification** for user feedback
4. **Use useDataFetching** for API calls with caching
5. **Use formatters** for consistent data display
6. **Memoize expensive computations** with useMemo
7. **Memoize callbacks** with useCallback

---

**Quick Tip**: Keep this guide open while refactoring for easy reference!
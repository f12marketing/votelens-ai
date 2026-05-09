# API Architecture

## RESTful API Design

### Base URL Structure

```
Development: https://api.votelens.dev
Production:  https://api.votelens.ai
Versioning:  /api/v1
```

## API Endpoints

### Authentication

```
POST   /api/v1/auth/register          Register new user
POST   /api/v1/auth/login             Login user
POST   /api/v1/auth/logout            Logout user
POST   /api/v1/auth/refresh           Refresh access token
POST   /api/v1/auth/forgot-password   Initiate password reset
POST   /api/v1/auth/reset-password    Complete password reset
GET    /api/v1/auth/me                Get current user
```

### Elections

```
GET    /api/v1/elections              List all elections
POST   /api/v1/elections              Create new election
GET    /api/v1/elections/:id          Get election details
PUT    /api/v1/elections/:id          Update election
DELETE /api/v1/elections/:id          Delete election
POST   /api/v1/elections/:id/upload  Upload dataset
GET    /api/v1/elections/:id/status   Get processing status
POST   /api/v1/elections/:id/process  Trigger processing
```

### Constituencies

```
GET    /api/v1/elections/:id/constituencies        List constituencies
POST   /api/v1/elections/:id/constituencies        Create constituency
GET    /api/v1/constituencies/:id                   Get constituency details
PUT    /api/v1/constituencies/:id                   Update constituency
DELETE /api/v1/constituencies/:id                   Delete constituency
GET    /api/v1/constituencies/:id/results           Get constituency results
GET    /api/v1/constituencies/:id/demographics      Get demographics
GET    /api/v1/constituencies/:id/history           Get historical data
```

### Analytics

```
GET    /api/v1/analytics/overview                   Get overview metrics
GET    /api/v1/analytics/trends                     Get trend data
GET    /api/v1/analytics/comparison                 Compare elections
GET    /api/v1/analytics/turnout                    Get turnout analysis
GET    /api/v1/analytics/demographics               Get demographic analysis
GET    /api/v1/analytics/geographic                 Get geographic analysis
```

### Insights

```
GET    /api/v1/elections/:id/insights               Get AI insights
POST   /api/v1/elections/:id/insights/generate      Generate insights
GET    /api/v1/insights/:id                         Get insight details
PUT    /api/v1/insights/:id/approve                 Approve insight
DELETE /api/v1/insights/:id                         Delete insight
GET    /api/v1/insights/trending                    Get trending insights
```

### Maps

```
GET    /api/v1/maps/elections/:id                   Get election map data
GET    /api/v1/maps/constituencies/:id              Get constituency map data
GET    /api/v1/maps/geojson/:id                     Get GeoJSON data
GET    /api/v1/maps/heatmap/:id                     Get heatmap data
```

### Natural Language Query

```
POST   /api/v1/query                                Execute natural query
GET    /api/v1/query/history                        Get query history
GET    /api/v1/query/suggestions                    Get query suggestions
POST   /api/v1/query/feedback                       Submit query feedback
```

### Uploads

```
POST   /api/v1/upload/initiate                      Initiate upload
POST   /api/v1/upload/chunk                         Upload chunk
POST   /api/v1/upload/complete                      Complete upload
GET    /api/v1/upload/status/:id                    Get upload status
DELETE /api/v1/upload/:id                           Cancel upload
```

### Organizations

```
GET    /api/v1/organizations                        List organizations
POST   /api/v1/organizations                        Create organization
GET    /api/v1/organizations/:id                     Get organization details
PUT    /api/v1/organizations/:id                     Update organization
DELETE /api/v1/organizations/:id                     Delete organization
POST   /api/v1/organizations/:id/members            Add member
DELETE /api/v1/organizations/:id/members/:userId    Remove member
PUT    /api/v1/organizations/:id/members/:userId    Update member role
```

### Health & Monitoring

```
GET    /api/v1/health                               Health check
GET    /api/v1/health/db                            Database health
GET    /api/v1/health/cache                         Cache health
GET    /api/v1/metrics                              Application metrics
```

## Request/Response Format

### Standard Response Structure

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  timestamp: string;
}
```

### Pagination

```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

### Error Response

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    stack?: string; // Only in development
  };
  timestamp: string;
}
```

## Authentication Flow

```
1. Client authenticates with Firebase
2. Firebase returns ID token
3. Client sends ID token to backend
4. Backend verifies token with Firebase Admin SDK
5. Backend creates/updates user in database
6. Backend returns access token (JWT) and user data
7. Client includes access token in subsequent requests
```

## Rate Limiting Strategy

```
Authenticated users:
- General: 1000 requests/hour
- Query API: 100 requests/hour
- Upload API: 10 uploads/hour

Unauthenticated users:
- Public endpoints: 100 requests/hour
- Auth endpoints: 10 requests/minute

Rate limit headers:
- X-RateLimit-Limit
- X-RateLimit-Remaining
- X-RateLimit-Reset
```

## Caching Strategy

```
API Response Caching (Redis):
- Election list: 5 minutes
- Election details: 10 minutes
- Constituency data: 15 minutes
- Analytics data: 5 minutes
- Insights: 30 minutes
- Map data: 1 hour

Cache invalidation:
- On data updates
- On manual cache clear
- TTL expiration
```

## API Versioning Strategy

```
URL-based versioning: /api/v1/
- Backward compatibility maintained for 1 year
- Deprecation warnings in headers
- Migration guides provided

Version support:
- v1: Current (stable)
- v2: Beta (new features)
- Legacy: Deprecated (6 months notice)
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| AUTH_001 | 401 | Invalid or expired token |
| AUTH_002 | 403 | Insufficient permissions |
| AUTH_003 | 401 | User not found |
| VAL_001 | 400 | Validation error |
| VAL_002 | 400 | Invalid request format |
| REQ_001 | 404 | Resource not found |
| REQ_002 | 409 | Resource already exists |
| REQ_003 | 400 | Invalid request parameters |
| SRV_001 | 500 | Internal server error |
| SRV_002 | 503 | Service unavailable |
| SRV_003 | 504 | Gateway timeout |
| DB_001 | 500 | Database error |
| DB_002 | 409 | Database constraint violation |
| AI_001 | 429 | AI rate limit exceeded |
| AI_002 | 500 | AI service error |
| UPL_001 | 400 | Invalid file format |
| UPL_002 | 413 | File size exceeded |

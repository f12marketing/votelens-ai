# Monorepo Guide - VoteLens AI

## Naming Conventions

### File Naming

**Frontend (React + TypeScript):**
- Components: PascalCase (e.g., `ElectionCard.tsx`, `UserProfile.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useElections.ts`, `useAuth.ts`)
- Utilities: camelCase (e.g., `formatters.ts`, `validators.ts`)
- Types: camelCase (e.g., `election.ts`, `user.ts`)
- Pages: `page.tsx` (file-based routing in app directory)
- Styles: camelCase (e.g., `globals.css`, `components.css`)

**Backend (Node.js + TypeScript):**
- Controllers: `*.controller.ts` (e.g., `auth.controller.ts`)
- Services: `*.service.ts` (e.g., `elections.service.ts`)
- Repositories: `*.repository.ts` (e.g., `user.repository.ts`)
- Middleware: `*.middleware.ts` (e.g., `auth.middleware.ts`)
- Validators: `*.validator.ts` (e.g., `election.validator.ts`)
- DTOs: `*.dto.ts` (e.g., `election.dto.ts`)
- Jobs: `*.job.ts` (e.g., `data-processor.job.ts`)
- Utils: camelCase (e.g., `logger.ts`, `cache.ts`)

**Shared:**
- Types: camelCase (e.g., `election.ts`, `api.ts`)
- Constants: camelCase (e.g., `errors.ts`, `routes.ts`)
- Utils: camelCase (e.g., `formatters.ts`, `validators.ts`)

### Variable Naming

- Variables: camelCase (e.g., `electionId`, `userName`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`, `API_URL`)
- Classes/Interfaces: PascalCase (e.g., `ElectionService`, `ApiResponse`)
- Enums: PascalCase (e.g., `ElectionType`, `Role`)
- Functions: camelCase (e.g., `getElectionById`, `validateInput`)

### Import Strategy

**Path Aliases:**
```typescript
// Frontend
import { useElections } from '@/hooks/useElections';
import { ElectionCard } from '@/components/elections/ElectionCard';
import { formatNumber } from '@/lib/utils/formatters';

// Backend
import { ElectionService } from '@/services/elections.service';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

// Shared types
import { Election, ElectionType } from '@votelens/shared';
import { ERROR_CODES } from '@votelens/shared/constants';
```

**Import Order:**
1. React/Node.js built-ins
2. Third-party libraries
3. Internal modules (absolute paths)
4. Relative imports (sibling files)
5. Types (if separate)

## Reusable Component Strategy

### Frontend Components

**Component Structure:**
```
components/
├── ui/                    # shadcn/ui primitives (base components)
├── layout/                # Layout components (Header, Sidebar, Footer)
├── dashboard/             # Dashboard-specific components
├── elections/             # Elections feature components
├── analytics/             # Analytics feature components
└── common/                # Shared/common components
```

**Component Principles:**
1. **Single Responsibility**: Each component should have one clear purpose
2. **Composition over Inheritance**: Use composition to build complex UIs
3. **Props Interface**: Define clear TypeScript interfaces for props
4. **Default Props**: Provide sensible defaults where appropriate
5. **Controlled vs Uncontrolled**: Prefer controlled components

**Example:**
```typescript
// components/elections/ElectionCard.tsx
interface ElectionCardProps {
  election: Election;
  onSelect?: (id: string) => void;
  showActions?: boolean;
}

export function ElectionCard({ election, onSelect, showActions = true }: ElectionCardProps) {
  return (
    <Card onClick={() => onSelect?.(election.id)}>
      <CardHeader>
        <CardTitle>{election.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{election.description}</p>
      </CardContent>
      {showActions && (
        <CardFooter>
          <Button onClick={() => onSelect?.(election.id)}>View Details</Button>
        </CardFooter>
      )}
    </Card>
  );
}
```

### Backend Services

**Service Layer Pattern:**
```typescript
// services/elections.service.ts
class ElectionService {
  constructor(
    private electionRepository: ElectionRepository,
    private cacheService: CacheService
  ) {}

  async getElection(id: string): Promise<Election> {
    // Check cache first
    const cached = await this.cacheService.get(`election:${id}`);
    if (cached) return JSON.parse(cached);

    // Fetch from repository
    const election = await this.electionRepository.findById(id);
    if (!election) throw new NotFoundError('Election');

    // Cache the result
    await this.cacheService.set(`election:${id}`, JSON.stringify(election), '10m');
    
    return election;
  }
}
```

## Service Layer Strategy

### Backend Service Layer

**Three-Layer Architecture:**
```
Controllers (API Layer)
    ↓
Services (Business Logic Layer)
    ↓
Repositories (Data Access Layer)
```

**Controller:**
- Handles HTTP requests/responses
- Validates input
- Calls services
- Returns formatted responses

**Service:**
- Contains business logic
- Coordinates between repositories
- Handles caching
- Manages transactions

**Repository:**
- Direct database access
- Uses Prisma ORM
- Returns domain entities
- Handles data transformations

### Frontend Service Layer

**API Client Pattern:**
```typescript
// lib/api/client.ts
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
});

// lib/api/elections.ts
export const electionsApi = {
  list: (params) => apiClient.get('/elections', { params }),
  get: (id) => apiClient.get(`/elections/${id}`),
  create: (data) => apiClient.post('/elections', data),
  update: (id, data) => apiClient.put(`/elections/${id}`, data),
  delete: (id) => apiClient.delete(`/elections/${id}`),
};
```

**Custom Hooks Pattern:**
```typescript
// hooks/useElections.ts
export function useElections(filters?: ElectionFilters) {
  return useQuery({
    queryKey: ['elections', filters],
    queryFn: () => electionsApi.list(filters),
  });
}

export function useCreateElection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: electionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elections'] });
    },
  });
}
```

## API Layer Strategy

### RESTful API Design

**Resource Naming:**
- Use plural nouns for collections: `/elections`, `/users`
- Use kebab-case for multi-word resources: `/constituencies`, `/query-history`

**HTTP Methods:**
- `GET` - Retrieve resources
- `POST` - Create resources
- `PUT` - Update entire resources
- `PATCH` - Partial updates
- `DELETE` - Remove resources

**Response Format:**
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
  timestamp: string;
}
```

### API Versioning

**URL-based versioning:**
- `/api/v1/elections` (current stable version)
- `/api/v2/elections` (beta/new features)

**Backward Compatibility:**
- Maintain v1 for 1 year after v2 release
- Provide migration guides
- Add deprecation warnings to headers

## Clean Architecture Principles

### Separation of Concerns

**Frontend:**
- **Components**: UI only, no business logic
- **Hooks**: Business logic and state management
- **Services**: API communication
- **Store**: Global state management
- **Utils**: Pure functions, no side effects

**Backend:**
- **Controllers**: HTTP handling only
- **Services**: Business logic
- **Repositories**: Data access
- **Middleware**: Cross-cutting concerns
- **Utils**: Helper functions

### Dependency Injection

**Backend Example:**
```typescript
class ElectionController {
  constructor(private electionService: ElectionService) {}

  async getElection(req: Request, res: Response) {
    const election = await this.electionService.getElection(req.params.id);
    res.json({ success: true, data: election });
  }
}
```

### Dependency Rule

**Dependency Direction:**
- Controllers depend on Services
- Services depend on Repositories
- Repositories depend on Database/ORM
- No circular dependencies

## Monorepo Best Practices

### Workspace Management

**Package.json Workspaces:**
```json
{
  "workspaces": [
    "frontend",
    "backend",
    "shared"
  ]
}
```

**Shared Dependencies:**
- Common dependencies in root package.json
- Package-specific dependencies in respective package.json
- Use `workspace:*` protocol for internal dependencies

### Build Order

**Build Sequence:**
1. Build shared package first (dependencies)
2. Build backend (depends on shared)
3. Build frontend (depends on shared)

**Turbo (Optional):**
```json
{
  "pipeline": {
    "build": {
      "outputs": ["dist/**"]
    }
  }
}
```

## Testing Strategy

### Frontend Testing

**Unit Tests:**
- Components: Test rendering and user interactions
- Hooks: Test logic and state changes
- Utils: Test pure functions

**Integration Tests:**
- Component integration with hooks
- API client with mocked responses

### Backend Testing

**Unit Tests:**
- Services: Test business logic in isolation
- Repositories: Test data access with in-memory DB
- Utils: Test helper functions

**Integration Tests:**
- Controllers with mocked services
- API endpoints with test database

**E2E Tests:**
- Full request/response cycle
- Database transactions

## Code Organization

### Feature-Based Structure

**Frontend:**
```
src/features/
├── elections/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── types/
└── analytics/
    ├── components/
    ├── hooks/
    ├── services/
    └── types/
```

**Backend:**
```
src/features/
├── elections/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   └── validators/
└── analytics/
    ├── controllers/
    ├── services/
    └── repositories/
```

## Performance Optimization

### Frontend

- **Code Splitting**: Lazy load routes and components
- **Tree Shaking**: Remove unused code
- **Memoization**: React.memo, useMemo, useCallback
- **Virtual Scrolling**: For large lists
- **Image Optimization**: WebP format, lazy loading

### Backend

- **Database Indexing**: Optimize queries
- **Caching**: Redis for frequently accessed data
- **Connection Pooling**: Reuse database connections
- **Query Optimization**: Use selects, avoid N+1 queries
- **Compression**: Gzip responses

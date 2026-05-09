# Backend Architecture

## Technology Stack

- **Runtime**: Node.js 20+ LTS
- **Framework**: Express 4.18+
- **ORM**: Prisma 5+ (type-safe ORM)
- **Database**: PostgreSQL 15+ (Railway managed)
- **Authentication**: Firebase Admin SDK
- **AI/ML**: Google Gemini API (vertex-ai)
- **File Storage**: Cloudflare R2 / AWS S3
- **Caching**: Redis 7+ (Railway managed)
- **Queue**: BullMQ 5+ (Redis-backed)
- **Logging**: Winston 3+ + Pino
- **Validation**: Zod 3+
- **Testing**: Jest 29+ + Supertest
- **Documentation**: Swagger/OpenAPI 3.0

## Application Structure

```
backend/
├── src/
│   ├── app/
│   │   ├── app.ts                   # Express app setup
│   │   ├── server.ts                # Server entry point
│   │   └── routes.ts                # Route aggregation
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── elections.controller.ts
│   │   ├── constituencies.controller.ts
│   │   ├── analytics.controller.ts
│   │   ├── insights.controller.ts
│   │   ├── maps.controller.ts
│   │   ├── query.controller.ts
│   │   └── uploads.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── elections.service.ts
│   │   ├── constituencies.service.ts
│   │   ├── analytics.service.ts
│   │   ├── insights.service.ts
│   │   ├── maps.service.ts
│   │   ├── query.service.ts
│   │   ├── upload.service.ts
│   │   ├── ai.service.ts            # Gemini integration
│   │   ├── cache.service.ts
│   │   └── queue.service.ts
│   ├── repositories/
│   │   ├── base.repository.ts
│   │   ├── election.repository.ts
│   │   ├── constituency.repository.ts
│   │   ├── result.repository.ts
│   │   ├── insight.repository.ts
│   │   └── user.repository.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts        # Firebase token verification
│   │   ├── rbac.middleware.ts       # Role-based access control
│   │   ├── validation.middleware.ts
│   │   ├── rate-limit.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── logger.middleware.ts
│   ├── validators/
│   │   ├── election.validator.ts
│   │   ├── constituency.validator.ts
│   │   └── query.validator.ts
│   ├── dto/
│   │   ├── election.dto.ts
│   │   ├── constituency.dto.ts
│   │   └── query.dto.ts
│   ├── models/prisma/
│   │   └── schema.prisma            # Database schema
│   ├── jobs/
│   │   ├── data-processor.job.ts
│   │   ├── insight-generator.job.ts
│   │   ├── cache-warmer.job.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── cache.ts                 # Redis client
│   │   ├── queue.ts                 # BullMQ setup
│   │   ├── storage.ts               # S3/R2 client
│   │   └── ai-client.ts             # Gemini client
│   ├── config/
│   │   ├── index.ts
│   │   ├── database.ts
│   │   ├── firebase.ts
│   │   ├── gemini.ts
│   │   └── storage.ts
│   ├── types/
│   │   ├── express.d.ts             # Extended Express types
│   │   └── index.ts
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── e2e/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── logs/
├── uploads/
├── .env.example
├── .env
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── jest.config.js
```

## Layered Architecture

```
┌─────────────────────────────────────┐
│         API Layer (Controllers)     │
├─────────────────────────────────────┤
│       Business Logic (Services)     │
├─────────────────────────────────────┤
│         Data Access (Repositories)   │
├─────────────────────────────────────┤
│         Database (PostgreSQL)        │
└─────────────────────────────────────┘
```

## Request Flow

```
Request → Middleware Stack → Controller → Service → Repository → Database
                ↓                                      ↓
            Validation                           Cache Layer
                ↓                                      ↓
            Authentication                         Queue
```

## Application Setup

```typescript
// src/app/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { routes } from './routes';
import { errorHandler } from '../middleware/error.middleware';
import { loggerMiddleware } from '../middleware/logger.middleware';

export function createApp(): express.Express {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Compression
  app.use(compression());

  // Logging
  app.use(loggerMiddleware);

  // Routes
  app.use('/api/v1', routes);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Error handling
  app.use(errorHandler);

  return app;
}
```

## Server Configuration

```typescript
// src/app/server.ts
import { createApp } from './app';
import logger from '../utils/logger';

const PORT = process.env.PORT || 3000;

const app = createApp();

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});
```

## Controller Architecture

```typescript
// src/controllers/elections.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ElectionService } from '../services/elections.service';
import { AuthRequest } from '../types/express.d';

export class ElectionsController {
  constructor(private electionService: ElectionService) {}

  async listElections(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 50, status, type } = req.query;
      const elections = await this.electionService.listElections({
        page: Number(page),
        limit: Number(limit),
        status: status as string,
        type: type as string,
      });
      res.json({ success: true, data: elections });
    } catch (error) {
      next(error);
    }
  }

  async getElection(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const election = await this.electionService.getElection(id);
      res.json({ success: true, data: election });
    } catch (error) {
      next(error);
    }
  }

  async createElection(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const election = await this.electionService.createElection(
        req.body,
        req.user!.id
      );
      res.status(201).json({ success: true, data: election });
    } catch (error) {
      next(error);
    }
  }

  async updateElection(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const election = await this.electionService.updateElection(
        id,
        req.body,
        req.user!.id
      );
      res.json({ success: true, data: election });
    } catch (error) {
      next(error);
    }
  }

  async deleteElection(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.electionService.deleteElection(id, req.user!.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
```

## Service Architecture

```typescript
// src/services/elections.service.ts
import { ElectionRepository } from '../repositories/election.repository';
import { CacheService } from './cache.service';
import { AppError } from '../utils/errors';

export class ElectionService {
  constructor(
    private electionRepository: ElectionRepository,
    private cacheService: CacheService
  ) {}

  async listElections(filters: ElectionFilters) {
    const cacheKey = `elections:list:${JSON.stringify(filters)}`;
    const cached = await this.cacheService.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const elections = await this.electionRepository.list(filters);
    await this.cacheService.set(cacheKey, JSON.stringify(elections), '5m');
    
    return elections;
  }

  async getElection(id: string) {
    const cacheKey = `election:${id}`;
    const cached = await this.cacheService.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const election = await this.electionRepository.findById(id);
    
    if (!election) {
      throw new AppError('Election not found', 404, 'NOT_FOUND');
    }

    await this.cacheService.set(cacheKey, JSON.stringify(election), '10m');
    
    return election;
  }

  async createElection(data: CreateElectionDto, userId: string) {
    const election = await this.electionRepository.create({
      ...data,
      createdBy: userId,
    });
    
    // Invalidate cache
    await this.cacheService.delPattern('elections:list:*');
    
    return election;
  }

  async updateElection(id: string, data: UpdateElectionDto, userId: string) {
    const election = await this.electionRepository.findById(id);
    
    if (!election) {
      throw new AppError('Election not found', 404, 'NOT_FOUND');
    }

    if (election.createdBy !== userId) {
      throw new AppError('Unauthorized', 403, 'FORBIDDEN');
    }

    const updated = await this.electionRepository.update(id, data);
    
    // Invalidate cache
    await this.cacheService.del(`election:${id}`);
    await this.cacheService.delPattern('elections:list:*');
    
    return updated;
  }

  async deleteElection(id: string, userId: string) {
    const election = await this.electionRepository.findById(id);
    
    if (!election) {
      throw new AppError('Election not found', 404, 'NOT_FOUND');
    }

    if (election.createdBy !== userId) {
      throw new AppError('Unauthorized', 403, 'FORBIDDEN');
    }

    await this.electionRepository.delete(id);
    
    // Invalidate cache
    await this.cacheService.del(`election:${id}`);
    await this.cacheService.delPattern('elections:list:*');
  }
}
```

## Repository Pattern

```typescript
// src/repositories/base.repository.ts
import { PrismaClient } from '@prisma/client';

export abstract class BaseRepository<T> {
  constructor(protected prisma: PrismaClient) {}

  async findById(id: string): Promise<T | null> {
    return this.prisma[this.modelName].findUnique({
      where: { id },
    }) as Promise<T | null>;
  }

  async findMany(filters?: any): Promise<T[]> {
    return this.prisma[this.modelName].findMany({
      where: filters,
    }) as Promise<T[]>;
  }

  async create(data: any): Promise<T> {
    return this.prisma[this.modelName].create({
      data,
    }) as Promise<T>;
  }

  async update(id: string, data: any): Promise<T> {
    return this.prisma[this.modelName].update({
      where: { id },
      data,
    }) as Promise<T>;
  }

  async delete(id: string): Promise<T> {
    return this.prisma[this.modelName].delete({
      where: { id },
    }) as Promise<T>;
  }

  protected abstract get modelName(): string;
}

// src/repositories/election.repository.ts
import { BaseRepository } from './base.repository';
import { Election } from '@prisma/client';

export class ElectionRepository extends BaseRepository<Election> {
  protected get modelName(): string {
    return 'election';
  }

  async list(filters: ElectionFilters) {
    const { page = 1, limit = 50, status, type } = filters;
    
    return this.prisma.election.findMany({
      where: {
        ...(status && { status }),
        ...(type && { electionType: type }),
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCreator(userId: string) {
    return this.prisma.election.findMany({
      where: { createdBy: userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

## Middleware Stack

```typescript
// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthenticationError } from '../utils/errors';

export interface AuthRequest extends Request {
  user?: any;
}

export function authMiddleware(authService: AuthService) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader?.startsWith('Bearer ')) {
        throw new AuthenticationError('No token provided');
      }
      
      const token = authHeader.substring(7);
      const user = await authService.verifyAccessToken(token);
      
      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
}

// src/middleware/rbac.middleware.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { AuthorizationError } from '../utils/errors';
import { Role } from '@prisma/client';

export function rbacMiddleware(allowedRoles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AuthorizationError('User not authenticated');
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      throw new AuthorizationError('Insufficient permissions');
    }
    
    next();
  };
}

// src/middleware/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      throw new ValidationError('Invalid request body', error.errors);
    }
  };
}

// src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { AppError } from '../utils/errors';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.details : undefined,
      },
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
      timestamp: new Date().toISOString(),
    });
  }
}
```

## Background Jobs

```typescript
// src/jobs/data-processor.job.ts
import { Queue, Job } from 'bullmq';
import { ElectionService } from '../services/elections.service';
import { AnalyticsService } from '../services/analytics.service';

export class DataProcessorJob {
  constructor(
    private queue: Queue,
    private electionService: ElectionService,
    private analyticsService: AnalyticsService
  ) {
    this.queue.process('data-processor', this.process.bind(this));
  }

  async process(job: Job) {
    const { electionId } = job.data;
    
    try {
      // Update status
      await this.electionService.updateStatus(electionId, 'PROCESSING');
      
      // Process data
      await this.analyticsService.processElectionData(electionId);
      
      // Update status
      await this.electionService.updateStatus(electionId, 'READY');
      
      // Trigger insight generation
      await this.queue.add('insight-generator', { electionId });
      
      return { success: true };
    } catch (error) {
      await this.electionService.updateStatus(electionId, 'FAILED');
      throw error;
    }
  }
}
```

## Configuration Management

```typescript
// src/config/index.ts
export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL!,
  },
  
  redis: {
    url: process.env.REDIS_URL!,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: '1h',
  },
  
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID!,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
  },
  
  gemini: {
    project: process.env.GOOGLE_CLOUD_PROJECT!,
    location: process.env.GOOGLE_CLOUD_LOCATION!,
    model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
  },
  
  storage: {
    accountId: process.env.R2_ACCOUNT_ID!,
    accessKey: process.env.R2_ACCESS_KEY!,
    secretKey: process.env.R2_SECRET_KEY!,
    bucket: process.env.R2_BUCKET!,
  },
};
```

## Utility Services

```typescript
// src/utils/cache.ts
import { Redis } from 'ioredis';

export class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: string): Promise<void> {
    if (ttl) {
      await this.redis.setex(key, this.parseTTL(ttl), value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  private parseTTL(ttl: string): number {
    const units: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    const match = ttl.match(/^(\d+)([smhd])$/);
    if (!match) return 3600;
    return parseInt(match[1]) * units[match[2]];
  }
}

// src/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'votelens-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export default logger;
```

## Error Handling

```typescript
// src/utils/errors.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTH_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Authorization failed') {
    super(message, 403, 'AUTHZ_ERROR');
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public errors: any[]) {
    super(message, 400, 'VALIDATION_ERROR', errors);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}
```

## Testing Strategy

```typescript
// Unit test example
import { ElectionService } from '../services/elections.service';
import { ElectionRepository } from '../repositories/election.repository';
import { CacheService } from '../services/cache.service';

describe('ElectionService', () => {
  let service: ElectionService;
  let mockRepository: jest.Mocked<ElectionRepository>;
  let mockCache: jest.Mocked<CacheService>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;
    
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    } as any;
    
    service = new ElectionService(mockRepository, mockCache);
  });

  describe('getElection', () => {
    it('should return cached election if available', async () => {
      const cachedElection = { id: '1', name: 'Test' };
      mockCache.get.mockResolvedValue(JSON.stringify(cachedElection));
      
      const result = await service.getElection('1');
      
      expect(result).toEqual(cachedElection);
      expect(mockCache.get).toHaveBeenCalledWith('election:1');
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('should fetch from repository if not cached', async () => {
      const election = { id: '1', name: 'Test' };
      mockCache.get.mockResolvedValue(null);
      mockRepository.findById.mockResolvedValue(election);
      
      const result = await service.getElection('1');
      
      expect(result).toEqual(election);
      expect(mockRepository.findById).toHaveBeenCalledWith('1');
      expect(mockCache.set).toHaveBeenCalledWith(
        'election:1',
        JSON.stringify(election),
        '10m'
      );
    });
  });
});

// Integration test example
import request from 'supertest';
import { createApp } from '../app';

describe('Elections API', () => {
  let app: express.Express;

  beforeAll(() => {
    app = createApp();
  });

  describe('GET /api/v1/elections', () => {
    it('should return list of elections', async () => {
      const response = await request(app)
        .get('/api/v1/elections')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });
});
```

## Package.json Configuration

```json
{
  "name": "votelens-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/app/server.ts",
    "build": "tsc",
    "start": "node dist/app/server.js",
    "start:prod": "node dist/app/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "compression": "^1.7.4",
    "ioredis": "^5.3.0",
    "bullmq": "^5.0.0",
    "winston": "^3.10.0",
    "zod": "^3.22.0",
    "firebase-admin": "^11.0.0",
    "@google-cloud/vertexai": "^1.0.0",
    "aws-sdk": "^2.1400.0",
    "dotenv": "^16.3.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/node": "^20.0.0",
    "@types/cors": "^2.8.0",
    "@types/compression": "^1.7.0",
    "@types/jest": "^29.5.0",
    "@types/supertest": "^2.0.0",
    "typescript": "^5.0.0",
    "ts-node-dev": "^2.0.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "supertest": "^6.3.0",
    "eslint": "^8.50.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "prisma": "^5.0.0"
  }
}
```

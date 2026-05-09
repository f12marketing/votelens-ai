# Database Architecture

## Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User Management
model User {
  id                String    @id @default(cuid())
  firebaseUid       String    @unique
  email             String    @unique
  displayName       String?
  photoURL          String?
  role              Role      @default(USER)
  organizationId    String?
  organization      Organization? @relation(fields: [organizationId], references: [id])
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  lastLoginAt       DateTime?
  isActive          Boolean   @default(true)
  
  createdElections  Election[] @relation("CreatedBy")
  apiKeys           ApiKey[]
  auditLogs         AuditLog[]
  queryHistory      QueryHistory[]
  
  @@index([firebaseUid])
  @@index([email])
  @@index([organizationId])
}

model Organization {
  id            String    @id @default(cuid())
  name          String
  slug          String    @unique
  logo          String?
  plan          Plan      @default(FREE)
  maxUsers      Int       @default(5)
  maxElections  Int       @default(3)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  users         User[]
  elections     Election[]
  apiKeys       ApiKey[]
  
  @@index([slug])
}

model ApiKey {
  id             String    @id @default(cuid())
  name           String
  key            String    @unique
  userId         String
  user           User      @relation(fields: [userId], references: [id])
  organizationId String?
  organization   Organization? @relation(fields: [organizationId], references: [id])
  scopes         String[]
  lastUsedAt     DateTime?
  expiresAt      DateTime?
  createdAt      DateTime  @default(now())
  
  @@index([key])
  @@index([userId])
}

// Election Data
model Election {
  id              String    @id @default(cuid())
  name            String
  description     String?
  electionType    ElectionType
  date            DateTime
  status          ElectionStatus @default(DRAFT)
  country         String
  region          String?
  totalSeats      Int
  totalVoters     Int?
  turnout         Float?
  createdBy       String
  creator         User      @relation("CreatedBy", fields: [createdBy], references: [id])
  organizationId  String?
  organization    Organization? @relation(fields: [organizationId], references: [id])
  datasetUrl      String?
  datasetSize     Int?
  processedAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  constituencies  Constituency[]
  results         Result[]
  insights        Insight[]
  datasets        Dataset[]
  auditLogs       AuditLog[]
  
  @@index([status])
  @@index([date])
  @@index([country])
  @@index([organizationId])
}

model Constituency {
  id              String    @id @default(cuid())
  name            String
  code            String    @unique
  electionId      String
  election        Election  @relation(fields: [electionId], references: [id], onDelete: Cascade)
  type            ConstituencyType
  state           String?
  district        String?
  totalVoters     Int?
  totalSeats      Int?
  geoJson         Json?
  demographics    Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  results         Result[]
  
  @@unique([electionId, code])
  @@index([electionId])
  @@index([state])
}

model Candidate {
  id              String    @id @default(cuid())
  name            String
  party           String?
  symbol          String?
  color           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  results         Result[]
  
  @@index([party])
}

model Result {
  id                String    @id @default(cuid())
  electionId        String
  election          Election  @relation(fields: [electionId], references: [id], onDelete: Cascade)
  constituencyId    String
  constituency      Constituency @relation(fields: [constituencyId], references: [id], onDelete: Cascade)
  candidateId       String
  candidate         Candidate  @relation(fields: [candidateId], references: [id])
  votes             Int
  percentage        Float
  isWinner          Boolean   @default(false)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@unique([electionId, constituencyId, candidateId])
  @@index([electionId])
  @@index([constituencyId])
  @@index([candidateId])
}

// AI Insights
model Insight {
  id              String    @id @default(cuid())
  electionId      String
  election        Election  @relation(fields: [electionId], references: [id], onDelete: Cascade)
  type            InsightType
  title           String
  content         String
  confidence      Float?
  metadata        Json?
  status          InsightStatus @default(PENDING)
  approvedBy      String?
  approvedAt      DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([electionId])
  @@index([type])
  @@index([status])
}

// Data Management
model Dataset {
  id              String    @id @default(cuid())
  electionId      String
  election        Election  @relation(fields: [electionId], references: [id], onDelete: Cascade)
  name            String
  type            DatasetType
  url             String
  size            Int
  format          String
  status          DatasetStatus @default(UPLOADING)
  rowsProcessed   Int?
  error           String?
  uploadedAt      DateTime  @default(now())
  processedAt     DateTime?
  
  @@index([electionId])
  @@index([status])
}

// Query & Analytics
model QueryHistory {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  query           String
  response        Json?
  executionTime   Int?
  success         Boolean   @default(true)
  createdAt       DateTime  @default(now())
  
  @@index([userId])
  @@index([createdAt])
}

model AuditLog {
  id              String    @id @default(cuid())
  userId          String?
  user            User?     @relation(fields: [userId], references: [id])
  electionId      String?
  election        Election? @relation(fields: [electionId], references: [id])
  action          String
  resource        String
  resourceId      String?
  changes         Json?
  ipAddress       String?
  userAgent       String?
  createdAt       DateTime  @default(now())
  
  @@index([userId])
  @@index([electionId])
  @@index([action])
  @@index([createdAt])
}

// Enums
enum Role {
  USER
  ADMIN
  SUPER_ADMIN
}

enum Plan {
  FREE
  PRO
  ENTERPRISE
}

enum ElectionType {
  GENERAL
  STATE
  LOCAL
  BY_ELECTION
  REFERENDUM
}

enum ElectionStatus {
  DRAFT
  PROCESSING
  READY
  COMPLETED
  ARCHIVED
}

enum ConstituencyType {
  PARLIAMENTARY
  ASSEMBLY
  MUNICIPAL
  COUNCIL
}

enum InsightType {
  TREND
  PREDICTION
  ANOMALY
  COMPARISON
  DEMOGRAPHIC
  GEOGRAPHIC
}

enum InsightStatus {
  PENDING
  APPROVED
  REJECTED
}

enum DatasetType {
  RESULTS
  VOTERS
  DEMOGRAPHICS
  GEOGRAPHIC
  HISTORICAL
}

enum DatasetStatus {
  UPLOADING
  PROCESSING
  COMPLETED
  FAILED
}
```

## Database Indexing Strategy

```sql
-- Primary indexes (automatic)
-- All @id fields have primary indexes

-- Secondary indexes
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization ON users(organization_id);

CREATE INDEX idx_elections_status ON elections(status);
CREATE INDEX idx_elections_date ON elections(date);
CREATE INDEX idx_elections_country ON elections(country);

CREATE INDEX idx_constituencies_election ON constituencies(election_id);
CREATE INDEX idx_constituencies_state ON constituencies(state);

CREATE INDEX idx_results_election ON results(election_id);
CREATE INDEX idx_results_constituency ON results(constituency_id);
CREATE INDEX idx_results_candidate ON results(candidate_id);

CREATE INDEX idx_insights_election ON insights(election_id);
CREATE INDEX idx_insights_type ON insights(type);
CREATE INDEX idx_insights_status ON insights(status);

CREATE INDEX idx_query_history_user ON query_history(user_id);
CREATE INDEX idx_query_history_created ON query_history(created_at);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_election ON audit_log(election_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- Composite indexes for common queries
CREATE INDEX idx_results_election_constituency ON results(election_id, constituency_id);
CREATE INDEX idx_results_election_candidate ON results(election_id, candidate_id);
```

## Database Connection Pooling

```typescript
// src/config/database.ts
export const databaseConfig = {
  url: process.env.DATABASE_URL,
  pool: {
    min: 2,
    max: 20,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createTimeoutMillis: 5000,
  },
};
```

## Database Backup Strategy

```
Backup Schedule:
- Daily full backups at 2 AM UTC
- Hourly incremental backups
- Point-in-time recovery (7-day window)

Backup Storage:
- Primary: Railway managed backups
- Secondary: Cloudflare R2 (cross-region)

Backup Retention:
- Daily backups: 30 days
- Weekly backups: 12 weeks
- Monthly backups: 12 months
```

## Database Migration Strategy

```bash
# Development
npx prisma migrate dev --name migration_name

# Production
npx prisma migrate deploy

# Rollback (manual)
# 1. Create rollback migration
# 2. Deploy rollback
```

## Database Performance Optimization

### Query Optimization

```typescript
// Use select for partial queries
const election = await prisma.election.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    status: true,
  },
});

// Use include for relations efficiently
const electionWithResults = await prisma.election.findUnique({
  where: { id },
  include: {
    constituencies: {
      include: {
        results: true,
      },
    },
  },
});
```

### Connection Management

```typescript
// Singleton pattern for Prisma Client
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

## Database Monitoring

```typescript
// Query logging
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  
  logger.info(`Query: ${params.model}.${params.action}`, {
    duration: after - before,
    params,
  });
  
  return result;
});
```

## Database Security

### Row-Level Security

```typescript
// Implement application-level RLS
async function getUserAccessibleElections(userId: string, userRole: Role) {
  if (userRole === Role.SUPER_ADMIN) {
    return prisma.election.findMany();
  }
  
  return prisma.election.findMany({
    where: {
      OR: [
        { createdBy: userId },
        { organization: { users: { some: { id: userId } } } },
      ],
    },
  });
}
```

### Data Encryption

```typescript
// Encrypt sensitive data at rest
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, encryptedData] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

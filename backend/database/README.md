# VoteLens AI - Database Setup Guide

This directory contains the PostgreSQL database schema, migrations, and documentation for VoteLens AI.

## Quick Start

### 1. Prerequisites

- PostgreSQL 14+ installed
- Node.js 18+ (for backend integration)
- psql command-line tool

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE votelens;

# Exit
\q
```

### 3. Run Migrations

Run migrations in order:

```bash
# Migration 001: Initial Schema
psql -U postgres -d votelens -f migrations/001_initial_schema.sql

# Migration 002: Add Indexes
psql -U postgres -d votelens -f migrations/002_add_indexes.sql

# Migration 003: Add Triggers
psql -U postgres -d votelens -f migrations/003_add_triggers.sql

# Migration 004: Add Materialized Views
psql -U postgres -d votelens -f migrations/004_add_materialized_views.sql
```

### 4. Alternative: Run Complete Schema

To run everything at once:

```bash
psql -U postgres -d votelens -f schema.sql
```

## File Structure

```
database/
├── schema.sql                      # Complete schema (tables, indexes, triggers, views)
├── migrations/
│   ├── 001_initial_schema.sql      # Table creation
│   ├── 002_add_indexes.sql         # Performance indexes
│   ├── 003_add_triggers.sql        # Timestamp triggers
│   └── 004_add_materialized_views.sql  # Analytics views
├── er-diagram.md                   # Entity relationship diagram
├── optimization-strategy.md         # Performance optimization guide
└── README.md                       # This file
```

## Schema Overview

### Core Tables

1. **users** - User accounts with Firebase authentication
2. **elections** - Election events with year, date, status
3. **constituencies** - Geographic constituencies with voter counts
4. **election_constituencies** - Junction table (many-to-many)
5. **candidates** - Candidates running in elections
6. **results** - Election results with historical versioning
7. **datasets** - Uploaded election datasets
8. **ai_insights** - AI-generated insights
9. **reports** - User-generated reports
10. **user_queries** - Natural language query history

### Key Features

- **Historical Versioning**: Results table tracks changes over time
- **Soft Deletes**: Users, elections, constituencies, candidates have deleted_at
- **Flexible Metadata**: JSONB columns for datasets, insights, reports
- **Analytics Optimization**: Materialized views for fast dashboard queries
- **Comprehensive Indexing**: 40+ indexes for performance

## Materialized Views

### Refresh Strategy

Materialized views need to be refreshed when data changes:

```sql
-- Refresh election summary
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_election_summary;

-- Refresh constituency performance
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_constituency_performance;
```

### When to Refresh

- After importing new election data
- After updating results
- After adding new constituencies
- Before generating reports

## Environment Variables

Add to your `.env` file:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/votelens
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=votelens
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
```

## Prisma Integration

If using Prisma ORM:

```bash
# Generate Prisma client from schema
npx prisma generate

# Run migrations via Prisma
npx prisma migrate dev --name init
```

## Testing the Schema

### Sample Data Insert

```sql
-- Insert a user
INSERT INTO users (firebase_uid, email, name, role) 
VALUES ('test-uid-123', 'test@example.com', 'Test User', 'user');

-- Insert an election
INSERT INTO elections (name, year, election_date, status, region)
VALUES ('General Election 2026', 2026, '2026-06-01', 'upcoming', 'National');

-- Insert a constituency
INSERT INTO constituencies (name, state, voter_count)
VALUES ('North District', 'Northern Region', 50000);

-- Link election to constituency
INSERT INTO election_constituencies (election_id, constituency_id)
SELECT id FROM elections WHERE name = 'General Election 2026'
UNION ALL
SELECT id FROM constituencies WHERE name = 'North District';
```

### Verify Installation

```sql
-- List all tables
\dt

-- Check indexes
\di

-- View materialized views
\dm

-- Check triggers
\ds
```

## Performance Monitoring

### Check Query Performance

```sql
-- Enable query logging
ALTER DATABASE votelens SET log_min_duration_statement = 1000;

-- View slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### Check Table Sizes

```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Backup & Restore

### Backup

```bash
pg_dump -h localhost -U postgres -d votelens -F c -f votelens_backup.dump
```

### Restore

```bash
pg_restore -h localhost -U postgres -d votelens_restored votelens_backup.dump
```

## Troubleshooting

### Migration Errors

If a migration fails, check:
1. PostgreSQL version compatibility (14+ required)
2. UUID extension is enabled: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
3. Run migrations in order (001, 002, 003, 004)

### Permission Errors

Ensure the database user has necessary permissions:

```sql
GRANT ALL PRIVILEGES ON DATABASE votelens TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
```

### Connection Issues

Verify PostgreSQL is running:

```bash
# Windows
net start postgresql-x64-14

# Check connection
psql -U postgres -d votelens -c "SELECT version();"
```

## Next Steps

1. Configure environment variables
2. Set up connection pooling (PgBouncer) for production
3. Configure Redis for caching
4. Set up automated backups
5. Implement monitoring and alerting

## Documentation

- **ER Diagram**: See `er-diagram.md` for table relationships
- **Optimization Strategy**: See `optimization-strategy.md` for performance tuning

## Support

For issues or questions:
1. Check the optimization strategy guide
2. Review PostgreSQL documentation
3. Check migration logs for specific errors

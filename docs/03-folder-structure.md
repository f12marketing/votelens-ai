# Folder Structure

## Complete Monorepo Structure

```
votelens-ai/
├── frontend/                          # React + Vite frontend
│   ├── src/
│   │   ├── app/                      # App layout and routing
│   │   ├── components/               # React components
│   │   ├── lib/                      # Utilities and hooks
│   │   ├── types/                    # TypeScript types
│   │   ├── styles/                   # Global styles
│   │   └── main.tsx                  # Entry point
│   ├── public/                       # Static assets
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                           # Node.js + Express backend
│   ├── src/
│   │   ├── app/                      # Express app setup
│   │   ├── controllers/              # Route handlers
│   │   ├── services/                 # Business logic
│   │   ├── repositories/             # Data access layer
│   │   ├── middleware/               # Express middleware
│   │   ├── validators/               # Request validation
│   │   ├── dto/                      # Data transfer objects
│   │   ├── models/prisma/            # Prisma schema
│   │   ├── jobs/                     # Background jobs
│   │   ├── utils/                    # Utility functions
│   │   ├── config/                   # Configuration
│   │   ├── types/                    # TypeScript types
│   │   └── tests/                    # Test files
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── logs/
│   ├── uploads/
│   ├── .env.example
│   ├── .env
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                            # Shared types and utilities
│   ├── types/
│   │   ├── election.ts
│   │   ├── constituency.ts
│   │   └── api.ts
│   ├── constants/
│   │   └── errors.ts
│   └── package.json
│
├── docs/                              # Documentation
│   ├── 01-frontend-architecture.md
│   ├── 02-backend-architecture.md
│   ├── 03-folder-structure.md
│   ├── 04-api-architecture.md
│   ├── 05-database-architecture.md
│   ├── 06-authentication-architecture.md
│   ├── 07-ai-architecture.md
│   ├── 08-deployment-architecture.md
│   ├── 09-scalability-strategy.md
│   └── 10-security-strategy.md
│
├── scripts/                           # Utility scripts
│   ├── setup.sh
│   ├── seed-db.ts
│   └── migrate.sh
│
├── .gitignore
├── .env.example
├── docker-compose.yml
├── README.md
└── package.json                       # Root package.json
```

## Frontend Detailed Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout with providers
│   │   ├── page.tsx                  # Dashboard home
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx              # Main dashboard
│   │   │   ├── elections/page.tsx    # Election management
│   │   │   ├── constituencies/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   ├── insights/page.tsx
│   │   │   ├── maps/page.tsx
│   │   │   └── query/page.tsx
│   │   └── settings/
│   │       ├── profile/page.tsx
│   │       └── organization/page.tsx
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── SidebarItem.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── dashboard/
│   │   │   ├── StatsCards.tsx
│   │   │   ├── TrendChart.tsx
│   │   │   └── RecentActivity.tsx
│   │   ├── elections/
│   │   │   ├── ElectionCard.tsx
│   │   │   ├── ElectionList.tsx
│   │   │   ├── UploadModal.tsx
│   │   │   └── ProcessingStatus.tsx
│   │   ├── maps/
│   │   │   ├── ElectionMap.tsx
│   │   │   ├── MapControls.tsx
│   │   │   └── MapLegend.tsx
│   │   ├── insights/
│   │   │   ├── InsightCard.tsx
│   │   │   └── AIInsight.tsx
│   │   └── query/
│   │       ├── QueryInput.tsx
│   │       └── QueryResults.tsx
│   │
│   ├── lib/
│   │   ├── api/                      # API clients
│   │   │   ├── client.ts             # Axios instance
│   │   │   ├── elections.ts
│   │   │   ├── analytics.ts
│   │   │   └── query.ts
│   │   ├── hooks/                    # Custom hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useElections.ts
│   │   │   └── useAnalytics.ts
│   │   ├── store/                    # Zustand stores
│   │   │   ├── authStore.ts
│   │   │   ├── electionStore.ts
│   │   │   └── uiStore.ts
│   │   └── utils/
│   │       ├── cn.ts                 # Classname utility
│   │       ├── formatters.ts
│   │       └── validators.ts
│   │
│   ├── types/
│   │   ├── election.ts
│   │   ├── constituency.ts
│   │   ├── insight.ts
│   │   └── user.ts
│   │
│   ├── styles/
│   │   └── globals.css
│   │
│   └── main.tsx                      # Entry point
│
├── public/
│   ├── assets/
│   └── icons/
│
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Backend Detailed Structure

```
backend/
├── src/
│   ├── app/
│   │   ├── app.ts                    # Express app setup
│   │   ├── server.ts                 # Server entry point
│   │   └── routes.ts                 # Route aggregation
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── elections.controller.ts
│   │   ├── constituencies.controller.ts
│   │   ├── analytics.controller.ts
│   │   ├── insights.controller.ts
│   │   ├── maps.controller.ts
│   │   ├── query.controller.ts
│   │   └── uploads.controller.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── elections.service.ts
│   │   ├── constituencies.service.ts
│   │   ├── analytics.service.ts
│   │   ├── insights.service.ts
│   │   ├── maps.service.ts
│   │   ├── query.service.ts
│   │   ├── upload.service.ts
│   │   ├── ai.service.ts             # Gemini integration
│   │   ├── cache.service.ts
│   │   └── queue.service.ts
│   │
│   ├── repositories/
│   │   ├── base.repository.ts
│   │   ├── election.repository.ts
│   │   ├── constituency.repository.ts
│   │   ├── result.repository.ts
│   │   ├── insight.repository.ts
│   │   └── user.repository.ts
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts        # Firebase token verification
│   │   ├── rbac.middleware.ts       # Role-based access control
│   │   ├── validation.middleware.ts
│   │   ├── rate-limit.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── logger.middleware.ts
│   │
│   ├── validators/
│   │   ├── election.validator.ts
│   │   ├── constituency.validator.ts
│   │   └── query.validator.ts
│   │
│   ├── dto/
│   │   ├── election.dto.ts
│   │   ├── constituency.dto.ts
│   │   └── query.dto.ts
│   │
│   ├── models/prisma/
│   │   └── schema.prisma            # Database schema
│   │
│   ├── jobs/
│   │   ├── data-processor.job.ts
│   │   ├── insight-generator.job.ts
│   │   ├── cache-warmer.job.ts
│   │   └── index.ts
│   │
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── cache.ts                 # Redis client
│   │   ├── queue.ts                 # BullMQ setup
│   │   ├── storage.ts               # S3/R2 client
│   │   └── ai-client.ts             # Gemini client
│   │
│   ├── config/
│   │   ├── index.ts
│   │   ├── database.ts
│   │   ├── firebase.ts
│   │   ├── gemini.ts
│   │   └── storage.ts
│   │
│   ├── types/
│   │   ├── express.d.ts             # Extended Express types
│   │   └── index.ts
│   │
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── e2e/
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── logs/
├── uploads/
│   ├── temp/
│   └── processed/
│
├── .env.example
├── .env
├── .dockerignore
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── jest.config.js
└── .eslintrc.json
```

## File Naming Conventions

### Frontend
- Components: PascalCase (e.g., `ElectionCard.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useElections.ts`)
- Utilities: camelCase (e.g., `formatters.ts`)
- Types: camelCase (e.g., `election.ts`)
- Pages: `page.tsx` (file-based routing)

### Backend
- Controllers: `*.controller.ts`
- Services: `*.service.ts`
- Repositories: `*.repository.ts`
- Middleware: `*.middleware.ts`
- Validators: `*.validator.ts`
- DTOs: `*.dto.ts`
- Jobs: `*.job.ts`

## Environment Variables

### Frontend (.env)
```env
VITE_API_URL=https://api.votelens.ai
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Backend (.env)
```env
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Redis
REDIS_URL=redis://localhost:6379

# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Gemini AI
GOOGLE_CLOUD_PROJECT=your_project
GOOGLE_CLOUD_LOCATION=us-central1
GEMINI_MODEL=gemini-1.5-pro

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Storage
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY=your_access_key
R2_SECRET_KEY=your_secret_key
R2_BUCKET=votelens-uploads

# CORS
CORS_ORIGIN=https://votelens.ai
```

# VoteLens AI - AI-Powered Election Intelligence Platform

A production-grade monorepo for an AI-powered election intelligence platform featuring real-time election data processing, AI-generated analytics, and interactive visualizations.

## 📁 Monorepo Structure

```
votelens-ai/
├── frontend/              # React + Vite + Tailwind + shadcn/ui
├── backend/               # Node.js + Express + Prisma
├── shared/                # Shared types and utilities
├── docs/                  # Architecture documentation
└── scripts/               # Utility scripts
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ LTS
- PostgreSQL 15+
- Redis 7+
- npm 9+

### Installation

```bash
# Clone repository
git clone https://github.com/votelens/votelens-ai.git
cd votelens-ai

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development
npm run dev
```

### Development

```bash
# Start all services
npm run dev

# Start frontend only
npm run dev:frontend

# Start backend only
npm run dev:backend

# Run tests
npm run test

# Run linting
npm run lint

# Format code
npm run format
```

### Docker Development

```bash
# Start all services with Docker
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

### Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

## 📦 Package Scripts

### Root
- `npm run dev` - Start all services
- `npm run build` - Build all packages
- `npm run test` - Run all tests
- `npm run lint` - Lint all packages
- `npm run docker:up` - Start Docker services

### Frontend
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run lint` - Lint code

## 🏗️ Architecture

### Frontend Stack
- **Framework**: React 18+ with Vite 5+
- **Styling**: Tailwind CSS 3.4+
- **UI Components**: shadcn/ui (Radix UI)
- **State Management**: Zustand + React Query
- **Routing**: React Router 6+
- **Charts**: Recharts
- **Maps**: Leaflet
- **Forms**: React Hook Form + Zod

### Backend Stack
- **Runtime**: Node.js 20+ LTS
- **Framework**: Express 4.18+
- **ORM**: Prisma 5+
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Queue**: BullMQ 5+
- **Authentication**: Firebase Admin SDK
- **AI**: Google Gemini API

### Deployment
- **Frontend**: Vercel
- **Backend**: Railway
- **Database**: Railway PostgreSQL
- **Cache**: Railway Redis

## 📚 Documentation

- [Architecture Overview](./ARCHITECTURE.md) - Complete system architecture
- [Monorepo Guide](./docs/MONOREPO_GUIDE.md) - Naming conventions and strategies
- [API Documentation](./docs/04-api-architecture.md) - RESTful API reference

## 🔐 Security

- Firebase Authentication
- Role-based access control (RBAC)
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection
- CORS configuration

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📝 Naming Conventions

### Files
- **Frontend Components**: PascalCase (e.g., `ElectionCard.tsx`)
- **Frontend Hooks**: camelCase with `use` prefix (e.g., `useElections.ts`)
- **Backend Controllers**: `*.controller.ts`
- **Backend Services**: `*.service.ts`
- **Backend Repositories**: `*.repository.ts`

### Variables
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Classes/Interfaces**: PascalCase

See [Monorepo Guide](./docs/MONOREPO_GUIDE.md) for detailed conventions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

MIT

## 👥 Team

VoteLens AI Team
# votelens-ai

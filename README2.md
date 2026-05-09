# VoteLens AI - Quick Start Guide

**AI-powered election intelligence platform for analyzing electoral data, trends, and predictions.**

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20.x or later
- **npm** 9.x or later
- PostgreSQL (local or cloud)
- Redis (optional, for caching)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Set up database
npm run db:generate
npm run db:migrate

# 3. Start the application
npm run dev
```

### Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Health**: http://localhost:3000/health
- **Database Studio**: http://localhost:5555 (run `npm run db:studio`)

---

## 📁 Project Structure

```
elections/
├── backend/          # Node.js/Express API
│   ├── src/
│   │   ├── app/      # Express app configuration
│   │   ├── routes/   # API routes
│   │   ├── services/ # Business logic
│   │   └── middleware/
│   ├── prisma/       # Database schema
│   └── package.json
├── frontend/         # React/Vite UI
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
├── shared/            # Shared types & utilities
│   ├── src/
│   │   ├── types/
│   │   └── utils/
│   └── package.json
├── docs/              # Additional documentation
└── package.json      # Workspace root
```

---

## 🔧 Development Scripts

```bash
# Development
npm run dev                # Start frontend + backend
npm run dev:frontend      # Frontend only
npm run dev:backend       # Backend only

# Database
npm run db:generate       # Generate Prisma client
npm run db:migrate        # Run migrations
npm run db:seed           # Seed sample data
npm run db:studio         # Open Prisma Studio
npm run db:reset          # Reset database

# Building
npm run build             # Build frontend + backend
npm run build:frontend
npm run build:backend

# Testing & Linting
npm run test              # Run all tests
npm run lint              # Run ESLint
npm run type-check        # TypeScript type checking

# Docker
npm run docker:up         # Start Docker services
npm run docker:down       # Stop Docker services
npm run docker:logs       # View Docker logs
```

---

## 🌍 Environment Variables

Create a `.env` file in the root:

```env
# Database
DATABASE_URL=postgresql://votelens:votelens@localhost:5432/votelens

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Backend
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# AI Services
GEMINI_API_KEY=your-gemini-api-key

# Frontend
VITE_API_URL=http://localhost:3000
```

See `.env.example` for all available variables.

---

## 🐳 Docker Setup (Optional)

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Start everything in containers
docker-compose up -d

# View logs
docker-compose logs -f
```

---

## 📊 Features

- **Election Analytics**: Analyze electoral trends and patterns
- **AI-Powered Insights**: Google Gemini AI for intelligent analysis
- **Real-time Data**: Live election results and updates
- **Interactive Maps**: Geographic visualization of electoral data
- **Data Upload**: CSV/Excel dataset import and processing
- **User Management**: Firebase authentication and authorization

---

## 🔐 Security

- JWT-based authentication
- Rate limiting on API endpoints
- CORS configuration
- Input validation with Zod
- Helmet.js security headers
- Environment variable protection

---

## 📈 Production Deployment

### Railway (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up
```

See `RAILWAY_DEPLOYMENT.md` for detailed instructions.

### Vercel (Frontend)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| `README.md` | Main project documentation |
| `ARCHITECTURE.md` | System architecture overview |
| `SCALING_ARCHITECTURE.md` | Scaling strategy |
| `RAILWAY_SCALING_RECOMMENDATIONS.md` | Railway-specific scaling |
| `POSTGRESQL_OPTIMIZATION_GUIDE.md` | Database optimization |
| `CACHING_STRATEGY.md` | Caching implementation |
| `PERFORMANCE_TUNING_GUIDE.md` | Performance optimization |
| `MONITORING_ARCHITECTURE.md` | Monitoring setup |
| `LOGGING_STRATEGY.md` | Logging configuration |
| `PRODUCTION_DIAGNOSTICS.md` | Troubleshooting guide |
| `LOCAL_SETUP.md` | Local development setup |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🆘 Support

- **Issues**: https://github.com/votelens/votelens-ai/issues
- **Documentation**: See the `docs/` folder
- **Troubleshooting**: See `PRODUCTION_DIAGNOSTICS.md`

---

## 🎯 Roadmap

- [ ] Real-time WebSocket updates
- [ ] Advanced ML predictions
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Export to PDF/Excel reports

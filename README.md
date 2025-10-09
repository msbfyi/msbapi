# MSB API Monorepo

A Personal API ecosystem built with Supabase Edge Functions that processes RSS
feeds from Letterboxd and Trakt.tv to automatically track movie watches,
ratings, and reviews. This monorepo contains all components needed for a
complete movie tracking system.

[![CI](https://github.com/yourusername/msb-api/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/msb-api/actions/workflows/ci.yml)
[![Deploy](https://github.com/yourusername/msb-api/actions/workflows/deploy.yml/badge.svg)](https://github.com/yourusername/msb-api/actions/workflows/deploy.yml)

## 🏗️ Monorepo Structure

```
msb-api/
├── packages/
│   ├── edge-functions/     # Supabase Edge Functions (Deno/TypeScript)
│   ├── admin-app/          # Admin Dashboard (Lit/Web Components)
│   ├── shared/             # Shared utilities and types (TypeScript)
│   └── api-client/         # JavaScript/TypeScript SDK
├── docs/                   # Consolidated documentation
│   ├── database/           # Database schema & migrations
│   ├── api/               # API documentation
│   └── deployment/        # Deployment guides
├── scripts/               # Development & deployment scripts
├── .github/workflows/     # CI/CD automation
└── tools/                 # Development tools & configs
```

## ✨ Features

- 🎬 **RSS Feed Processing** - Monitors Letterboxd and Trakt.tv RSS feeds via
  EchoFeed webhooks
- 🖼️ **TMDB Integration** - Automatic movie poster and metadata enrichment
- 📊 **Rich API** - RESTful endpoints for movies, watches, statistics, and
  search
- 🔄 **Data Backfill** - Import existing Trakt.tv watch history
- 🌐 **Admin Interface** - Modern web components dashboard for database
  management
- 📦 **TypeScript SDK** - Type-safe API client for building applications
- 🤖 **CI/CD Pipeline** - Automated testing, deployment, and code quality
- 📚 **Database Management** - Schema documentation and migration tracking

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Deno](https://deno.land/manual/getting_started/installation) (for edge
  functions)

### 1. Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/yourusername/msb-api.git
cd msb-api

# Run automated setup
npm run setup
```

The setup script will:

- Install all dependencies
- Check for required tools (Supabase CLI, Deno)
- Setup environment files
- Build all packages
- Generate database documentation

### 2. Environment Configuration

Copy and configure your environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Required - Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Required - Admin Web Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional - TMDB Integration (recommended)
TMDB_API_KEY=your-tmdb-api-key

# Optional - Data Backfill
TRAKT_API_KEY=your-trakt-api-key
TRAKT_USERNAME=your-trakt-username
```

### 3. Database Setup

```bash
# Initialize Supabase project (if needed)
cd packages/edge-functions
supabase init
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Apply database migrations
cd ../..
npm run db:migrate
```

### 4. Deploy Services

```bash
# Deploy edge functions
npm run deploy:functions

# Start admin interface locally
npm run workspace:admin-app

# Or build for production
npm run deploy:admin
```

## 📦 Workspace Commands

### Development

```bash
# Start all development servers
npm run dev

# Work on specific packages
npm run workspace:edge-functions    # Supabase functions
npm run workspace:admin-app        # Admin dashboard
npm run workspace:shared          # Shared utilities
npm run workspace:api-client      # API client

# Alternative syntax
npm run dev -w packages/admin-app
npm run build -w packages/api-client
```

### Building and Testing

```bash
# Build all packages
npm run build

# Run all tests
npm run test

# Code quality checks
npm run lint                 # Lint all code
npm run format              # Format all code
npm run typecheck           # TypeScript validation
npm run format:check        # Check formatting
```

### Database Operations

```bash
# Generate/update database documentation
npm run db:docs

# Database migrations
npm run db:migrate          # Apply migrations
npm run db:reset           # Reset database

# Data operations
npm run tmdb-test          # Test TMDB connection
npm run movie-backfill     # Import Trakt.tv data
npm run tmdb-enricher      # Enrich existing movies
```

## 🏢 Architecture Overview

### Edge Functions (`packages/edge-functions/`)

- **Deno/TypeScript** runtime on Supabase
- Processes EchoFeed webhooks from RSS feeds
- TMDB API integration for movie enrichment
- RESTful API endpoints for data access
- Automatic database schema creation

### Admin Dashboard (`packages/admin-app/`)

- **Lit 3.0** with Web Components and Shoelace UI
- Signal-based reactive state management
- Supabase authentication integration
- Real-time dashboard with statistics
- Database management interface
- Responsive design with modern UI components

### API Client (`packages/api-client/`)

- **TypeScript SDK** for consuming the movie API
- Browser and Node.js compatible
- Type-safe API interactions
- Built-in error handling and response types

### Shared Package (`packages/shared/`)

- Common TypeScript types and interfaces
- Utility functions for date, string, and movie operations
- Validation helpers
- Database schema definitions

### Documentation (`docs/`)

- **Database schema** with auto-generation scripts
- **Migration tracking** with rollback procedures
- **API documentation** with examples
- **Deployment guides** for various platforms

## 🔄 Data Flow

1. **RSS Monitoring**: EchoFeed monitors Letterboxd/Trakt.tv RSS feeds
2. **Webhook Processing**: Edge function receives and processes feed items
3. **Data Extraction**: Extracts movie title, year, rating, review from various
   sources
4. **TMDB Enrichment**: Automatically adds posters, plot summaries, metadata
5. **Database Storage**: Creates/updates movie and watch records
6. **API Access**: Data available via RESTful endpoints
7. **Admin Interface**: Dashboard provides management and analytics

## 🛠️ Development Tools

### Code Quality Automation

- **Husky**: Git hooks for automated quality checks
- **lint-staged**: Staged file linting and formatting
- **Prettier**: Consistent code formatting across all file types
- **ESLint**: Workspace-specific linting rules
- **TypeScript**: Strict mode with project references

### CI/CD Pipeline

- **GitHub Actions**: Automated testing and deployment
- **Security Scanning**: Secret detection and vulnerability assessment
- **Multi-environment**: Separate workflows for development and production
- **Automated Publishing**: NPM package publishing for API client

### Database Management

- **Schema Documentation**: Auto-generated from live database
- **Migration Tracking**: Version-controlled schema changes
- **Recovery Scripts**: Complete database recreation procedures
- **Drift Detection**: Automated schema validation

## 🚀 Deployment

### GitHub Actions

The repository includes comprehensive CI/CD workflows:

#### Continuous Integration (`.github/workflows/ci.yml`)

- **Triggered on**: Pull requests and pushes to main/develop
- **Checks**: Linting, type checking, testing, security audit
- **Edge Functions**: Deno-specific linting and type checking
- **Format Validation**: Prettier formatting checks

#### Deployment (`.github/workflows/deploy.yml`)

- **Triggered on**: Pushes to main branch
- **Edge Functions**: Automated deployment to Supabase
- **Admin Website**: Deployment to Vercel
- **Package Publishing**: NPM publishing for API client

### Required Secrets

Configure these secrets in your GitHub repository:

```
# Supabase
SUPABASE_ACCESS_TOKEN=your-supabase-access-token
SUPABASE_PROJECT_ID=your-supabase-project-id

# Admin Website (Vercel)
VERCEL_TOKEN=your-vercel-token
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Package Publishing
NPM_TOKEN=your-npm-token
```

### Manual Deployment

```bash
# Deploy edge functions
cd packages/edge-functions
supabase functions deploy --no-verify-jwt

# Build admin dashboard
cd packages/admin-app
npm run build

# Publish API client
cd packages/api-client
npm run build
npm publish --access public
```

## 📚 Documentation

### Package-Specific Documentation

- [Edge Functions](packages/edge-functions/README.md) - API endpoints and
  deployment
- [Admin Dashboard](packages/admin-app/README.md) - UI components and features
- [API Client](packages/api-client/README.md) - SDK usage and examples
- [Shared Package](packages/shared/README.md) - Types and utilities

### System Documentation

- [Database Schema](docs/database/schema.md) - Complete schema reference
- [Migration Guide](docs/database/migrations/README.md) - Database change
  management
- [API Reference](docs/api/README.md) - Endpoint documentation
- [Deployment Guide](docs/deployment/README.md) - Platform-specific guides
- [Supabase MCP Setup](docs/deployment/supabase-mcp-setup.md) - AI assistant
  integration

## 🔧 Configuration

### Required Services

#### Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Get your project URL and service role key
3. Configure RLS policies if needed

#### TMDB (Recommended)

1. Create account at [themoviedb.org](https://www.themoviedb.org)
2. Request API key in Settings > API
3. Add to environment variables

#### EchoFeed

1. Sign up at [echofeed.app](https://echofeed.app)
2. Add RSS feeds:
   - Letterboxd: `https://letterboxd.com/USERNAME/rss/`
   - Trakt.tv: `https://trakt.tv/users/USERNAME/history.rss`
3. Configure webhook to your edge function URL

#### Trakt.tv (Optional)

1. Create application at
   [trakt.tv/oauth/applications](https://trakt.tv/oauth/applications)
2. Get API key for data backfill

### Environment Variables Reference

See [.env.example](.env.example) for complete configuration options.

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Run setup: `npm run setup`
4. Make your changes
5. Run quality checks: `npm run lint && npm run typecheck && npm run test`
6. Commit with conventional format: `feat(scope): description`
7. Push and create a Pull Request

### Commit Message Format

```
type(scope): description

# Examples:
feat(api): add TMDB movie enrichment
fix(admin): resolve dashboard loading issue
docs: update README with deployment guide
```

### Code Quality Standards

- All code must pass ESLint and TypeScript checks
- Prettier formatting is enforced via pre-commit hooks
- Test coverage is required for new features
- Documentation must be updated for API changes

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Complete Documentation](docs/)
- 🐛 [Issues](https://github.com/yourusername/msb-api/issues)
- 💬 [Discussions](https://github.com/yourusername/msb-api/discussions)
- 📧 [Email Support](mailto:your-email@example.com)

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend infrastructure
- [TMDB](https://www.themoviedb.org) - Movie metadata
- [EchoFeed](https://echofeed.app) - RSS monitoring
- [Letterboxd](https://letterboxd.com) & [Trakt.tv](https://trakt.tv) - Movie
  tracking platforms

---

**Built with ❤️ for movie enthusiasts**

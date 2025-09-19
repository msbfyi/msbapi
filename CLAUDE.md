# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

This is a Personal API built with Supabase Edge Functions, structured as a
monorepo. The system processes movie activity from RSS feeds (Letterboxd,
Trakt.tv) via EchoFeed webhooks and stores movie watches, ratings, and reviews
in a structured database.

This project follows open source best practices including semantic versioning,
maintaining a changelog, clear documentation, and monorepo standards. We welcome
contributions and strive to maintain code quality and community standards.

## Monorepo Structure

```
msb-api/
├── packages/
│   ├── edge-functions/      # Supabase Edge Functions (Deno/TypeScript)
│   ├── admin-web/          # Admin website (Next.js/React)
│   ├── shared/             # Shared utilities and types (TypeScript)
│   └── api-client/         # JavaScript client library (TypeScript)
├── docs/                   # Consolidated documentation
│   ├── database/           # Database schema & migrations
│   ├── api/               # API documentation
│   └── deployment/        # Deployment guides
├── scripts/               # Development & deployment scripts
├── .github/               # GitHub workflows (CI/CD)
└── tools/                 # Development tools & configs
```

## Architecture

### Core Components

- **Edge Functions** (`packages/edge-functions/`): Supabase Edge Functions for
  API endpoints
  - `supabase/functions/movies/index.ts` - Main API handler
  - Processes EchoFeed webhooks for movie activity
  - Provides REST endpoints for movie data
  - Supports multiple RSS sources (Letterboxd, Trakt.tv, generic)

- **Admin Website** (`packages/admin-web/`): Next.js admin interface
  - Movie database management
  - Analytics and statistics
  - TMDB enrichment tools
  - User-friendly movie tracking interface

- **API Client** (`packages/api-client/`): JavaScript/TypeScript client library
  - Provides methods for movies, watches, stats, search
  - Browser and Node.js compatible
  - Type-safe API interactions

- **Shared Package** (`packages/shared/`): Common utilities and types
  - Database types and schemas
  - Utility functions
  - Configuration helpers
  - Shared validation logic

- **Database Schema**: PostgreSQL with Supabase
  - `movies` - Movie metadata (title, year, director, external IDs, TMDB
    enrichment)
  - `movie_watches` - Individual watch records with ratings/reviews
  - Supports deduplication via external IDs and title/year matching

### Data Flow

1. User rates/reviews movie on Letterboxd/Trakt.tv
2. EchoFeed monitors RSS feed and sends webhook
3. Edge function extracts movie data and creates/updates records
4. TMDB enrichment adds poster URLs, plot summaries, etc.
5. Admin interface and API client provide access to processed data

## Development Commands

### Setup

```bash
# Initial setup
npm run setup

# Install dependencies for all workspaces
npm install

# Start all development servers
npm run dev
```

### Workspace-Specific Commands

```bash
# Work on specific packages
npm run workspace:edge-functions    # Supabase functions
npm run workspace:admin-web        # Admin website
npm run workspace:shared          # Shared utilities
npm run workspace:api-client      # API client

# Or use workspace flags
npm run dev -w packages/admin-web
npm run build -w packages/api-client
```

### Supabase Functions

```bash
# Deploy all functions
npm run deploy:functions

# Work with database
npm run db:migrate
npm run db:reset
npm run db:docs

# Function-specific commands (run from packages/edge-functions/)
supabase functions serve movies
supabase functions logs movies
supabase functions deploy movies --no-verify-jwt
```

### Building and Testing

```bash
# Build all packages
npm run build

# Run all tests
npm run test

# Lint and format
npm run lint
npm run format
npm run typecheck
```

### Data Operations

```bash
# TMDB and data scripts
npm run tmdb-test
npm run movie-backfill
npm run tmdb-enricher

# Generate database documentation
npm run db:docs
```

## Key Integration Points

### EchoFeed Webhook Format

The function expects webhooks with `item` containing:

- `title` - Movie title (format: "Title, Year" for Letterboxd)
- `content` - Review text with rating (★ symbols for Letterboxd)
- `link` - Source URL for external ID extraction
- `guid` - Unique identifier
- `pubDate` - Watch timestamp

### RSS Source Support

- **Letterboxd**: Extracts star ratings (1-5), handles "Title, Year" format
- **Trakt.tv**: Handles numeric ratings, various title formats
- **Generic**: Basic title/year extraction from common RSS patterns

### TMDB Integration

- Automatic enrichment for new movies
- Poster and backdrop URLs
- Plot summaries and metadata
- Director and genre information
- Configurable via TMDB_API_KEY environment variable

### Database Design

- Movies are deduplicated by external IDs first, then title+year
- Watch records preserve original metadata and source attribution
- Schema supports rich movie metadata (genres, cast, crew)
- Full documentation in `docs/database/schema.md`

## Configuration Notes

- Edge function runs without JWT verification to accept webhooks
- Database tables use UUIDs and include created_at/updated_at timestamps
- External IDs stored separately for each platform (letterboxd_id, trakt_id,
  tmdb_id)
- Watch metadata stored as JSONB for flexible source-specific data
- TypeScript configuration supports workspace references
- ESLint and Prettier configured for consistent code style

## External Dependencies

- **Supabase**: Database and Edge Functions runtime (Deno)
- **EchoFeed**: RSS-to-webhook service for feed monitoring
- **TMDB API**: Movie metadata enrichment (optional, requires API key)
- **Next.js**: Admin website framework
- **GitHub Actions**: CI/CD pipeline

## Monorepo Best Practices

### Workspace Management

- Each package has its own `package.json` with workspace-specific scripts
- Shared dependencies are hoisted to root `node_modules`
- TypeScript project references enable fast incremental builds
- Workspaces can depend on each other using `workspace:*` protocol

### Development Workflow

1. **Setup**: Run `npm run setup` for new contributors
2. **Development**: Use workspace-specific commands for focused development
3. **Building**: Build all packages before committing
4. **Testing**: Run tests across all workspaces
5. **Deployment**: Automated via GitHub Actions

### Code Quality Standards

- **TypeScript**: Strict mode enabled, project references configured
- **ESLint**: Consistent linting across all packages
- **Prettier**: Automated code formatting
- **Testing**: Vitest for unit tests, automated in CI
- **Documentation**: Comprehensive docs in `docs/` directory

### Database Management

- **Schema Documentation**: Auto-generated from live database
- **Migrations**: Tracked in `docs/database/migrations/`
- **Version Control**: All schema changes documented and versioned
- **Recovery**: Complete recreation scripts available

## GitHub Integration

### CI/CD Pipeline

- **Continuous Integration**: Lint, test, and build on every PR
- **Deployment**: Automated deployment to production on main branch
- **Security**: Automated security audits and secret scanning
- **Documentation**: Auto-generated database docs

### Workflows

- `ci.yml`: Lint, test, typecheck, and security audit
- `deploy.yml`: Deploy edge functions and admin website
- Branch protection and required status checks

## Environment Variables

See `.env.example` for required environment variables:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for edge functions
- `TMDB_API_KEY`: Optional TMDB API key for movie enrichment
- `NEXT_PUBLIC_SUPABASE_URL`: Public Supabase URL for admin website
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anonymous key for admin website

## Open Source Best Practices

This project follows open source development standards:

### Versioning

- Uses [Semantic Versioning](https://semver.org/) (SemVer) for releases
- Version format: MAJOR.MINOR.PATCH
- Breaking changes increment MAJOR, new features increment MINOR, bug fixes
  increment PATCH
- Independent versioning for publishable packages

### Documentation

- Maintains a [CHANGELOG.md](./CHANGELOG.md) following
  [Keep a Changelog](https://keepachangelog.com/) format
- All notable changes are documented with clear categories (Added, Changed,
  Fixed, etc.)
- Each release is properly tagged and documented
- Comprehensive README files for each package

### Code Quality

- Clear, self-documenting code with minimal comments
- Consistent naming conventions and project structure
- Thorough testing before releases
- Security best practices (no secrets in code)
- Automated code quality checks

### Community Standards

- Clear contribution guidelines
- Issue and PR templates
- Code of conduct
- Security policy
- License information

## Claude Code Best Practices

When working with this codebase, please follow these guidelines:

### File Organization

- Prefer editing existing files over creating new ones
- Use the monorepo structure - don't create files in the root unless necessary
- Follow the established patterns in each workspace

### Development Commands

- Always run `npm run lint` and `npm run typecheck` before committing
- Use `npm run format` to ensure consistent code style
- Run `npm run test` to verify functionality
- Use `npm run db:docs` to update database documentation after schema changes

### Database Changes

- Document all schema changes in `docs/database/migrations/`
- Update `docs/database/schema.md` when adding new tables or columns
- Test migrations thoroughly before deployment
- Use the provided migration templates

### Deployment

- Edge functions deploy from `packages/edge-functions/`
- Admin website deploys from `packages/admin-web/`
- API client can be published to npm from `packages/api-client/`
- Use the provided GitHub Actions workflows

### Troubleshooting

- Check workspace-specific `package.json` files for available commands
- Ensure Supabase CLI is installed and configured
- Verify environment variables are set correctly
- Use the setup script (`npm run setup`) for initial environment configuration

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a movie tracking API built with Supabase Edge Functions. The system processes movie activity from RSS feeds (Letterboxd, Trakt.tv) via EchoFeed webhooks and stores movie watches, ratings, and reviews in a structured database.

This project follows open source best practices including semantic versioning, maintaining a changelog, and clear documentation. We welcome contributions and strive to maintain code quality and community standards.

## Architecture

### Core Components

- **Supabase Edge Function**: `supabase/functions/movies/index.ts` - Main API handler
  - Processes EchoFeed webhooks for movie activity
  - Provides REST endpoints for movie data
  - Supports multiple RSS sources (Letterboxd, Trakt.tv, generic)

- **Movie Database Schema**: 
  - `movies` - Movie metadata (title, year, director, external IDs)
  - `movie_watches` - Individual watch records with ratings/reviews
  - Supports deduplication via external IDs and title/year matching

- **API Client**: `docs/movies/movie-api.js`
  - JavaScript client for building movie websites
  - Provides methods for movies, watches, stats, search
  - HTML generation utilities for common widgets

- **Data Pipeline**: RSS feed → EchoFeed → Webhook → Edge Function → Database

### Data Flow

1. User rates/reviews movie on Letterboxd/Trakt.tv
2. EchoFeed monitors RSS feed and sends webhook
3. Edge function extracts movie data and creates/updates records
4. API endpoints serve processed data for consumption

## Development Commands

### Supabase Functions

```bash
# Deploy the movie function
supabase functions deploy movies --no-verify-jwt

# Test function locally 
supabase functions serve movies

# View function logs
supabase functions logs movies
```

### Testing

```bash
# Test webhook endpoint manually
curl -X POST https://your-project.supabase.co/functions/v1/movies \
  -H "Content-Type: application/json" \
  -d '{"item": {"title": "Test Movie, 2023", "content": "★★★★☆", "link": "test"}}'

# Test API endpoints
curl https://your-project.supabase.co/functions/v1/movies/watches
curl https://your-project.supabase.co/functions/v1/movies/stats
```

### Data Backfill

```bash
# Backfill from Trakt.tv (requires API key)
node docs/movies/movie-backfill.js history
node docs/movies/movie-backfill.js watched
node docs/movies/movie-backfill.js both
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

### Database Design
- Movies are deduplicated by external IDs first, then title+year
- Watch records preserve original metadata and source attribution
- Schema supports rich movie metadata (genres, cast, crew) for future enhancement

## Configuration Notes

- Edge function runs without JWT verification to accept webhooks
- Database tables use UUIDs and include created_at/updated_at timestamps
- External IDs stored separately for each platform (letterboxd_id, trakt_id)
- Watch metadata stored as JSONB for flexible source-specific data

## External Dependencies

- **Supabase**: Database and Edge Functions runtime (Deno)
- **EchoFeed**: RSS-to-webhook service for feed monitoring
- **Trakt.tv API**: Optional for data backfill (requires API key)

## Open Source Best Practices

This project follows open source development standards:

### Versioning
- Uses [Semantic Versioning](https://semver.org/) (SemVer) for releases
- Version format: MAJOR.MINOR.PATCH
- Breaking changes increment MAJOR, new features increment MINOR, bug fixes increment PATCH

### Documentation
- Maintains a [CHANGELOG.md](./CHANGELOG.md) following [Keep a Changelog](https://keepachangelog.com/) format
- All notable changes are documented with clear categories (Added, Changed, Fixed, etc.)
- Each release is properly tagged and documented

### Code Quality
- Clear, self-documenting code with minimal comments
- Consistent naming conventions and project structure
- Thorough testing before releases
- Security best practices (no secrets in code)
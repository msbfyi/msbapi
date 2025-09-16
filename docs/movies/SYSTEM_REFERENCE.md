# Movie Tracking API - System Reference

This document provides comprehensive documentation for the movie tracking API system built with Supabase Edge Functions. Use this as a reference for future development sessions.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Components](#architecture-components)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Client Libraries](#client-libraries)
6. [Data Pipeline](#data-pipeline)
7. [External Integrations](#external-integrations)
8. [Development Utilities](#development-utilities)
9. [Configuration](#configuration)
10. [Deployment](#deployment)

## System Overview

The movie tracking API processes movie activity from RSS feeds (Letterboxd, Trakt.tv) via EchoFeed webhooks and stores movie watches, ratings, and reviews in a structured database with automatic TMDB enrichment.

### Key Features
- **Automatic TMDB Enrichment**: New movies are automatically enriched with posters, backdrops, plot summaries, and metadata
- **Multi-source RSS Support**: Handles Letterboxd, Trakt.tv, and generic RSS feeds
- **Deduplication**: Movies are deduplicated by external IDs and title/year matching
- **Rich API**: RESTful endpoints for movies, watches, statistics, and search
- **Client Library**: JavaScript client for building movie websites

## Architecture Components

### Core Files

| File | Purpose | Key Functions |
|------|---------|---------------|
| `supabase/functions/movies/index.ts` | Main Edge Function | Webhook processing, API endpoints, TMDB enrichment |
| `docs/movies/movie-api.js` | JavaScript Client | API wrapper, utility methods, HTML generators |
| `docs/movies/movie-backfill.js` | Data Backfill Tool | Trakt.tv historical data import |
| `docs/movies/tmdb-enricher.js` | TMDB Enrichment Tool | Batch movie enrichment with TMDB data |
| `docs/movies/delete-test-movies.js` | Cleanup Utility | Remove test/duplicate records |

### Technology Stack
- **Runtime**: Deno (Supabase Edge Functions)
- **Database**: PostgreSQL (Supabase)
- **External APIs**: TMDB API, Trakt.tv API
- **Webhook Provider**: EchoFeed
- **Client**: Vanilla JavaScript (browser/Node.js compatible)

## Database Schema

### `movies` Table
Primary movie metadata with automatic TMDB enrichment.

| Column | Type | Purpose | Notes |
|--------|------|---------|-------|
| `id` | UUID | Primary key | Auto-generated |
| `title` | VARCHAR | Movie title | Required |
| `year` | INTEGER | Release year | Required |
| `director` | VARCHAR | Director name | From TMDB or manual |
| `letterboxd_id` | VARCHAR | Letterboxd slug | Unique identifier |
| `trakt_id` | VARCHAR | Trakt.tv ID | Unique identifier |
| `tmdb_id` | VARCHAR | TMDB ID | Added during enrichment |
| `poster_url` | TEXT | Poster image URL | TMDB w500 size |
| `backdrop_url` | TEXT | Backdrop image URL | TMDB w1280 size |
| `plot_summary` | TEXT | Movie overview | From TMDB |
| `genres` | TEXT[] | Genre list | From TMDB |
| `country` | VARCHAR | Production country | ISO 3166-1 code |
| `language` | VARCHAR | Original language | ISO 639-1 code |
| `budget` | BIGINT | Production budget | From TMDB |
| `box_office` | BIGINT | Box office revenue | From TMDB |
| `trailer_url` | TEXT | YouTube trailer URL | From TMDB |
| `created_at` | TIMESTAMP | Record creation | Auto-generated |
| `updated_at` | TIMESTAMP | Last modification | Auto-updated |

### `movie_watches` Table
Individual watch records with ratings and reviews.

| Column | Type | Purpose | Notes |
|--------|------|---------|-------|
| `id` | UUID | Primary key | Auto-generated |
| `movie_id` | UUID | Foreign key to movies | Required |
| `watched_at` | TIMESTAMP | Watch timestamp | From RSS feed |
| `personal_rating` | DECIMAL | User rating | 1-5 scale (Letterboxd) or 1-10 (Trakt) |
| `review_text` | TEXT | Review content | HTML stripped |
| `source` | VARCHAR | Data source | 'letterboxd', 'trakt', 'generic' |
| `source_url` | TEXT | Original URL | Link to review/rating |
| `external_id` | VARCHAR | External identifier | RSS GUID or URL |
| `metadata` | JSONB | Source-specific data | Feed title, processed timestamp |
| `created_at` | TIMESTAMP | Record creation | Auto-generated |
| `updated_at` | TIMESTAMP | Last modification | Auto-updated |

### Relationships
- `movie_watches.movie_id` → `movies.id` (Foreign Key)
- Movies can have multiple watch records (rewatches)

## API Endpoints

### Base URL
`https://your-project.supabase.co/functions/v1/movies`

### Webhook Endpoint

#### `POST /movies`
Processes EchoFeed webhooks for movie activity.

**Request Body:**
```json
{
  "item": {
    "title": "The Matrix, 1999",
    "content": "★★★★☆ Amazing sci-fi movie...",
    "link": "https://letterboxd.com/user/film/the-matrix/",
    "guid": "https://letterboxd.com/user/film/the-matrix/#review-123",
    "pubDate": "2024-01-15T10:30:00Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully processed movie: The Matrix",
  "enriched": true,
  "result": {
    "movie": { "id": "uuid", "title": "The Matrix", ... },
    "watch": { "id": "uuid", "personal_rating": 4, ... },
    "action": "movie_watch_recorded"
  }
}
```

### Query Endpoints

#### `GET /movies`
Retrieve movies with optional filtering.

**Query Parameters:**
- `limit` (integer): Number of movies to return (default: 50)
- `search` (string): Search movies by title
- `posters` (boolean): Only return movies with posters

**Response:**
```json
{
  "count": 25,
  "movies": [
    {
      "id": "uuid",
      "title": "The Matrix",
      "year": 1999,
      "director": "The Wachowskis",
      "poster_url": "https://image.tmdb.org/t/p/w500/...",
      "movie_watches": [...],
      "watch_count": 2,
      "has_poster": true,
      "has_backdrop": true
    }
  ]
}
```

#### `GET /movies/movie/{id}`
Get detailed information for a specific movie.

**Response:**
```json
{
  "id": "uuid",
  "title": "The Matrix",
  "year": 1999,
  "director": "The Wachowskis",
  "poster_url": "https://image.tmdb.org/t/p/w500/...",
  "plot_summary": "A computer hacker learns...",
  "genres": ["Action", "Sci-Fi"],
  "movie_watches": [
    {
      "id": "uuid",
      "watched_at": "2024-01-15T10:30:00Z",
      "personal_rating": 4,
      "review_text": "Amazing sci-fi movie...",
      "source": "letterboxd"
    }
  ]
}
```

#### `GET /movies/watches`
Get recent movie watches.

**Query Parameters:**
- `limit` (integer): Number of watches to return (default: 20)

**Response:**
```json
{
  "count": 15,
  "watches": [
    {
      "id": "uuid",
      "watched_at": "2024-01-15T10:30:00Z",
      "personal_rating": 4,
      "review_text": "Amazing sci-fi movie...",
      "source": "letterboxd",
      "movies": {
        "id": "uuid",
        "title": "The Matrix",
        "year": 1999,
        "poster_url": "https://image.tmdb.org/t/p/w500/..."
      }
    }
  ]
}
```

#### `GET /movies/stats`
Get movie collection statistics.

**Response:**
```json
{
  "total_movies": 150,
  "total_watches": 180,
  "movies_with_posters": 140,
  "poster_coverage": 93,
  "average_rating": 3.8
}
```

### Utility Endpoints

#### `DELETE /movies/cleanup`
Clean up test or duplicate movie records.

**Request Body:**
```json
{
  "movieIds": ["uuid1", "uuid2"]
}
```

#### `POST /movies/debug`
Debug webhook payload structure.

## Client Libraries

### MovieAPI Class
JavaScript client for interacting with the movie API.

```javascript
const api = new MovieAPI('https://your-project.supabase.co/functions/v1/movies');

// Basic usage
const movies = await api.getMovies({ limit: 20, search: 'matrix' });
const recentWatches = await api.getRecentWatches(10);
const stats = await api.getMovieStats();

// Advanced queries
const topRated = await api.getTopRatedMovies(5);
const thisYear = await api.getThisYearActivity();
const streaks = await api.getWatchingStreaks();
const fiveStarMovies = await api.getMoviesByRating(5, 5);
```

### MovieWebsite Class
Higher-level client for building movie websites.

```javascript
const website = new MovieWebsite('https://your-project.supabase.co/functions/v1/movies');

// Build pages
const homepage = await website.buildHomepage();
const library = await website.buildLibraryPage('sci-fi', 1, 20);
const statsPage = await website.buildStatsPage();

// Generate HTML widgets
const watchesHTML = website.generateRecentWatchesHTML(watches);
const statsHTML = website.generateStatsHTML(stats);
```

### Client Methods Reference

| Method | Purpose | Parameters | Returns |
|--------|---------|------------|---------|
| `getMovies()` | Get movies list | `{ limit?, search? }` | `{ count, movies }` |
| `getRecentWatches()` | Get recent watches | `limit` | `{ count, watches }` |
| `getMovieStats()` | Get statistics | None | `{ total_movies, total_watches, ... }` |
| `searchMovies()` | Search by title | `query, limit` | `{ count, movies }` |
| `getMoviesByYear()` | Filter by year | `year, limit` | `{ count, movies }` |
| `getTopRatedMovies()` | Get highest rated | `limit` | `{ movies }` |
| `getDashboardData()` | Get homepage data | None | `{ stats, recent_watches, top_rated }` |
| `getThisYearActivity()` | Current year watches | None | `{ count, watches, year }` |
| `getWatchingStreaks()` | Calculate streaks | None | `{ current_streak, longest_streak, ... }` |
| `getMoviesByRating()` | Filter by rating | `minRating, maxRating` | `{ count, watches }` |
| `exportMovieData()` | Export all data | None | `{ export_date, stats, movies, watches }` |

## Data Pipeline

### RSS Feed Processing Flow

1. **RSS Feed Update** → User rates/reviews movie on Letterboxd/Trakt.tv
2. **EchoFeed Monitoring** → EchoFeed detects feed changes and sends webhook
3. **Webhook Processing** → Edge function receives and validates payload
4. **Data Extraction** → Extract movie data based on source (Letterboxd/Trakt/Generic)
5. **Movie Upsert** → Create new movie or find existing (by external ID or title/year)
6. **TMDB Enrichment** → Automatically enrich new movies with TMDB data
7. **Watch Record** → Create movie_watches record with rating/review
8. **Response** → Return success confirmation

### Source-Specific Extraction

#### Letterboxd Format
- **Title**: "Movie Title, Year" format
- **Rating**: ★★★★☆ (1-5 stars)
- **Review**: HTML content with rating
- **ID**: Extracted from letterboxd.com URLs

#### Trakt.tv Format
- **Title**: "Movie Title (Year)" or "Movie Title, Year"
- **Rating**: Numeric ratings (1-10 scale)
- **Review**: Plain text or HTML
- **ID**: Extracted from trakt.tv URLs or RSS GUID

#### Generic Format
- **Title**: "Movie Title (Year)" fallback
- **Rating**: Text-based rating extraction
- **Review**: Content field
- **ID**: GUID or URL-based

## External Integrations

### TMDB (The Movie Database)

**Purpose**: Automatic movie enrichment with posters, metadata, and additional information.

**API Configuration:**
```javascript
const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
```

**Enrichment Process:**
1. Search movie by title and year
2. Get detailed movie information
3. Extract poster URLs (w500 size)
4. Extract backdrop URLs (w1280 size)
5. Get plot summary and metadata
6. Find director from credits
7. Get genres and production info
8. Find YouTube trailer links

**Data Added:**
- `poster_url`: High-quality poster image
- `backdrop_url`: Widescreen backdrop image
- `tmdb_id`: TMDB identifier for future references
- `plot_summary`: Movie overview/synopsis
- `director`: Primary director name
- `genres`: Array of genre names
- `country`: Production country code
- `language`: Original language code
- `budget`: Production budget
- `box_office`: Box office revenue
- `trailer_url`: YouTube trailer link

### EchoFeed

**Purpose**: RSS-to-webhook service for monitoring Letterboxd and Trakt.tv feeds.

**Webhook Format:**
```json
{
  "item": {
    "title": "Movie Title, Year",
    "content": "Review content with rating",
    "link": "https://source.com/movie/link",
    "guid": "unique-identifier",
    "pubDate": "2024-01-15T10:30:00Z",
    "id": "tag:trakt.tv,2024:Movie/12345/watches/67890"
  }
}
```

### Trakt.tv API

**Purpose**: Historical data backfill and additional movie metadata.

**API Endpoints Used:**
- `/users/{username}/history/movies` - Watch history with timestamps
- `/users/{username}/watched/movies` - Watched movies with play counts
- `/users/{username}/ratings/movies` - Movie ratings

## Development Utilities

### movie-backfill.js
Imports historical data from Trakt.tv to populate the database.

**Usage:**
```bash
node movie-backfill.js history   # Import watch history with timestamps
node movie-backfill.js watched   # Import watched movies (basic)
node movie-backfill.js both      # Import both (recommended)
```

**Configuration:**
```javascript
const CONFIG = {
  traktApiKey: 'your-trakt-api-key',
  traktUsername: 'your-username',
  movieApiUrl: 'https://your-project.supabase.co/functions/v1/movies',
  maxMovies: 100
};
```

### tmdb-enricher.js
Batch enrichment tool for adding TMDB data to existing movies.

**Usage:**
```bash
node tmdb-enricher.js preview  # Show what will be enriched
node tmdb-enricher.js run      # Run the enrichment
```

**Configuration:**
```javascript
const CONFIG = {
  tmdbApiKey: 'your-tmdb-api-key',
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseKey: 'your-service-role-key',
  batchSize: 50,
  onlyMissingPosters: true
};
```

### delete-test-movies.js
Cleanup utility for removing test or duplicate records.

**Usage:**
```bash
node delete-test-movies.js  # Remove hardcoded test movie IDs
```

## Configuration

### Environment Variables

| Variable | Purpose | Required | Example |
|----------|---------|----------|---------|
| `SUPABASE_URL` | Supabase project URL | Yes | `https://abc123.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | Yes | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |
| `TMDB_API_KEY` | TMDB API key | Optional | `a1b2c3d4e5f6...` |

### Supabase Setup

1. **Create Tables**: The system expects `movies` and `movie_watches` tables with the schema defined above
2. **Enable RLS**: Row Level Security should be configured based on your access requirements
3. **API Keys**: Use service role key for server-side operations, anon key for client-side
4. **CORS**: Configure CORS settings for your domain in Supabase dashboard

### EchoFeed Setup

1. **Create Account**: Sign up at EchoFeed
2. **Add RSS Feeds**: Add Letterboxd and/or Trakt.tv RSS URLs
3. **Configure Webhook**: Point to your movie function endpoint
4. **Test**: Send test webhooks to verify connectivity

## Deployment

### Supabase Edge Function Deployment

```bash
# Deploy the movie function
supabase functions deploy movies --no-verify-jwt

# View function logs
supabase functions logs movies

# Test function locally
supabase functions serve movies
```

### Database Migrations

If you need to modify the database schema, create migration files:

```sql
-- Example: Add new column to movies table
ALTER TABLE movies ADD COLUMN runtime INTEGER;
```

### Function Configuration

The Edge Function runs with:
- **No JWT verification**: Required for webhook endpoints
- **CORS enabled**: Allows browser-based API calls
- **Deno runtime**: Modern JavaScript/TypeScript support

### Testing

```bash
# Test webhook endpoint
curl -X POST https://your-project.supabase.co/functions/v1/movies \
  -H "Content-Type: application/json" \
  -d '{"item": {"title": "Test Movie, 2023", "content": "★★★★☆", "link": "test"}}'

# Test API endpoints
curl https://your-project.supabase.co/functions/v1/movies/watches
curl https://your-project.supabase.co/functions/v1/movies/stats
```

## Error Handling

### Common Issues

1. **TMDB API Rate Limiting**: The system implements 250ms delays between requests
2. **Duplicate Movies**: Handled via external ID and title/year matching
3. **Invalid RSS Data**: Graceful fallbacks for malformed feed items
4. **Database Constraints**: Foreign key relationships properly enforced

### Debugging

- Use `/movies/debug` endpoint to inspect webhook payloads
- Check Supabase function logs for detailed error messages
- Verify environment variables are properly set
- Test TMDB API connectivity independently

This reference document should provide everything needed to understand, maintain, and extend the movie tracking API system.
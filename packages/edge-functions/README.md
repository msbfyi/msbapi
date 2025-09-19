# MSB Edge Functions

Supabase Edge Functions for the MSB Personal API that processes RSS feeds from
Letterboxd and Trakt.tv to automatically track movie watches, ratings, and
reviews.

## Features

- 🎬 **RSS Feed Processing** - Monitors Letterboxd and Trakt.tv RSS feeds via
  EchoFeed webhooks
- 🖼️ **TMDB Integration** - Automatic movie poster and metadata enrichment
- 📊 **Rich API** - RESTful endpoints for movies, watches, statistics, and
  search
- 🔄 **Data Backfill** - Import existing Trakt.tv watch history

## Quick Start

### 1. Environment Configuration

Create `.env` file in the project root:

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key

# Optional (for enrichment)
TMDB_API_KEY=your-tmdb-api-key

# Optional (for backfill)
TRAKT_API_KEY=your-trakt-api-key
TRAKT_USERNAME=your-trakt-username
```

### 2. Deploy Function

```bash
# From project root
npm run deploy:functions

# Or from this package
supabase functions deploy movies --no-verify-jwt
```

### 3. Setup RSS Monitoring

1. Sign up at [EchoFeed](https://echofeed.app)
2. Add your RSS feeds:
   - Letterboxd: `https://letterboxd.com/YOUR_USERNAME/rss/`
   - Trakt.tv: `https://trakt.tv/users/YOUR_USERNAME/history.rss`
3. Set webhook URL to your movie function endpoint

## API Endpoints

### Movies

- `GET /movies` - List movies with optional search/filtering
- `GET /movies/movie/{id}` - Get specific movie details
- `GET /movies/watches` - Recent movie watches
- `GET /movies/stats` - Watch statistics and insights

### Webhook

- `POST /movies` - EchoFeed webhook endpoint

### Admin

- `DELETE /movies/cleanup` - Cleanup movies (admin only)

## Development

### Local Development

```bash
# Serve functions locally
npm run dev

# Or directly with supabase
supabase functions serve movies
```

### View Logs

```bash
npm run logs

# Or directly
supabase functions logs movies
```

### Manual Testing

```bash
curl -X POST http://localhost:54321/functions/v1/movies \
  -H "Content-Type: application/json" \
  -d '{"item": {"title": "The Matrix, 1999", "content": "★★★★☆", "link": "test"}}'
```

## Required Services

### Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Get your project URL and service role key
3. Database tables are created automatically by the Edge Function

### TMDB (Optional)

1. Create account at [themoviedb.org](https://www.themoviedb.org)
2. Go to Settings > API and request an API key
3. Add `TMDB_API_KEY` to your `.env` file

### Trakt.tv (Optional)

1. Create application at
   [trakt.tv/oauth/applications](https://trakt.tv/oauth/applications)
2. Get your API key and add to `.env` file
3. Find your username in your Trakt.tv profile URL

### EchoFeed

1. Sign up at [echofeed.app](https://echofeed.app)
2. Add RSS feeds you want to monitor
3. Configure webhook to point to your Supabase function

## Database Schema

The function automatically creates these tables:

### `movies`

- Movie metadata (title, year, director, TMDB data)
- Deduplicated by external IDs and title+year

### `movie_watches`

- Individual watch records with ratings/reviews
- Links to movies table with source attribution

For detailed schema documentation, see
[Database Schema](../../docs/database/schema.md).

## Function Architecture

The main function (`supabase/functions/movies/index.ts`) handles:

1. **Webhook Processing**: EchoFeed RSS feed webhooks
2. **Data Extraction**: Movie title, year, rating, review from various sources
3. **TMDB Enrichment**: Automatic poster and metadata enhancement
4. **Database Operations**: Movie and watch record creation/updates
5. **API Endpoints**: RESTful API for data access

### Data Flow

1. User rates/reviews movie on Letterboxd/Trakt.tv
2. EchoFeed monitors RSS feed and sends webhook
3. Edge function extracts movie data and creates/updates records
4. TMDB enrichment adds poster URLs, plot summaries, etc.
5. Data is available via API endpoints

## Configuration

- Edge function runs without JWT verification to accept webhooks
- Database tables use UUIDs and include created_at/updated_at timestamps
- External IDs stored separately for each platform (letterboxd_id, trakt_id,
  tmdb_id)
- Watch metadata stored as JSONB for flexible source-specific data

## Error Handling

The function includes comprehensive error handling for:

- Invalid webhook payloads
- TMDB API failures
- Database connection issues
- Malformed RSS data

All errors are logged for debugging and monitoring.

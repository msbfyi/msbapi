# MSB Movie API

A movie tracking API built with Supabase Edge Functions that processes RSS feeds from Letterboxd and Trakt.tv to automatically track movie watches, ratings, and reviews.

## Features

- 🎬 **RSS Feed Processing** - Monitors Letterboxd and Trakt.tv RSS feeds via EchoFeed webhooks
- 🖼️ **TMDB Integration** - Automatic movie poster and metadata enrichment
- 📊 **Rich API** - RESTful endpoints for movies, watches, statistics, and search
- 🔄 **Data Backfill** - Import existing Trakt.tv watch history
- 🌐 **Demo Website** - 11ty-powered movie tracking website

## Quick Start

### 1. Clone & Setup

```bash
git clone https://github.com/your-username/msb-api.git
cd msb-api
npm install
```

### 2. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
MOVIE_API_URL=https://your-project.supabase.co/functions/v1/movies

# Optional (for enrichment)
TMDB_API_KEY=your-tmdb-api-key

# Optional (for backfill)
TRAKT_API_KEY=your-trakt-api-key
TRAKT_USERNAME=your-trakt-username
```

### 3. Deploy Supabase Function

```bash
# Install Supabase CLI
npm install -g supabase

# Deploy the movie function
supabase functions deploy movies --no-verify-jwt
```

### 4. Setup RSS Monitoring

1. Sign up at [EchoFeed](https://echofeed.app)
2. Add your RSS feeds:
   - Letterboxd: `https://letterboxd.com/YOUR_USERNAME/rss/`
   - Trakt.tv: `https://trakt.tv/users/YOUR_USERNAME/history.rss`
3. Set webhook URL to your movie function endpoint

## API Endpoints

### Movies
- `GET /movies` - List movies with optional search/filtering
- `GET /movies/watches` - Recent movie watches
- `GET /movies/stats` - Watch statistics and insights

### Webhook
- `POST /movies` - EchoFeed webhook endpoint

## Scripts

### Test Configuration
```bash
npm run tmdb-test
```

### Backfill Trakt Data
```bash
npm run movie-backfill history    # Import watch history with timestamps
npm run movie-backfill watched    # Import basic watched movies
npm run movie-backfill both       # Recommended: import both
```

### Enrich with TMDB Data
```bash
npm run tmdb-enricher preview     # Preview what will be enriched
npm run tmdb-enricher run         # Run the enrichment
```

## Demo Website

```bash
cd demo
npm install
npm start
```

Visit `http://localhost:8080` to see your movie tracking website.

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
1. Create application at [trakt.tv/oauth/applications](https://trakt.tv/oauth/applications)
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

## Development

### Local Function Development
```bash
supabase functions serve movies
```

### View Function Logs
```bash
supabase functions logs movies
```

### Manual Testing
```bash
curl -X POST http://localhost:54321/functions/v1/movies \
  -H "Content-Type: application/json" \
  -d '{"item": {"title": "The Matrix, 1999", "content": "★★★★☆", "link": "test"}}'
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- 📖 [Detailed Setup Guide](docs/movies/setup_guide.md)
- 🎨 [TMDB Integration Guide](docs/movies/tmdb-integration-setup-guide.md)
- 🔄 [Backfill Guide](docs/movies/movie-backfill_guide.md)
- 📚 [System Reference](docs/movies/SYSTEM_REFERENCE.md)
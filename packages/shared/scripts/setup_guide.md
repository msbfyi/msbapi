# Movie Tracking System Setup Guide

## Overview

This system tracks movies from RSS feeds (Letterboxd, Trakt.tv, etc.) using
EchoFeed webhooks and stores them in dedicated movie tables.

## Step 1: Database Setup

### 1.1 Create New Tables

In your Supabase SQL Editor, run the movie schema:

```sql
-- Copy and paste the entire movie schema from the artifact above
-- This creates: movies, movie_watches, movie_people, movie_lists tables
```

### 1.2 Verify Tables

```sql
-- Check tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'movie%';

-- Check sample data
SELECT * FROM movies;
```

## Step 2: Deploy Movie Edge Function

### 2.1 Create Function

```bash
# Create new movie function
supabase functions new movies

# Copy the movie function code to supabase/functions/movies/index.ts
```

### 2.2 Deploy Function

```bash
# Deploy without JWT verification (needed for webhooks)
supabase functions deploy movies --no-verify-jwt
```

### 2.3 Test Function

```bash
# Test basic endpoint
curl https://your-project.supabase.co/functions/v1/movies

# Expected response: {"message":"Movie API is running!",...}
```

## Step 3: EchoFeed Setup

### 3.1 Sign Up for EchoFeed

1. Go to [echofeed.app](https://echofeed.app)
2. Create a free account
3. You get 1 echo (feed connection) for free

### 3.2 Add Your Movie Feed

1. **Click "New Echo"**
2. **Add Feed URL** - Examples:
   - Letterboxd: `https://letterboxd.com/YOUR_USERNAME/rss/`
   - Trakt.tv: `https://trakt.tv/users/YOUR_USERNAME/history.rss`
   - Other movie RSS feeds

3. **Choose Service: "Web Request / Webhook"**
4. **Configure Webhook:**
   - **URL:** `https://your-project.supabase.co/functions/v1/movies`
   - **Method:** `POST`

### 3.3 Test Configuration

EchoFeed will automatically start monitoring your feed. When you rate/review a
movie, it will send a webhook to your function.

## Step 4: Test the Integration

### 4.1 Manual Test

Test your webhook endpoint manually:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/movies \
  -H "Content-Type: application/json" \
  -d '{
    "item": {
      "title": "The Matrix, 1999",
      "content": "★★★★★ Amazing sci-fi movie about reality and choice.",
      "link": "https://letterboxd.com/test/film/the-matrix/",
      "guid": "letterboxd-123456",
      "pubDate": "2024-01-15T20:30:00Z"
    }
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Successfully processed movie: The Matrix",
  "result": {
    "movie": { "id": "...", "title": "The Matrix", "year": 1999 },
    "watch": { "id": "...", "personal_rating": 5 },
    "action": "movie_watch_recorded"
  }
}
```

### 4.2 Verify Database

```sql
-- Check if movie was created
SELECT * FROM movies WHERE title = 'The Matrix';

-- Check if watch was recorded
SELECT
  mw.*,
  m.title,
  m.year
FROM movie_watches mw
JOIN movies m ON mw.movie_id = m.id
ORDER BY mw.watched_at DESC
LIMIT 5;
```

### 4.3 Test API Endpoints

```bash
# Get movies list
curl https://your-project.supabase.co/functions/v1/movies

# Get recent watches
curl https://your-project.supabase.co/functions/v1/movies/watches

# Get movie stats
curl https://your-project.supabase.co/functions/v1/movies/stats
```

## Step 5: Real Movie Activity

### 5.1 Letterboxd Integration

1. **Get your Letterboxd RSS:**
   - Go to letterboxd.com/YOUR_USERNAME/rss/
   - Copy this URL

2. **Add to EchoFeed:**
   - Feed: `https://letterboxd.com/YOUR_USERNAME/rss/`
   - Service: Web Request
   - URL: Your movie function URL

3. **Test by rating a movie on Letterboxd**
   - The webhook should trigger within 15 minutes
   - Check your database for the new entry

### 5.2 Trakt.tv Integration

1. **Get your Trakt RSS:**
   - Go to trakt.tv/users/YOUR_USERNAME/history.rss
   - Copy this URL

2. **Add as second Echo (paid plans)**
   - Or replace the Letterboxd feed temporarily

## Step 6: Monitor and Debug

### 6.1 Check Function Logs

1. Go to Supabase Dashboard
2. Navigate to Edge Functions → movies
3. Check the Logs tab for webhook activity

### 6.2 Check EchoFeed Status

1. In EchoFeed dashboard
2. Check your echo status
3. Look for error messages

### 6.3 Common Issues

**Issue: 404 Not Found**

- Check function is deployed: `supabase functions list`
- Verify URL is correct

**Issue: 500 Internal Error**

- Check function logs in Supabase
- Verify database tables exist

**Issue: No webhooks received**

- Check EchoFeed echo is active
- Verify RSS feed has new content
- EchoFeed checks feeds every 15 minutes

## Step 7: Customize for Your Needs

### 7.1 Add More Sources

The function supports multiple movie sources:

- Letterboxd (star ratings 1-5)
- Trakt.tv (ratings 1-10)
- Generic RSS feeds

### 7.2 Enhance Movie Data

Add external API calls to enrich movie data:

```javascript
// In the movie function, add TMDB API calls
async function enrichMovieData(movieData) {
  // Call TMDB API to get poster, plot, etc.
  // Update movie record with rich data
}
```

### 7.3 Add Poster Updates

Create a separate function to fetch posters from TMDB or other sources.

## Step 8: Build Your Movie Website

### 8.1 API Client

```javascript
class MovieAPI {
  constructor(baseUrl) {
    this.baseUrl = baseUrl
  }

  async getMovies(limit = 50) {
    const response = await fetch(`${this.baseUrl}/movies?limit=${limit}`)
    return response.json()
  }

  async getRecentWatches(limit = 20) {
    const response = await fetch(
      `${this.baseUrl}/movies/watches?limit=${limit}`
    )
    return response.json()
  }

  async getStats() {
    const response = await fetch(`${this.baseUrl}/movies/stats`)
    return response.json()
  }
}

// Usage
const movieAPI = new MovieAPI(
  'https://your-project.supabase.co/functions/v1/movies'
)
const recentWatches = await movieAPI.getRecentWatches(10)
```

### 8.2 Simple HTML Page

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Movie Tracking</title>
  </head>
  <body>
    <h1>Recent Movie Watches</h1>
    <div id="movies"></div>

    <script>
      const API_URL = 'https://your-project.supabase.co/functions/v1/movies'

      fetch(`${API_URL}/watches?limit=10`)
        .then(r => r.json())
        .then(data => {
          const html = data.watches
            .map(
              watch => `
                    <div>
                        <h3>${watch.movies.title} (${watch.movies.year})</h3>
                        <p>Rating: ${watch.personal_rating}/5</p>
                        <p>Watched: ${new Date(watch.watched_at).toLocaleDateString()}</p>
                        ${watch.review_text ? `<p>${watch.review_text}</p>` : ''}
                    </div>
                `
            )
            .join('')
          document.getElementById('movies').innerHTML = html
        })
    </script>
  </body>
</html>
```

## Next Steps

1. **Test with real movie activity** - Rate a movie on Letterboxd/Trakt
2. **Monitor the webhook logs** - Ensure data is flowing correctly
3. **Build your movie website** - Display your movie data
4. **Add more media types** - Create similar systems for TV shows, books, games
5. **Enhance with external APIs** - Fetch posters, plots, cast info from TMDB

## Troubleshooting

**Webhook not triggering:**

- Verify feed has new content
- Check EchoFeed echo is active
- Ensure function URL is correct

**Database errors:**

- Check all tables were created
- Verify foreign key relationships
- Check for typos in SQL

**Function errors:**

- Check Supabase function logs
- Verify environment variables are set
- Test with manual curl request

Your movie tracking system is now ready! 🎬

# Automatic TMDB Enrichment Setup

## Overview

This upgrade makes your movie function **automatically enrich new movies** with
TMDB data when they're added via webhooks. No more manual enrichment scripts!

## What Changes

### **Before (Manual)**

1. Movie added via webhook → basic data only
2. Run `tmdb-enricher.js` script manually
3. Movies get posters/metadata

### **After (Automatic)**

1. Movie added via webhook → **automatic TMDB lookup**
2. Movie stored with posters, plot, director, etc.
3. **No manual steps needed!**

## Setup Instructions

### Step 1: Add TMDB API Key to Supabase

1. **Go to Supabase Dashboard**
2. **Navigate to Settings → Edge Functions → Environment Variables**
3. **Add new variable:**
   ```
   Name: TMDB_API_KEY
   Value: your-tmdb-api-key-here
   ```
4. **Click "Save"**

### Step 2: Deploy Updated Function

1. **Replace your movie function** with the auto-enriching version above
2. **Deploy the update:**
   ```bash
   supabase functions deploy movies --no-verify-jwt
   ```

### Step 3: Test Automatic Enrichment

#### Option A: Rate a Movie on Letterboxd/Trakt

1. **Rate a new movie** on Letterboxd or Trakt.tv
2. **Wait 15 minutes** (EchoFeed polling interval)
3. **Check your database** - movie should have poster_url, plot_summary, etc.

#### Option B: Manual Test

```bash
# Test with a known movie
curl -X POST https://your-project.supabase.co/functions/v1/movies \
  -H "Content-Type: application/json" \
  -d '{
    "item": {
      "title": "The Dark Knight, 2008",
      "content": "★★★★★ Amazing Batman movie!",
      "link": "https://letterboxd.com/test/film/the-dark-knight/",
      "guid": "test-dark-knight",
      "pubDate": "2024-01-15T20:30:00Z"
    }
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Successfully processed movie: The Dark Knight",
  "enriched": true,
  "result": {
    "movie": {
      "id": "...",
      "title": "The Dark Knight",
      "year": 2008,
      "poster_url": "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
      "plot_summary": "Batman raises the stakes...",
      "director": "Christopher Nolan"
    }
  }
}
```

### Step 4: Verify Database

```sql
-- Check recently added movies have TMDB data
SELECT
  title,
  year,
  CASE WHEN poster_url IS NOT NULL THEN '✅' ELSE '❌' END as has_poster,
  CASE WHEN plot_summary IS NOT NULL THEN '✅' ELSE '❌' END as has_plot,
  CASE WHEN director IS NOT NULL THEN '✅' ELSE '❌' END as has_director,
  created_at
FROM movies
ORDER BY created_at DESC
LIMIT 10;
```

## How It Works

### **Smart Enrichment Logic**

1. **New Movie**: Automatically gets TMDB data during creation
2. **Existing Movie**: Only enriched if missing poster/metadata
3. **Failed Lookup**: Movie still created with basic data (no failure)
4. **Rate Limited**: Gracefully handles TMDB API limits

### **Fallback Behavior**

- **No TMDB API Key**: Functions normally without enrichment
- **TMDB API Down**: Movies still created with basic data
- **Movie Not Found**: Stored without TMDB data (can enrich later)

## Benefits

### **✅ Automatic**

- New movies get posters immediately
- No manual enrichment needed
- Always up-to-date movie data

### **✅ Robust**

- Handles API failures gracefully
- Doesn't break if TMDB is down
- Smart caching for existing movies

### **✅ Efficient**

- Only enriches new/missing movies
- Respects TMDB rate limits
- Minimal performance impact

## Monitoring

### Check Function Logs

1. **Go to Supabase Dashboard**
2. **Edge Functions → movies → Logs**
3. **Look for TMDB-related messages:**
   ```
   ✅ "TMDB enrichment added: poster_url, director, plot_summary"
   ⚠️ "Movie not found on TMDB: Obscure Film (1987)"
   ℹ️ "TMDB_API_KEY not set, skipping enrichment"
   ```

### API Response Indicators

```json
{
  "success": true,
  "enriched": true,  // ← This tells you if TMDB enrichment worked
  "result": { ... }
}
```

## Migration Strategy

### For Existing Movies

Your existing movies **won't automatically get enriched**. You have options:

#### Option A: Manual Script (One-time)

```bash
# Run the standalone enricher for existing movies
node tmdb-enricher.js run
```

#### Option B: Gradual Enrichment

- Existing movies get enriched when you interact with them
- If you rate an existing movie again, it will get enriched

#### Option C: Database Trigger

```sql
-- Force re-enrichment for specific movies
UPDATE movies
SET poster_url = NULL
WHERE poster_url IS NULL AND created_at < NOW() - INTERVAL '1 day';

-- Then rate those movies again to trigger enrichment
```

## Troubleshooting

### Issue: Movies Not Getting Enriched

**Check:**

1. TMDB_API_KEY is set in Supabase environment variables
2. Function logs show TMDB requests
3. Movie title/year are correct for TMDB search

**Test manually:**

```bash
# Check if API key works
curl "https://api.themoviedb.org/3/search/movie?api_key=YOUR_KEY&query=matrix"
```

### Issue: Some Movies Not Found

**Solution:** Some movies have different titles on TMDB:

- "The Matrix" vs "Matrix"
- International titles
- Alternative release years

The system handles this gracefully - movies are still created without TMDB data.

### Issue: Rate Limiting

TMDB allows **40 requests per 10 seconds**. The function includes delays, but
with heavy usage:

**Solution:** The system queues requests and handles rate limits automatically.

## Performance Impact

### **Minimal Overhead**

- Adds ~1-2 seconds per new movie
- Only runs for new/missing movies
- Webhook still responds quickly

### **Async Option (Advanced)**

For high-volume usage, you could make enrichment async:

```javascript
// Store basic movie first, enrich in background
const movie = await createBasicMovie(movieData)
enrichMovieAsync(movie.id) // Background job
return movie
```

## Configuration Options

### Customize Image Sizes

In the function, adjust:

```javascript
const POSTER_SIZE = 'w500' // w92, w154, w185, w342, w500, w780, original
const BACKDROP_SIZE = 'w1280' // w300, w780, w1280, original
```

### Disable for Testing

```javascript
// Temporarily disable TMDB enrichment
const ENABLE_TMDB = false
```

## Success Metrics

After enabling automatic enrichment:

```sql
-- Check enrichment success rate
SELECT
  COUNT(*) as total_movies,
  COUNT(poster_url) as movies_with_posters,
  ROUND(COUNT(poster_url) * 100.0 / COUNT(*), 1) as poster_coverage_percent
FROM movies
WHERE created_at > NOW() - INTERVAL '7 days';
```

**Target:** 85%+ of new movies should get TMDB enrichment automatically.

Your movie system now **automatically creates beautiful, data-rich movies**
every time someone rates a film! 🎬✨

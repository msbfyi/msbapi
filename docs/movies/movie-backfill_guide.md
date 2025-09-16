# Movie Backfill Setup Guide

## Prerequisites

1. **Movie system deployed** (movie schema + movie edge function)
2. **Trakt.tv API credentials** 
3. **Node.js 18+** installed

## Step 1: Get Trakt.tv API Credentials

### Create Trakt.tv Application

1. Go to **https://trakt.tv/oauth/applications**
2. Click **"New Application"**
3. Fill out the form:
   ```
   Name: Movie Backfill
   Description: Backfill script for personal movie API
   Website: https://your-domain.com (optional)
   Redirect URI: urn:ietf:wg:oauth:2.0:oob
   ```
4. Click **"Save App"**
5. Copy your **Client ID** (this is your API key)

### Find Your Username

- Your username is in your Trakt.tv profile URL: `https://trakt.tv/users/YOUR_USERNAME`

## Step 2: Setup the Backfill Script

### 2.1 Create Project Directory

```bash
mkdir movie-backfill
cd movie-backfill
npm init -y
```

### 2.2 Save the Script

Save the backfill script as `movie-backfill.js`

### 2.3 Update Configuration

Edit the CONFIG section at the top of `movie-backfill.js`:

```javascript
const CONFIG = {
  traktApiKey: 'your-actual-trakt-client-id',     // From trakt.tv/oauth/applications
  traktUsername: 'your-trakt-username',           // Your Trakt.tv username
  movieApiUrl: 'https://your-project.supabase.co/functions/v1/movies', // Your movie API
  maxMovies: 100 // Start with 100, increase later
};
```

## Step 3: Run the Backfill

### 3.1 Backfill Modes

The script supports three modes:

| Mode | Description | Use Case |
|------|-------------|----------|
| `history` | Detailed watch history with timestamps | Most accurate, includes rewatches |
| `watched` | Basic watched movies list | Faster, less detailed |
| `both` | Run both methods | **Recommended** - most complete data |

### 3.2 Start with Small Test

```bash
# Test with 10 movies first
# Edit CONFIG.maxMovies = 10 in the script

# Run history mode (recommended)
node movie-backfill.js history
```

**Expected output:**
```
🎬 Starting Trakt.tv movie backfill process...
ℹ️ [timestamp] Testing Trakt.tv connection...
✅ [timestamp] ✓ Connected to Trakt! User: Your Name (@username)
ℹ️ [timestamp] Testing Movie API connection...
✅ [timestamp] ✓ Movie API is accessible
ℹ️ [timestamp] Fetching movie ratings...
ℹ️ [timestamp] Found 45 movie ratings
ℹ️ [timestamp] Fetching movie watch history...
ℹ️ [timestamp] Found 87 movie watches in history
✅ [timestamp] ✓ Processed: The Matrix (1999) - 2024-01-15T20:30:00Z
✅ [timestamp] ✓ Processed: Inception (2010) - 2024-01-14T19:15:00Z
...
🎉 Movie backfill completed successfully!
📊 Final Stats:
   Movies Processed: 10
   Watches Added: 10
   Errors: 0
   Duration: 8 seconds
```

### 3.3 Verify Database

Check your Supabase database:

```sql
-- Check movies were created
SELECT COUNT(*) as movie_count FROM movies;

-- Check watches were recorded
SELECT COUNT(*) as watch_count FROM movie_watches;

-- See recent movies
SELECT 
  m.title,
  m.year,
  mw.watched_at,
  mw.personal_rating,
  mw.source
FROM movies m
JOIN movie_watches mw ON m.id = mw.movie_id
ORDER BY mw.watched_at DESC
LIMIT 10;
```

### 3.4 Full Backfill

Once the test works, run the full backfill:

```bash
# Update CONFIG.maxMovies = 500 (or remove limit)
# Run both modes for complete data
node movie-backfill.js both
```

## Step 4: Monitor Progress

### 4.1 Watch the Logs

The script provides detailed logging:
- ✅ Successful movie processing
- ❌ Errors with specific details
- ⚠️ Warnings and skipped items
- ℹ️ Progress updates every 10 items

### 4.2 Handle Errors

**Common issues and solutions:**

| Error | Solution |
|-------|----------|
| `401 Unauthorized` | Check your Trakt API key |
| `404 User not found` | Verify your Trakt username |
| `500 Movie API Error` | Check your movie function is deployed |
| `Rate limited` | Script has built-in delays, just wait |

### 4.3 Resume Failed Backfills

The script tracks processed movies to avoid duplicates. If it fails partway through, just run it again - it will skip already processed items.

## Step 5: Validate Results

### 5.1 Check via API

```bash
# Get movies via your API
curl https://your-project.supabase.co/functions/v1/movies

# Get recent watches
curl https://your-project.supabase.co/functions/v1/movies/watches

# Get movie stats
curl https://your-project.supabase.co/functions/v1/movies/stats
```

### 5.2 Verify Data Quality

```sql
-- Check for movies without years
SELECT title, year FROM movies WHERE year IS NULL;

-- Check rating distribution
SELECT 
  personal_rating,
  COUNT(*) as count
FROM movie_watches 
WHERE personal_rating IS NOT NULL
GROUP BY personal_rating
ORDER BY personal_rating;

-- Check sources
SELECT source, COUNT(*) as count
FROM movie_watches
GROUP BY source;
```

## Step 6: Cleanup and Optimization

### 6.1 Remove Duplicates (if any)

```sql
-- Find potential duplicates
SELECT title, year, COUNT(*) as count
FROM movies
GROUP BY title, year
HAVING COUNT(*) > 1;
```

### 6.2 Add External IDs

The backfill script adds `trakt_id` to movies. You can later enhance this with:
- TMDB IDs for poster/metadata fetching
- IMDB IDs for cross-referencing
- Letterboxd IDs for linking reviews

## Step 7: Set Up Real-Time Sync

After backfill is complete, set up EchoFeed for ongoing sync:

1. **Sign up for EchoFeed** at echofeed.app
2. **Add your Trakt RSS feed:** `https://trakt.tv/users/YOUR_USERNAME/history.rss`
3. **Configure webhook** to your movie API URL
4. **Test** by rating a new movie on Trakt.tv

## Advanced Usage

### Custom Date Ranges

Modify the script to backfill specific time periods:

```javascript
// In getMovieHistory() method, add date filtering
let endpoint = `/users/${this.config.traktUsername}/history/movies`;
endpoint += `?start_at=2023-01-01&end_at=2023-12-31`; // 2023 only
```

### Multiple Sources

Run separate backfills for different sources:

```javascript
// Modify transformTraktMovie to set different sources
const CONFIG_LETTERBOXD = {
  ...CONFIG,
  source: 'letterboxd-backfill'
};
```

### Batch Processing

For large collections (1000+ movies), consider running in smaller batches:

```bash
# Process in chunks
node movie-backfill.js history # First 500
# Edit maxMovies, run again
node movie-backfill.js history # Next 500
```

## Troubleshooting

### Script Hangs

- Check internet connection
- Verify Trakt.tv API is accessible
- Increase request delay in script

### Missing Movies

- Some movies might not have proper metadata
- Check Trakt.tv privacy settings
- Verify movies are marked as "watched" not just "collected"

### Performance

- Adjust `requestDelay` for faster/slower processing
- Use `history` mode for most complete data
- Use `watched` mode for faster backfill

Your movie backfill is now ready! 🎬
# TMDB Integration Setup Guide

## Overview

This adds **The Movie Database (TMDB)** integration to enrich your movies with:
- 🖼️ **High-quality posters** and backdrops  
- 🎬 **Rich metadata**: plot summaries, directors, cast
- 💰 **Box office data**: budget and revenue
- 🎭 **Genres** and other details
- 🎥 **Trailer links** from YouTube

## Step 1: Get TMDB API Key

### 1.1 Create TMDB Account

1. Go to **https://www.themoviedb.org/**
2. Click **"Join TMDB"** and create a free account
3. Verify your email address

### 1.2 Request API Key

1. **Go to your account settings**: https://www.themoviedb.org/settings/api
2. **Click "Create" under API section**
3. **Choose "Developer"** 
4. **Fill out the form:**
   ```
   Application Name: Personal Movie Collection
   Application URL: https://your-domain.com (or localhost)
   Application Summary: Personal movie tracking and collection management
   ```
5. **Accept terms and submit**
6. **Copy your "API Key (v3 auth)"** - this is what you need

## Step 2: Configure the Enricher

### 2.1 Update Configuration

Save the TMDB enricher script as `tmdb-enricher.js` and update the config:

```javascript
const CONFIG = {
  tmdbApiKey: 'your-actual-tmdb-api-key',        // From TMDB settings
  supabaseUrl: 'https://your-project.supabase.co', // Your Supabase URL  
  supabaseKey: 'your-service-role-key',          // From Supabase settings
  batchSize: 50,                                 // Process 50 movies at a time
  imageSize: 'w500',                             // Good balance of quality/size
  backdropSize: 'w1280',                         // High quality backdrops
  updateExisting: false,                         // Don't update movies that have posters
  onlyMissingPosters: true                       // Only enrich movies without posters
};
```

### 2.2 Configuration Options

| Option | Values | Description |
|--------|--------|-------------|
| `imageSize` | `w92, w154, w185, w342, w500, w780, original` | Poster size |
| `backdropSize` | `w300, w780, w1280, original` | Backdrop size |
| `updateExisting` | `true/false` | Update movies that already have data |
| `onlyMissingPosters` | `true/false` | Only process movies without posters |

## Step 3: Preview and Run

### 3.1 Preview What Will Be Enriched

```bash
# See what movies will be processed
node tmdb-enricher.js preview
```

**Expected output:**
```
🔍 Previewing movies that will be enriched...

📋 Sample of 10 movies to be enriched:
   📝 The Matrix (1999)
   📝 Inception (2010)  
   📝 Pulp Fiction (1994)
   🖼️ The Dark Knight (2008)  # Already has poster
   📝 Goodfellas (1990)
   ... and 45 more movies

📊 Summary:
   Total movies to enrich: 55
   Estimated time: 5 minutes
   API calls needed: ~110
```

### 3.2 Run the Enrichment

```bash
# Start the enrichment process
node tmdb-enricher.js run
```

**Expected output:**
```
🎨 Starting TMDB movie enrichment process...
✅ TMDB API connection successful
✅ Supabase connection successful
ℹ️ Found 55 movies to enrich
ℹ️ Will process 55 movies in 2 batches
ℹ️ Processing batch 1: 1-50 of 55
ℹ️ Enriching: The Matrix (1999)
✅ ✓ Enriched: The Matrix - poster_url, backdrop_url, plot_summary, director
ℹ️ Enriching: Inception (2010)
✅ ✓ Enriched: Inception - poster_url, backdrop_url, plot_summary, director, trailer_url
...
🎉 TMDB enrichment completed successfully!
🎨 Final Stats:
   Movies Processed: 55
   Movies Enriched: 52
   Posters Added: 52
   Backdrops Added: 45
   Metadata Updated: 50
   Movies Not Found: 3
   Errors: 0
   Duration: 67 seconds
```

## Step 4: Verify Enriched Data

### 4.1 Check Database

```sql
-- See enriched movies
SELECT 
  title,
  year,
  director,
  CASE WHEN poster_url IS NOT NULL THEN '✅' ELSE '❌' END as has_poster,
  CASE WHEN plot_summary IS NOT NULL THEN '✅' ELSE '❌' END as has_plot
FROM movies 
ORDER BY updated_at DESC 
LIMIT 10;

-- Check image URLs
SELECT title, year, poster_url, backdrop_url 
FROM movies 
WHERE poster_url IS NOT NULL 
LIMIT 5;
```

### 4.2 Test via API

```bash
# Get enriched movies via API
curl https://your-project.supabase.co/functions/v1/movies | jq '.movies[0]'
```

You should see rich data like:
```json
{
  "id": "...",
  "title": "The Matrix",
  "year": 1999,
  "director": "The Wachowskis",
  "poster_url": "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
  "backdrop_url": "https://image.tmdb.org/t/p/w1280/fNG7i7RqMErkcqhohV2a6cV1Ehy.jpg",
  "plot_summary": "Set in the 22nd century, The Matrix tells the story of...",
  "genres": ["Action", "Science Fiction"],
  "budget": 63000000,
  "box_office": 463517383,
  "trailer_url": "https://www.youtube.com/watch?v=vKQi3bBA1y8"
}
```

## Step 5: Handle Edge Cases

### 5.1 Movies Not Found

Some movies might not be found on TMDB due to:
- **Title variations**: "The Matrix" vs "Matrix, The"
- **Alternative titles**: International releases
- **Year mismatches**: Different release dates

**Solutions:**
```bash
# Check which movies weren't found
SELECT title, year FROM movies WHERE poster_url IS NULL;

# Manually update if needed
UPDATE movies 
SET tmdb_id = '603' 
WHERE title = 'The Matrix' AND year = 1999;

# Re-run enricher for specific movies
```

### 5.2 Update Existing Data

To update movies that already have posters:

```javascript
// In CONFIG
updateExisting: true,
onlyMissingPosters: false
```

### 5.3 Different Image Sizes

For different use cases:

```javascript
// High quality for movie detail pages
imageSize: 'w780',
backdropSize: 'original'

// Smaller for thumbnails/lists  
imageSize: 'w185',
backdropSize: 'w780'
```

## Step 6: Update Your Website

### 6.1 Display Posters

```html
<!-- Movie card with poster -->
<div class="movie-card">
  <img src="${movie.poster_url}" alt="${movie.title} poster" />
  <h3>${movie.title} (${movie.year})</h3>
  <p>Director: ${movie.director}</p>
  <p>${movie.plot_summary}</p>
</div>
```

### 6.2 Movie Detail Page

```html
<!-- Full movie page with backdrop -->
<div class="movie-detail" style="background-image: url(${movie.backdrop_url})">
  <div class="movie-content">
    <img src="${movie.poster_url}" class="poster" />
    <div class="movie-info">
      <h1>${movie.title} (${movie.year})</h1>
      <p class="director">Directed by ${movie.director}</p>
      <p class="genres">${movie.genres.join(', ')}</p>
      <p class="plot">${movie.plot_summary}</p>
      ${movie.trailer_url ? `<a href="${movie.trailer_url}">Watch Trailer</a>` : ''}
    </div>
  </div>
</div>
```

### 6.3 Enhanced API Client

```javascript
// Add to your MovieAPI class
async getMovieDetails(movieId) {
  return this.request(`/movies/${movieId}`);
}

async getMoviesWithPosters(limit = 20) {
  const movies = await this.getMovies({ limit });
  return {
    ...movies,
    movies: movies.movies.filter(m => m.poster_url)
  };
}
```

## Step 7: Advanced Features

### 7.1 Scheduled Enrichment

Set up automatic enrichment for new movies:

```javascript
// Add to your movie function webhook handler
async function enrichNewMovie(movieId) {
  // Call TMDB enricher for single movie
  // Run after creating movie from Trakt/Letterboxd
}
```

### 7.2 Image Optimization

For better performance:

```javascript
// Multiple sizes for responsive images
const posterSizes = {
  thumb: 'w154',
  small: 'w185', 
  medium: 'w342',
  large: 'w500',
  xlarge: 'w780'
};

// Generate multiple URLs
function getPosterUrls(posterPath) {
  return Object.fromEntries(
    Object.entries(posterSizes).map(([size, width]) => [
      size, 
      `https://image.tmdb.org/t/p/${width}${posterPath}`
    ])
  );
}
```

### 7.3 Cast and Crew

The enricher can be extended to store cast/crew in the `movie_people` table:

```javascript
// In extractEnrichedData function
if (tmdbDetails?.credits?.cast) {
  const mainCast = tmdbDetails.credits.cast.slice(0, 10);
  // Store in movie_people table
}
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `401 Unauthorized` | Check TMDB API key is correct |
| `429 Rate Limited` | Script handles this automatically |
| `Movie not found` | Check title spelling and year |
| `No posters showing` | Verify image URLs are accessible |

### Performance Tips

- Start with `batchSize: 25` for first run
- Use `onlyMissingPosters: true` to avoid re-processing
- Run during off-peak hours for large collections
- Consider running in chunks for 500+ movies

### Image Loading

```css
/* Graceful image loading */
.movie-poster {
  background-color: #f0f0f0;
  background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQi...');
  background-size: 50px 50px;
  background-repeat: no-repeat;
  background-position: center;
}

.movie-poster img {
  width: 100%;
  height: auto;
  transition: opacity 0.3s;
}
```

Your movie collection now has beautiful visuals and rich metadata! 🎬✨
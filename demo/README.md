# Movie Tracker Demo

An 11ty-based demo application that displays movies in order of last viewed,
featuring movie posters and watch details.

## Features

- **Recent Watches**: Movies displayed in chronological order (most recent
  first)
- **Movie Posters**: Automatic poster loading with fallback placeholders
- **Watch Details**: Ratings, reviews, and watch dates
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Graceful degradation when API is unavailable

## Setup

### 1. Install Dependencies

```bash
cd demo
npm install
```

### 2. Configure API URL

Set your Supabase function URL as an environment variable:

```bash
export MOVIE_API_URL="https://your-project.supabase.co/functions/v1/movies"
```

Or create a `.env` file in the demo directory:

```
MOVIE_API_URL=https://your-project.supabase.co/functions/v1/movies
```

### 3. Run the Demo

```bash
# Development server with live reload
npm start

# Build static files
npm run build
```

The demo will be available at `http://localhost:8080`

## File Structure

```
demo/
├── src/
│   ├── _data/
│   │   └── movies.js          # Fetches movie data from API
│   ├── _includes/
│   │   └── layout.html        # Base HTML layout
│   ├── css/
│   │   └── styles.css         # Styling for movie grid
│   └── index.html             # Main movie listing page
├── movie-api.js               # API client (Node.js version)
├── package.json               # Dependencies and scripts
├── .eleventy.js               # 11ty configuration
└── README.md                  # This file
```

## How It Works

1. **Data Fetching**: The `src/_data/movies.js` file runs at build time to fetch
   recent movie watches from your API
2. **Template Rendering**: 11ty processes the `index.html` template with the
   movie data
3. **Poster URLs**: The API client generates poster URLs using TMDB IDs when
   available, with fallback placeholders
4. **Static Generation**: 11ty builds a static site that can be deployed
   anywhere

## API Integration

The demo uses the `getRecentWatches()` method to fetch movies ordered by watch
date. The API response should include:

```javascript
{
  "watches": [
    {
      "id": "uuid",
      "watched_at": "2023-12-01T10:30:00Z",
      "personal_rating": 4,
      "review_text": "Great movie!",
      "source_url": "https://letterboxd.com/...",
      "movies": {
        "id": "uuid",
        "title": "Movie Title",
        "year": 2023,
        "director": "Director Name",
        "tmdb_id": "12345",
        "poster_path": "/poster.jpg"
      }
    }
  ],
  "count": 25
}
```

## Customization

### Styling

Edit `src/css/styles.css` to customize the appearance:

- **Grid Layout**: Modify `.movies-grid` for different poster arrangements
- **Card Design**: Update `.movie-card` styles for different card appearances
- **Colors**: Change the color scheme in the CSS variables

### Data

Modify `src/_data/movies.js` to:

- Change the number of movies displayed (`limit` parameter)
- Add filtering or sorting logic
- Include additional API endpoints

### Template

Update `src/index.html` to:

- Change the movie card layout
- Add or remove movie information fields
- Modify the grid structure

## Deployment

The demo generates static files that can be deployed to any static hosting
service:

- **Netlify**: Connect your repo and set the `MOVIE_API_URL` environment
  variable
- **Vercel**: Similar to Netlify with environment variables
- **GitHub Pages**: Build locally and push to `gh-pages` branch
- **Any CDN**: Upload the `_site` folder after running `npm run build`

## Troubleshooting

### No Movies Showing

1. Check that `MOVIE_API_URL` is set correctly
2. Verify your Supabase function is deployed and accessible
3. Check the browser console for API errors

### Poster Images Not Loading

1. Ensure your movies have `tmdb_id` values in the database
2. Check that poster paths are correctly stored
3. Fallback placeholders should work even without TMDB data

### Build Errors

1. Make sure Node.js version is 16+ for ES modules support
2. Check that all dependencies are installed with `npm install`
3. Verify the API is accessible during build time

## Example Environment Setup

For local development, create a `.env` file:

```bash
# Your Supabase project URL
MOVIE_API_URL=https://abcdefghijk.supabase.co/functions/v1/movies

# Optional: Set a different port for the dev server
PORT=3000
```

Then start the development server:

```bash
npm start
```

The demo will fetch live data from your movie API and display it in a beautiful,
responsive grid layout.

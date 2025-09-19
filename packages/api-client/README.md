# MSB API Client

A TypeScript SDK for consuming the MSB movie tracking API. Provides type-safe
methods for accessing movies, watches, and statistics with built-in error
handling.

## Features

- 🏷️ **Type Safety** - Full TypeScript support with generated types
- 🌐 **Universal** - Works in both browser and Node.js environments
- 🔗 **Promise-based** - Modern async/await API
- 🛡️ **Error Handling** - Built-in error handling and response validation
- 📦 **Lightweight** - Minimal dependencies, tree-shakeable

## Installation

```bash
npm install @msb/api-client

# Or with yarn
yarn add @msb/api-client

# Or with pnpm
pnpm add @msb/api-client
```

## Quick Start

```typescript
import { MSBApi } from '@msb/api-client'

// Initialize the client
const api = new MSBApi({
  baseUrl: 'https://your-project.supabase.co/functions/v1',
  apiKey: 'your-api-key', // Optional
})

// Get recent movies
const movies = await api.getMovies({ limit: 10 })

// Get movie statistics
const stats = await api.getStats()

// Get recent watches
const watches = await api.getWatches({ limit: 20 })
```

## API Reference

### Constructor

```typescript
new MSBApi(config: MSBApiConfig)
```

**Config Options:**

- `baseUrl` (string, required) - Base URL of your MSB API
- `apiKey` (string, optional) - API key for authentication

### Methods

#### `getMovies(params?)`

Get a list of movies with optional filtering.

```typescript
const movies = await api.getMovies({
  limit: 50, // Number of movies to return (default: 50)
  search: 'matrix', // Search movies by title
  posters: true, // Only return movies with posters
})
```

**Returns:** `Promise<MoviesResponse>`

#### `getMovie(id)`

Get a specific movie by ID.

```typescript
const movie = await api.getMovie('movie-uuid')
```

**Returns:** `Promise<Movie>`

#### `getWatches(params?)`

Get recent movie watches.

```typescript
const watches = await api.getWatches({
  limit: 20, // Number of watches to return (default: 20)
})
```

**Returns:** `Promise<WatchesResponse>`

#### `getStats()`

Get movie database statistics.

```typescript
const stats = await api.getStats()
// Returns: { total_movies, total_watches, movies_with_posters, poster_coverage, average_rating }
```

**Returns:** `Promise<StatsResponse>`

#### `sendWebhook(payload)`

Send a webhook payload (for testing).

```typescript
const result = await api.sendWebhook({
  item: {
    title: 'The Matrix, 1999',
    content: '★★★★☆',
    link: 'https://letterboxd.com/user/film/the-matrix/',
  },
})
```

**Returns:** `Promise<ApiResponse<any>>`

#### `cleanupMovies(movieIds)`

Delete movies and their associated watches (admin operation).

```typescript
const result = await api.cleanupMovies(['movie-id-1', 'movie-id-2'])
```

**Returns:** `Promise<ApiResponse<any>>`

## Type Definitions

The client exports all relevant TypeScript types:

```typescript
import type {
  Movie,
  MovieWatch,
  MoviesResponse,
  WatchesResponse,
  StatsResponse,
  ApiResponse,
} from '@msb/api-client'
```

### Core Types

#### `Movie`

```typescript
interface Movie {
  id: string
  title: string
  year: number | null
  director: string | null
  letterboxd_id: string | null
  trakt_id: string | null
  tmdb_id: string | null
  poster_url: string | null
  backdrop_url: string | null
  plot_summary: string | null
  genres: string[] | null
  country: string | null
  language: string | null
  budget: number | null
  box_office: number | null
  trailer_url: string | null
  created_at: string
  updated_at: string
}
```

#### `MovieWatch`

```typescript
interface MovieWatch {
  id: string
  movie_id: string
  watched_at: string
  personal_rating: number | null
  review_text: string | null
  source: string
  source_url: string | null
  external_id: string | null
  metadata: Record<string, any> | null
  created_at: string
  updated_at: string
}
```

## Usage Examples

### React Hook

```typescript
import { useState, useEffect } from 'react'
import { MSBApi } from '@msb/api-client'

const api = new MSBApi({ baseUrl: process.env.REACT_APP_API_URL })

function useMovies() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .getMovies()
      .then(response => {
        setMovies(response.movies)
        setLoading(false)
      })
      .catch(error => {
        console.error('Failed to fetch movies:', error)
        setLoading(false)
      })
  }, [])

  return { movies, loading }
}
```

### Node.js Script

```typescript
import { MSBApi } from '@msb/api-client'

const api = new MSBApi({
  baseUrl: 'https://your-project.supabase.co/functions/v1',
  apiKey: process.env.MSB_API_KEY,
})

async function generateReport() {
  try {
    const stats = await api.getStats()
    const recentWatches = await api.getWatches({ limit: 10 })

    console.log(`Total movies: ${stats.total_movies}`)
    console.log(`Average rating: ${stats.average_rating}`)
    console.log(`Recent watches: ${recentWatches.watches.length}`)
  } catch (error) {
    console.error('Report generation failed:', error)
  }
}

generateReport()
```

### Search and Filter

```typescript
// Search for movies
const searchResults = await api.getMovies({
  search: 'christopher nolan',
  limit: 20,
})

// Get only movies with posters
const moviesWithPosters = await api.getMovies({
  posters: true,
})

// Get a specific movie's details
const movie = await api.getMovie(searchResults.movies[0].id)
```

## Error Handling

The client throws descriptive errors for different failure scenarios:

```typescript
try {
  const movie = await api.getMovie('invalid-id')
} catch (error) {
  if (error.message.includes('404')) {
    console.log('Movie not found')
  } else if (error.message.includes('500')) {
    console.log('Server error')
  } else {
    console.log('Network or other error:', error.message)
  }
}
```

## Browser Usage

The client works directly in browsers:

```html
<script type="module">
  import { MSBApi } from 'https://unpkg.com/@msb/api-client/dist/browser.js'

  const api = new MSBApi({ baseUrl: 'https://your-api.com' })
  const stats = await api.getStats()
  console.log(stats)
</script>
```

## Development

### Building

```bash
npm run build
```

Builds both CommonJS and ES modules, plus a browser bundle.

### Testing

```bash
npm run test
```

### Publishing

```bash
npm run build
npm publish --access public
```

## Configuration

### Environment Variables

For Node.js applications, you can use environment variables:

```typescript
const api = new MSBApi({
  baseUrl: process.env.MSB_API_URL || 'http://localhost:54321/functions/v1',
  apiKey: process.env.MSB_API_KEY,
})
```

### Custom Fetch

For advanced use cases, you can extend the client:

```typescript
class CustomMSBApi extends MSBApi {
  protected async request(endpoint: string, options: RequestInit = {}) {
    // Add custom headers, retry logic, etc.
    return super.request(endpoint, {
      ...options,
      headers: {
        'Custom-Header': 'value',
        ...options.headers,
      },
    })
  }
}
```

## Contributing

See the main [Contributing Guide](../../README.md#contributing) for general
guidelines.

### Client-Specific Guidelines

- Maintain backward compatibility
- Add comprehensive tests for new methods
- Update TypeScript types for API changes
- Document new features with examples
- Follow semantic versioning for releases

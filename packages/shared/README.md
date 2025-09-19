# MSB Shared Package

Shared utilities, types, and configurations used across all MSB API workspaces.
This package provides common functionality to ensure consistency and reduce code
duplication.

## Features

- 🏷️ **TypeScript Types** - Shared interfaces for database entities and API
  responses
- 🔧 **Utility Functions** - Common helpers for dates, strings, movies, and
  validation
- 📝 **Type Safety** - Strict TypeScript definitions for all data structures
- 🔄 **Consistency** - Unified data handling across all packages

## Installation

This package is automatically available to other workspaces in the monorepo:

```typescript
// In other workspace packages
import { Movie, formatDate, parseMovieTitle } from '@msb/shared'
import type { MovieWatch, StatsResponse } from '@msb/shared/types'
```

## Type Definitions

### Database Types

#### `Movie`

Complete movie entity with TMDB enrichment:

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

Individual viewing record:

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

### API Response Types

#### `MoviesResponse`

```typescript
interface MoviesResponse {
  count: number
  movies: (Movie & { movie_watches?: MovieWatch[] })[]
}
```

#### `WatchesResponse`

```typescript
interface WatchesResponse {
  count: number
  watches: (MovieWatch & { movies?: Movie })[]
}
```

#### `StatsResponse`

```typescript
interface StatsResponse {
  total_movies: number
  total_watches: number
  movies_with_posters: number
  poster_coverage: number
  average_rating: number
}
```

### Webhook Types

#### `EchoFeedWebhook`

```typescript
interface EchoFeedWebhook {
  item?: EchoFeedItem
  // Direct payload format
  id?: string
  title?: string
  content?: string
  link?: string
  guid?: string
  pubDate?: string
  date?: string
  summary?: string
  trakt_id?: string
}
```

#### `TMDBMovie`

TMDB API response structure:

```typescript
interface TMDBMovie {
  id: number
  title: string
  overview?: string
  poster_path?: string
  backdrop_path?: string
  release_date?: string
  genres?: Array<{ id: number; name: string }>
  // ... additional TMDB fields
}
```

## Utility Functions

### Date Utilities

```typescript
import { formatDate, formatDateTime } from '@msb/shared'

formatDate('2023-12-25') // "December 25, 2023"
formatDateTime('2023-12-25T10:30:00Z') // "Dec 25, 2023, 10:30 AM"
```

### String Utilities

```typescript
import { slugify, truncate } from '@msb/shared'

slugify('The Dark Knight') // "the-dark-knight"
truncate('Long movie description...', 50) // "Long movie description..."
```

### Rating Utilities

```typescript
import { formatRating, ratingToStars } from '@msb/shared'

formatRating(8.5) // "8.5/10"
formatRating(null) // "No rating"
ratingToStars(8.5) // "★★★★☆"
ratingToStars(null) // "☆☆☆☆☆"
```

### Movie Utilities

```typescript
import { parseMovieTitle, extractExternalIds } from '@msb/shared'

// Parse different title formats
parseMovieTitle('The Matrix, 1999')
// { title: 'The Matrix', year: 1999 }

parseMovieTitle('Inception (2010)')
// { title: 'Inception', year: 2010 }

// Extract IDs from URLs
extractExternalIds('https://letterboxd.com/user/film/the-matrix/')
// { letterboxd_id: 'the-matrix' }

extractExternalIds('https://trakt.tv/movies/the-matrix-1999')
// { trakt_id: 'the-matrix-1999' }
```

### Image Utilities

```typescript
import { buildImageUrl } from '@msb/shared'

buildImageUrl('/poster.jpg') // "https://image.tmdb.org/t/p/w500/poster.jpg"
buildImageUrl('/poster.jpg', 'w780') // "https://image.tmdb.org/t/p/w780/poster.jpg"
buildImageUrl(null) // null
```

### Validation Utilities

```typescript
import { isValidEmail, isValidUrl } from '@msb/shared'

isValidEmail('user@example.com') // true
isValidEmail('invalid-email') // false

isValidUrl('https://example.com') // true
isValidUrl('not-a-url') // false
```

## Usage Examples

### Edge Functions

```typescript
import { parseMovieTitle, extractExternalIds, TMDBMovie } from '@msb/shared'

async function processWebhook(payload: EchoFeedWebhook) {
  const { title, year } = parseMovieTitle(payload.title || '')
  const externalIds = extractExternalIds(payload.link || '')

  // Process movie data...
}
```

### Admin Interface

```typescript
import { formatDate, formatRating, Movie } from '@msb/shared'

function MovieCard({ movie }: { movie: Movie }) {
  return (
    <div>
      <h3>{movie.title} ({movie.year})</h3>
      <p>Added: {formatDate(movie.created_at)}</p>
      <p>Rating: {formatRating(movie.personal_rating)}</p>
    </div>
  )
}
```

### API Client

```typescript
import type { MoviesResponse, StatsResponse } from '@msb/shared'

class APIClient {
  async getMovies(): Promise<MoviesResponse> {
    // Implementation with proper typing
  }

  async getStats(): Promise<StatsResponse> {
    // Implementation with proper typing
  }
}
```

## Development

### Building

```bash
npm run build
```

Compiles TypeScript to JavaScript with declaration files.

### Adding New Utilities

1. Add function to appropriate file in `src/utils/`
2. Export from `src/index.ts`
3. Add tests if applicable
4. Update documentation

### Adding New Types

1. Add interface to `src/types/index.ts`
2. Export from `src/index.ts`
3. Update dependent packages if needed

## File Structure

```
src/
├── index.ts           # Main exports
├── types/
│   └── index.ts       # Type definitions
└── utils/
    └── index.ts       # Utility functions
```

## Best Practices

### Type Definitions

- Use strict TypeScript settings
- Make fields nullable when appropriate
- Document complex types with comments
- Keep types focused and cohesive

### Utility Functions

- Write pure functions when possible
- Handle edge cases gracefully
- Return consistent types
- Avoid side effects

### Breaking Changes

- Follow semantic versioning
- Deprecate before removing
- Provide migration guides
- Update all dependent packages

## Contributing

See the main [Contributing Guide](../../README.md#contributing) for general
guidelines.

### Shared Package Guidelines

- All utilities must be pure functions
- Types should match database schema exactly
- Add comprehensive tests for utilities
- Document new functions with examples
- Consider backward compatibility for changes

# Database Schema Documentation

## Overview

The MSB API uses a PostgreSQL database hosted on Supabase with the following
core tables for movie tracking functionality.

## Tables

### `movies`

**Purpose**: Stores movie metadata with TMDB enrichment

| Column          | Type           | Constraints                            | Description                |
| --------------- | -------------- | -------------------------------------- | -------------------------- |
| `id`            | `uuid`         | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier          |
| `title`         | `varchar(255)` | NOT NULL                               | Movie title                |
| `year`          | `integer`      | NULL                                   | Release year               |
| `director`      | `varchar(255)` | NULL                                   | Director name              |
| `letterboxd_id` | `varchar(255)` | NULL, UNIQUE                           | Letterboxd slug identifier |
| `trakt_id`      | `varchar(255)` | NULL, UNIQUE                           | Trakt.tv identifier        |
| `tmdb_id`       | `varchar(255)` | NULL, UNIQUE                           | TMDB identifier            |
| `poster_url`    | `text`         | NULL                                   | TMDB poster image URL      |
| `backdrop_url`  | `text`         | NULL                                   | TMDB backdrop image URL    |
| `plot_summary`  | `text`         | NULL                                   | Movie plot/overview        |
| `genres`        | `text[]`       | NULL                                   | Array of genre names       |
| `country`       | `varchar(10)`  | NULL                                   | ISO country code           |
| `language`      | `varchar(10)`  | NULL                                   | ISO language code          |
| `budget`        | `bigint`       | NULL                                   | Production budget          |
| `box_office`    | `bigint`       | NULL                                   | Box office revenue         |
| `trailer_url`   | `text`         | NULL                                   | YouTube trailer URL        |
| `created_at`    | `timestamptz`  | DEFAULT now()                          | Record creation timestamp  |
| `updated_at`    | `timestamptz`  | DEFAULT now()                          | Record update timestamp    |

**Indexes**:

- `idx_movies_title_year` on `(title, year)` for deduplication
- `idx_movies_letterboxd_id` on `letterboxd_id`
- `idx_movies_trakt_id` on `trakt_id`
- `idx_movies_tmdb_id` on `tmdb_id`

### `movie_watches`

**Purpose**: Records individual movie viewing instances with ratings and reviews

| Column            | Type           | Constraints                                                  | Description                                  |
| ----------------- | -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| `id`              | `uuid`         | PRIMARY KEY, DEFAULT gen_random_uuid()                       | Unique identifier                            |
| `movie_id`        | `uuid`         | NOT NULL, FOREIGN KEY → movies(id)                           | Reference to movie                           |
| `watched_at`      | `timestamptz`  | NOT NULL                                                     | When the movie was watched                   |
| `personal_rating` | `decimal(3,1)` | NULL, CHECK (personal_rating >= 0 AND personal_rating <= 10) | User rating (0-10 scale)                     |
| `review_text`     | `text`         | NULL                                                         | User review/comments                         |
| `source`          | `varchar(50)`  | NOT NULL                                                     | Source platform (letterboxd, trakt, generic) |
| `source_url`      | `text`         | NULL                                                         | Original source URL                          |
| `external_id`     | `varchar(255)` | NULL                                                         | External platform identifier                 |
| `metadata`        | `jsonb`        | NULL                                                         | Additional source-specific data              |
| `created_at`      | `timestamptz`  | DEFAULT now()                                                | Record creation timestamp                    |
| `updated_at`      | `timestamptz`  | DEFAULT now()                                                | Record update timestamp                      |

**Indexes**:

- `idx_movie_watches_movie_id` on `movie_id`
- `idx_movie_watches_watched_at` on `watched_at DESC`
- `idx_movie_watches_external_id` on `external_id`

## Relationships

- `movie_watches.movie_id` → `movies.id` (Many-to-One)
  - One movie can have multiple watch records
  - Cascading delete: When a movie is deleted, all associated watches are
    deleted

## Data Integrity Rules

1. **Movie Deduplication**: Movies are deduplicated using:
   - Primary: External IDs (letterboxd_id, trakt_id, tmdb_id)
   - Secondary: Combination of title and year

2. **Rating Constraints**: Personal ratings must be between 0 and 10 (inclusive)

3. **Required Fields**:
   - Movies: `title` is required
   - Watches: `movie_id`, `watched_at`, `source` are required

## Triggers

### `movies_updated_at_trigger`

- Updates `updated_at` timestamp when movie records are modified
- Trigger function: `update_updated_at_column()`

### `movie_watches_updated_at_trigger`

- Updates `updated_at` timestamp when watch records are modified
- Trigger function: `update_updated_at_column()`

## Common Queries

### Get movies with watch count

```sql
SELECT m.*, COUNT(mw.id) as watch_count
FROM movies m
LEFT JOIN movie_watches mw ON m.id = mw.movie_id
GROUP BY m.id
ORDER BY m.created_at DESC;
```

### Get recent watches with movie details

```sql
SELECT mw.*, m.title, m.year, m.director, m.poster_url
FROM movie_watches mw
JOIN movies m ON mw.movie_id = m.id
ORDER BY mw.watched_at DESC
LIMIT 20;
```

### Get statistics

```sql
SELECT
  COUNT(DISTINCT m.id) as total_movies,
  COUNT(mw.id) as total_watches,
  AVG(mw.personal_rating) as avg_rating,
  COUNT(CASE WHEN m.poster_url IS NOT NULL THEN 1 END) as movies_with_posters
FROM movies m
LEFT JOIN movie_watches mw ON m.id = mw.movie_id;
```

## Migration History

See `migrations/` directory for chronological database changes.

## Backup Strategy

- Automated daily backups via Supabase
- Point-in-time recovery available for last 7 days
- For local development: Use `pg_dump` for schema and data exports

## Performance Considerations

- Indexes on frequently queried columns (external IDs, timestamps)
- JSONB metadata column for flexible source-specific data
- Proper foreign key constraints for referential integrity
- Consider partitioning `movie_watches` by date if volume grows significantly

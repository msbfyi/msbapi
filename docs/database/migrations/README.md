# Database Migrations

## Overview

This directory contains SQL migration files that document the evolution of the
database schema. Each migration represents a specific change to the database
structure.

## Migration Naming Convention

```
YYYYMMDD_HHMMSS_description.sql
```

Examples:

- `20240915_120000_initial_schema.sql`
- `20240920_143000_add_tmdb_fields.sql`
- `20240925_090000_add_genres_array.sql`

## How to Create Migrations

### For Supabase Projects

1. **Create migration file**:

   ```bash
   supabase migration new description_of_change
   ```

2. **Write your SQL**: Edit the generated file in `supabase/migrations/`

3. **Apply migration**:
   ```bash
   supabase migration up
   ```

### For Documentation

1. **Copy to docs**: After creating a Supabase migration, copy it to
   `docs/database/migrations/`
2. **Add description**: Include comments explaining the purpose and impact
3. **Update this README**: Add entry to the migration history below

## Migration History

| Date       | File                   | Description                             | Status     |
| ---------- | ---------------------- | --------------------------------------- | ---------- |
| 2024-09-15 | `initial_schema.sql`   | Initial movies and movie_watches tables | ✅ Applied |
| 2024-09-20 | `add_tmdb_fields.sql`  | Added TMDB enrichment fields            | ✅ Applied |
| TBD        | `future_migration.sql` | Future schema changes                   | 📋 Planned |

## Rollback Strategy

- **Development**: Use `supabase db reset` to start fresh
- **Production**: Create reverse migration files for critical changes
- **Backup**: Always backup before major schema changes

## Best Practices

1. **Atomic Changes**: Each migration should contain related changes only
2. **Backwards Compatible**: Avoid breaking changes when possible
3. **Comments**: Include comments explaining complex changes
4. **Test First**: Test migrations on development environment
5. **Data Migration**: Include data transformation scripts when needed

## Recovery Procedures

### Complete Database Recreation

If you need to recreate the database from scratch:

1. **Export current data** (if needed):

   ```sql
   COPY movies TO '/tmp/movies_backup.csv' DELIMITER ',' CSV HEADER;
   COPY movie_watches TO '/tmp/watches_backup.csv' DELIMITER ',' CSV HEADER;
   ```

2. **Run all migrations in order**:

   ```bash
   # Apply from docs/database/migrations/ in chronological order
   psql -f docs/database/migrations/20240915_120000_initial_schema.sql
   psql -f docs/database/migrations/20240920_143000_add_tmdb_fields.sql
   ```

3. **Restore data** (if needed):
   ```sql
   COPY movies FROM '/tmp/movies_backup.csv' DELIMITER ',' CSV HEADER;
   COPY movie_watches FROM '/tmp/watches_backup.csv' DELIMITER ',' CSV HEADER;
   ```

### Schema Drift Detection

Run this query to compare current schema with expected:

```sql
-- Check for missing tables
SELECT 'Missing table: ' || table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name NOT IN ('movies', 'movie_watches');

-- Check for missing columns in movies table
SELECT 'Missing column in movies: ' || column_name
FROM information_schema.columns
WHERE table_name = 'movies'
AND table_schema = 'public'
AND column_name NOT IN (
  'id', 'title', 'year', 'director', 'letterboxd_id', 'trakt_id',
  'tmdb_id', 'poster_url', 'backdrop_url', 'plot_summary', 'genres',
  'country', 'language', 'budget', 'box_office', 'trailer_url',
  'created_at', 'updated_at'
);
```

-- Add TMDB enrichment fields to movies table
-- Adds poster URLs, metadata, and external identifiers
-- Date: 2024-09-20 14:30:00

-- Add TMDB-related columns to movies table
ALTER TABLE movies ADD COLUMN tmdb_id VARCHAR(255) UNIQUE;
ALTER TABLE movies ADD COLUMN poster_url TEXT;
ALTER TABLE movies ADD COLUMN backdrop_url TEXT;
ALTER TABLE movies ADD COLUMN plot_summary TEXT;
ALTER TABLE movies ADD COLUMN genres TEXT[];
ALTER TABLE movies ADD COLUMN country VARCHAR(10);
ALTER TABLE movies ADD COLUMN language VARCHAR(10);
ALTER TABLE movies ADD COLUMN budget BIGINT;
ALTER TABLE movies ADD COLUMN box_office BIGINT;
ALTER TABLE movies ADD COLUMN trailer_url TEXT;

-- Add index for TMDB ID lookups
CREATE INDEX idx_movies_tmdb_id ON movies(tmdb_id);

-- Add comments for new fields
COMMENT ON COLUMN movies.tmdb_id IS 'The Movie Database (TMDB) identifier';
COMMENT ON COLUMN movies.poster_url IS 'TMDB poster image URL';
COMMENT ON COLUMN movies.backdrop_url IS 'TMDB backdrop image URL';
COMMENT ON COLUMN movies.plot_summary IS 'Movie plot summary from TMDB';
COMMENT ON COLUMN movies.genres IS 'Array of genre names from TMDB';
COMMENT ON COLUMN movies.country IS 'ISO 3166-1 country code';
COMMENT ON COLUMN movies.language IS 'ISO 639-1 language code';
COMMENT ON COLUMN movies.budget IS 'Production budget in USD';
COMMENT ON COLUMN movies.box_office IS 'Box office revenue in USD';
COMMENT ON COLUMN movies.trailer_url IS 'YouTube trailer URL';
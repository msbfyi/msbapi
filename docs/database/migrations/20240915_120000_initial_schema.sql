-- Initial schema for MSB API
-- Creates movies and movie_watches tables with basic structure
-- Date: 2024-09-15 12:00:00

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Movies table - stores movie metadata
CREATE TABLE movies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    year INTEGER,
    director VARCHAR(255),
    letterboxd_id VARCHAR(255) UNIQUE,
    trakt_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Movie watches table - stores individual viewing records
CREATE TABLE movie_watches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    watched_at TIMESTAMPTZ NOT NULL,
    personal_rating DECIMAL(3,1) CHECK (personal_rating >= 0 AND personal_rating <= 10),
    review_text TEXT,
    source VARCHAR(50) NOT NULL,
    source_url TEXT,
    external_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_movies_title_year ON movies(title, year);
CREATE INDEX idx_movies_letterboxd_id ON movies(letterboxd_id);
CREATE INDEX idx_movies_trakt_id ON movies(trakt_id);

CREATE INDEX idx_movie_watches_movie_id ON movie_watches(movie_id);
CREATE INDEX idx_movie_watches_watched_at ON movie_watches(watched_at DESC);
CREATE INDEX idx_movie_watches_external_id ON movie_watches(external_id);

-- Triggers to automatically update updated_at timestamps
CREATE TRIGGER movies_updated_at_trigger
    BEFORE UPDATE ON movies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER movie_watches_updated_at_trigger
    BEFORE UPDATE ON movie_watches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE movies IS 'Stores movie metadata with external platform identifiers';
COMMENT ON TABLE movie_watches IS 'Records individual movie viewing instances with ratings and reviews';
COMMENT ON COLUMN movies.letterboxd_id IS 'Letterboxd film slug identifier';
COMMENT ON COLUMN movies.trakt_id IS 'Trakt.tv movie identifier';
COMMENT ON COLUMN movie_watches.personal_rating IS 'User rating on 0-10 scale';
COMMENT ON COLUMN movie_watches.source IS 'Platform source: letterboxd, trakt, generic';
COMMENT ON COLUMN movie_watches.metadata IS 'Source-specific additional data as JSON';
# Product Requirements Document: TV Show Tracking

**Version:** 0.2.0
**Date:** 2025-09-15
**Status:** Planning
**Owner:** Personal API Team

## 1. Executive Summary

### 1.1 Overview
Extend the Personal API to support comprehensive TV show tracking alongside existing movie functionality. This will enable users to track episode-by-episode viewing, aggregate show-level statistics, and identify currently watching series.

### 1.2 Goals
- **Primary**: Add full TV show tracking with episode-level granularity
- **Secondary**: Provide "currently watching" insights for incomplete series
- **Tertiary**: Maintain feature parity with existing movie tracking capabilities

### 1.3 Success Metrics
- Process TV episode webhooks from RSS feeds successfully
- Enrich TV shows with TheTVDB metadata automatically
- Accurately identify and track "currently watching" series
- Maintain API response times under 500ms

## 2. Background & Context

### 2.1 Current State
The Personal API currently supports:
- Movie tracking from Letterboxd/Trakt.tv RSS feeds
- Automatic TMDB enrichment for movie metadata
- RESTful API endpoints for movie data consumption
- JavaScript client library for website integration

### 2.2 Problem Statement
Users consume both movies and TV shows but can only track movies in the current system. TV shows require different data modeling due to their episodic nature and ongoing status, necessitating:
- Episode-level tracking granularity
- Show-level aggregation and progress tracking
- "Currently watching" identification for incomplete series

### 2.3 User Personas
- **Primary**: Personal media tracking enthusiasts who watch both movies and TV shows
- **Secondary**: Developers building personal media websites/dashboards
- **Tertiary**: Data analysts wanting comprehensive viewing insights

## 3. Requirements

### 3.1 Functional Requirements

#### 3.1.1 Core TV Tracking
- **R1.1**: Process TV episode data from EchoFeed webhooks (Letterboxd, Trakt.tv)
- **R1.2**: Extract show name, season number, episode number from RSS feeds
- **R1.3**: Create and maintain TV show records with metadata
- **R1.4**: Track individual episode watches with timestamps and ratings
- **R1.5**: Support rewatching episodes (multiple watch records per episode)

#### 3.1.2 TheTVDB Integration
- **R2.1**: Authenticate with TheTVDB v4 API using API key
- **R2.2**: Search for TV shows by name and year
- **R2.3**: Enrich shows with metadata (poster, plot, genres, cast)
- **R2.4**: Fetch episode lists and metadata for seasons
- **R2.5**: Handle API rate limiting and error responses gracefully

#### 3.1.3 Data Retrieval APIs
- **R3.1**: List TV shows with filtering (search, genre, status)
- **R3.2**: Return recent episode watches in chronological order
- **R3.3**: Provide show details with episode lists and watch history
- **R3.4**: Generate TV watching statistics and insights
- **R3.5**: Identify currently watching shows (incomplete in last 30 days)

#### 3.1.4 Currently Watching Logic
- **R4.1**: Define "currently watching" as shows with episodes watched in last 30 days
- **R4.2**: Exclude shows where all available episodes have been watched
- **R4.3**: Calculate watch progress percentage (watched/total episodes)
- **R4.4**: Handle ongoing series without defined total episode counts
- **R4.5**: Provide last watched episode information and timestamp

### 3.2 Non-Functional Requirements

#### 3.2.1 Performance
- **NF1.1**: API endpoints respond within 500ms for typical queries
- **NF1.2**: TheTVDB enrichment completes within 5 seconds per show
- **NF1.3**: Database queries optimize for episode chronological ordering
- **NF1.4**: Support up to 1000 TV shows with 50,000 episodes efficiently

#### 3.2.2 Reliability
- **NF2.1**: Webhook processing has 99%+ success rate
- **NF2.2**: Handle duplicate episode watches gracefully
- **NF2.3**: Graceful degradation when TheTVDB API is unavailable
- **NF2.4**: Data consistency between shows, episodes, and watches

#### 3.2.3 Compatibility
- **NF3.1**: Maintain backward compatibility with existing movie APIs
- **NF3.2**: Follow same authentication and CORS patterns as movie endpoints
- **NF3.3**: Use consistent error response formats across all endpoints
- **NF3.4**: Support same RSS feed sources (Letterboxd, Trakt.tv, generic)

### 3.3 Technical Requirements

#### 3.3.1 Database Schema
- **T1.1**: Create `tv_shows` table with show metadata and TheTVDB fields
- **T1.2**: Create `tv_episodes` table with episode details and show references
- **T1.3**: Create `tv_episode_watches` table with viewing records
- **T1.4**: Implement proper foreign key relationships and constraints
- **T1.5**: Add indexes for performance on common query patterns

#### 3.3.2 API Architecture
- **T2.1**: New Supabase Edge Function at `/functions/tv/index.ts`
- **T2.2**: RESTful endpoints following existing movie API patterns
- **T2.3**: JSON request/response format with comprehensive error handling
- **T2.4**: Environment variable configuration for TheTVDB API key

#### 3.3.3 Client Library
- **T3.1**: JavaScript client class `TVAPI` with TV-specific methods
- **T3.2**: HTML generation utilities for TV widgets and components
- **T3.3**: TypeScript definitions for TV data structures
- **T3.4**: Browser and Node.js compatibility maintained

## 4. User Stories

### 4.1 Episode Tracking
**As a** TV show viewer
**I want** my episode watches automatically tracked from RSS feeds
**So that** I can see my viewing history without manual data entry

**Acceptance Criteria:**
- Episode watches appear in API within 1 minute of RSS feed update
- Show and episode metadata is automatically enriched from TheTVDB
- Both Letterboxd and Trakt.tv formats are supported

### 4.2 Currently Watching Discovery
**As a** TV enthusiast
**I want** to see which shows I'm currently watching but haven't finished
**So that** I can resume watching and track my progress

**Acceptance Criteria:**
- Shows with recent episodes (last 30 days) but incomplete status appear
- Progress percentage shows watched vs total episodes
- Last watched episode and date are clearly indicated

### 4.3 Episode Chronology
**As a** data visualization developer
**I want** episode watches in chronological order
**So that** I can build timeline views of viewing activity

**Acceptance Criteria:**
- Episodes return in reverse chronological order (newest first)
- Each episode includes show context and metadata
- Pagination supports large watch histories

### 4.4 Show Progress Tracking
**As a** binge watcher
**I want** to see my progress through TV series
**So that** I can understand my completion rate and viewing patterns

**Acceptance Criteria:**
- Show details include total vs watched episode counts
- Progress percentage calculates correctly for multi-season shows
- Rewatches are counted separately from completion progress

## 5. API Specification

### 5.1 Endpoints Overview

| Method | Endpoint | Purpose | Response |
|--------|----------|---------|----------|
| POST | `/tv` | Process TV webhooks | Success confirmation |
| GET | `/tv/shows` | List TV shows | Shows with metadata |
| GET | `/tv/episodes` | Recent episodes | Chronological episodes |
| GET | `/tv/shows/{id}` | Show details | Single show with episodes |
| GET | `/tv/currently-watching` | Active shows | Incomplete shows |
| GET | `/tv/stats` | TV statistics | Aggregate data |

### 5.2 Data Models

#### 5.2.1 TV Show
```json
{
  "id": "uuid",
  "title": "Breaking Bad",
  "year": 2008,
  "status": "ended",
  "network": "AMC",
  "total_seasons": 5,
  "total_episodes": 62,
  "first_aired": "2008-01-20",
  "last_aired": "2013-09-29",
  "poster_url": "https://artworks.thetvdb.com/...",
  "backdrop_url": "https://artworks.thetvdb.com/...",
  "plot_summary": "A high school chemistry teacher...",
  "genres": ["Crime", "Drama", "Thriller"],
  "tvdb_id": "81189",
  "trakt_id": "1388",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

#### 5.2.2 Episode Watch
```json
{
  "id": "uuid",
  "watched_at": "2024-01-15T20:00:00Z",
  "personal_rating": 5,
  "review_text": "Amazing finale!",
  "source": "trakt",
  "tv_episodes": {
    "id": "uuid",
    "season_number": 5,
    "episode_number": 16,
    "title": "Felina",
    "air_date": "2013-09-29",
    "plot_summary": "All loose ends are tied up...",
    "still_image_url": "https://artworks.thetvdb.com/...",
    "tv_shows": {
      "title": "Breaking Bad",
      "poster_url": "https://artworks.thetvdb.com/..."
    }
  }
}
```

#### 5.2.3 Currently Watching
```json
{
  "show": {
    "id": "uuid",
    "title": "Better Call Saul",
    "poster_url": "https://artworks.thetvdb.com/..."
  },
  "progress": {
    "watched_episodes": 45,
    "total_episodes": 63,
    "percentage": 71,
    "last_watched": "2024-01-10T19:30:00Z",
    "last_episode": {
      "season_number": 4,
      "episode_number": 8,
      "title": "Coushatta"
    }
  }
}
```

## 6. Technical Architecture

### 6.1 Database Design

#### 6.1.1 Tables Structure
```sql
-- TV Shows (similar to movies table)
CREATE TABLE tv_shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  year INTEGER,
  status VARCHAR, -- 'continuing', 'ended', 'cancelled'
  network VARCHAR,
  total_seasons INTEGER,
  total_episodes INTEGER,
  first_aired DATE,
  last_aired DATE,
  poster_url TEXT,
  backdrop_url TEXT,
  plot_summary TEXT,
  genres TEXT[],
  country VARCHAR,
  language VARCHAR,
  tvdb_id VARCHAR UNIQUE,
  trakt_id VARCHAR UNIQUE,
  letterboxd_id VARCHAR UNIQUE,
  trailer_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TV Episodes
CREATE TABLE tv_episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tv_show_id UUID REFERENCES tv_shows(id) ON DELETE CASCADE,
  season_number INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  title VARCHAR,
  air_date DATE,
  plot_summary TEXT,
  still_image_url TEXT,
  runtime INTEGER, -- minutes
  tvdb_id VARCHAR UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tv_show_id, season_number, episode_number)
);

-- Episode Watches (similar to movie_watches)
CREATE TABLE tv_episode_watches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tv_episode_id UUID REFERENCES tv_episodes(id) ON DELETE CASCADE,
  watched_at TIMESTAMP NOT NULL,
  personal_rating DECIMAL(3,1), -- 1.0-5.0 or 1.0-10.0
  review_text TEXT,
  source VARCHAR NOT NULL, -- 'letterboxd', 'trakt', 'generic'
  source_url TEXT,
  external_id VARCHAR,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 6.1.2 Indexes
```sql
-- Performance indexes
CREATE INDEX idx_tv_shows_title ON tv_shows(title);
CREATE INDEX idx_tv_shows_year ON tv_shows(year);
CREATE INDEX idx_tv_shows_tvdb_id ON tv_shows(tvdb_id);
CREATE INDEX idx_tv_episodes_show_id ON tv_episodes(tv_show_id);
CREATE INDEX idx_tv_episodes_season_episode ON tv_episodes(season_number, episode_number);
CREATE INDEX idx_tv_episode_watches_watched_at ON tv_episode_watches(watched_at DESC);
CREATE INDEX idx_tv_episode_watches_episode_id ON tv_episode_watches(tv_episode_id);
```

### 6.2 TheTVDB Integration

#### 6.2.1 Authentication Flow
```javascript
// Token-based authentication
async function authenticateTheTVDB(apiKey) {
  const response = await fetch('https://api.thetvdb.com/v4/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apikey: apiKey })
  });
  const { data } = await response.json();
  return data.token; // Valid for 24 hours
}
```

#### 6.2.2 Search and Enrichment
```javascript
// Search for TV show
async function searchTVDBShow(title, year) {
  const params = new URLSearchParams({
    query: title,
    type: 'series'
  });
  if (year) params.append('year', year);

  const response = await fetch(`https://api.thetvdb.com/v4/search?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}

// Get show details with episodes
async function getTVDBShowDetails(seriesId) {
  const [series, episodes] = await Promise.all([
    fetch(`https://api.thetvdb.com/v4/series/${seriesId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }),
    fetch(`https://api.thetvdb.com/v4/series/${seriesId}/episodes/default`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
  ]);

  return {
    series: await series.json(),
    episodes: await episodes.json()
  };
}
```

### 6.3 RSS Feed Processing

#### 6.3.1 Episode Data Extraction
```javascript
async function extractTVData(feedItem) {
  const { title, content, link, pubDate } = feedItem;

  // Determine source and extract accordingly
  if (link?.includes('letterboxd.com')) {
    return extractLetterboxdTVData(feedItem);
  } else if (link?.includes('trakt.tv')) {
    return extractTraktTVData(feedItem);
  } else {
    return extractGenericTVData(feedItem);
  }
}

async function extractTraktTVData(feedItem) {
  const { title, content } = feedItem;

  // Trakt format: "Show Name S01E05: Episode Title"
  const episodeMatch = title.match(/^(.+?)\s+S(\d+)E(\d+):\s*(.+)/i);

  if (episodeMatch) {
    return {
      showTitle: episodeMatch[1].trim(),
      seasonNumber: parseInt(episodeMatch[2]),
      episodeNumber: parseInt(episodeMatch[3]),
      episodeTitle: episodeMatch[4].trim(),
      rating: extractRatingFromContent(content),
      review: extractReviewFromContent(content)
    };
  }

  throw new Error('Could not parse TV episode from Trakt feed');
}
```

### 6.4 Currently Watching Logic

#### 6.4.1 Implementation Strategy
```javascript
async function getCurrentlyWatching() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get shows with recent episode watches
  const { data: recentWatches } = await supabase
    .from('tv_episode_watches')
    .select(`
      tv_episodes!inner(
        tv_show_id,
        tv_shows!inner(*)
      )
    `)
    .gte('watched_at', thirtyDaysAgo.toISOString());

  // Group by show and calculate progress
  const showProgress = {};

  for (const watch of recentWatches) {
    const showId = watch.tv_episodes.tv_show_id;
    const show = watch.tv_episodes.tv_shows;

    if (!showProgress[showId]) {
      showProgress[showId] = {
        show: show,
        watchedEpisodes: new Set(),
        lastWatched: null
      };
    }

    showProgress[showId].watchedEpisodes.add(
      `${watch.tv_episodes.season_number}x${watch.tv_episodes.episode_number}`
    );

    if (!showProgress[showId].lastWatched ||
        watch.watched_at > showProgress[showId].lastWatched) {
      showProgress[showId].lastWatched = watch.watched_at;
    }
  }

  // Filter incomplete shows and calculate percentages
  const currentlyWatching = [];

  for (const [showId, progress] of Object.entries(showProgress)) {
    const watchedCount = progress.watchedEpisodes.size;
    const totalEpisodes = progress.show.total_episodes;

    // Skip if all episodes watched or no total count available
    if (totalEpisodes && watchedCount < totalEpisodes) {
      currentlyWatching.push({
        show: progress.show,
        progress: {
          watched_episodes: watchedCount,
          total_episodes: totalEpisodes,
          percentage: Math.round((watchedCount / totalEpisodes) * 100),
          last_watched: progress.lastWatched
        }
      });
    }
  }

  return currentlyWatching.sort((a, b) =>
    new Date(b.progress.last_watched) - new Date(a.progress.last_watched)
  );
}
```

## 7. Implementation Phases

### 7.1 Phase 1: Foundation (Week 1)
- **Deliverables:**
  - Database schema design and creation
  - TheTVDB API integration and authentication
  - Basic TV show search and enrichment
- **Success Criteria:**
  - Can search TheTVDB and retrieve show metadata
  - Database tables created with proper relationships
  - Basic show record creation works

### 7.2 Phase 2: Core Functionality (Week 2)
- **Deliverables:**
  - Supabase Edge Function for TV webhooks
  - RSS feed processing for TV episodes
  - Episode watch recording
- **Success Criteria:**
  - Process TV webhooks from EchoFeed successfully
  - Create show and episode records automatically
  - Record episode watches with proper metadata

### 7.3 Phase 3: API Endpoints (Week 3)
- **Deliverables:**
  - All GET endpoints for TV data
  - Currently watching logic implementation
  - Episode chronological ordering
- **Success Criteria:**
  - All API endpoints return expected data formats
  - Currently watching calculation works correctly
  - Performance meets sub-500ms requirement

### 7.4 Phase 4: Client Library (Week 4)
- **Deliverables:**
  - JavaScript client library for TV APIs
  - HTML generation utilities
  - Documentation updates
- **Success Criteria:**
  - Client library mirrors movie API functionality
  - HTML widgets generate properly
  - Documentation is comprehensive and accurate

## 8. Testing Strategy

### 8.1 Unit Testing
- TheTVDB API integration functions
- RSS feed parsing for different sources
- Currently watching calculation logic
- Database query performance optimization

### 8.2 Integration Testing
- End-to-end webhook processing
- Show enrichment with actual TheTVDB data
- Client library API interactions
- Cross-browser compatibility testing

### 8.3 Performance Testing
- API response times under load
- Database query optimization validation
- TheTVDB API rate limiting handling
- Large dataset currently watching calculation

### 8.4 User Acceptance Testing
- Process real Letterboxd/Trakt.tv TV feeds
- Verify currently watching accuracy
- Test episode chronological ordering
- Validate show progress calculations

## 9. Risks & Mitigation

### 9.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| TheTVDB API changes | High | Medium | Version API calls, implement fallbacks |
| RSS format variations | Medium | High | Robust parsing with fallbacks |
| Performance degradation | High | Low | Database optimization, caching |
| Data inconsistency | Medium | Medium | Comprehensive validation, constraints |

### 9.2 Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Feature complexity | Medium | High | Phased implementation, MVP focus |
| TheTVDB rate limiting | Low | Medium | Implement request throttling |
| User adoption | Low | Low | Clear documentation, examples |

## 10. Success Metrics & KPIs

### 10.1 Technical Metrics
- **API Response Time**: <500ms for 95% of requests
- **Webhook Success Rate**: >99% of TV episode webhooks processed
- **Enrichment Coverage**: >90% of shows enriched with TheTVDB data
- **Database Performance**: <100ms for currently watching queries

### 10.2 Functional Metrics
- **Currently Watching Accuracy**: Manual validation shows 100% accuracy
- **Episode Parsing Success**: >95% of RSS episodes parsed correctly
- **Show Deduplication**: No duplicate shows in database
- **Data Completeness**: All enriched shows have required metadata fields

### 10.3 User Experience Metrics
- **API Documentation**: Complete coverage of all endpoints
- **Client Library**: Feature parity with movie functionality
- **Error Handling**: Graceful degradation for all failure modes

## 11. Future Considerations

### 11.1 Potential Enhancements
- **Season-level tracking**: Group episodes by season with progress
- **Watch streaks**: Calculate consecutive daily watching streaks
- **Recommendations**: Suggest shows based on viewing patterns
- **Social features**: Share currently watching status
- **Mobile app**: Native iOS/Android clients

### 11.2 Scalability Planning
- **Caching layer**: Redis for frequently accessed show data
- **CDN integration**: Optimize image delivery for posters/backdrops
- **Database partitioning**: Partition watches by date for performance
- **API versioning**: Prepare for v2 API with breaking changes

### 11.3 Integration Opportunities
- **Additional sources**: Plex, Jellyfin, or other media servers
- **Metadata providers**: Supplement TheTVDB with TMDB TV data
- **Analytics platforms**: Export data to external analytics tools
- **Calendar integration**: Show air dates and watch scheduling

---

**Document Control**
- **Version**: 1.0
- **Last Updated**: 2025-09-15
- **Next Review**: 2025-09-22
- **Approvers**: Product Owner, Technical Lead
- **Distribution**: Development Team, Stakeholders
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-09-15

### Added
- Initial release of Movie Tracking API
- Supabase Edge Function for processing movie activity
- Support for Letterboxd RSS feed integration via EchoFeed webhooks
- Support for Trakt.tv RSS feed integration
- Movie database schema with deduplication
- Watch tracking with ratings and reviews
- REST API endpoints for movies, watches, and stats
- JavaScript API client for building movie websites
- Data backfill utilities for Trakt.tv
- Basic movie metadata extraction and storage

### Features
- RSS feed processing from multiple sources (Letterboxd, Trakt.tv, generic)
- Star rating extraction (1-5 stars for Letterboxd)
- Movie deduplication via external IDs and title/year matching
- Flexible metadata storage with JSONB fields
- RESTful API for accessing movie data
- HTML generation utilities for common widgets

[0.1.0]: https://github.com/your-username/msb-api/releases/tag/v0.1.0
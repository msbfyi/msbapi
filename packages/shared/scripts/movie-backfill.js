// movie-backfill.js - Backfill movies from Trakt.tv to new movie system
// Using built-in fetch (Node.js 18+)
require('dotenv').config()

// Configuration loaded from environment variables
const CONFIG = {
  traktApiKey: process.env.TRAKT_API_KEY,
  traktUsername: process.env.TRAKT_USERNAME,
  movieApiUrl: process.env.MOVIE_API_URL,
  maxMovies: parseInt(process.env.TRAKT_MAX_MOVIES) || 5,
}

class MovieBackfill {
  constructor(config) {
    this.config = config
    this.stats = {
      moviesProcessed: 0,
      watchesAdded: 0,
      errors: 0,
      skipped: 0,
    }
    this.processedMovies = new Set() // Track to avoid duplicates

    // Rate limiting: Trakt allows 1000 requests per 5 minutes
    this.requestDelay = 350 // 350ms between requests
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const prefix =
      type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'
    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  // Make Trakt API request with rate limiting
  async traktRequest(endpoint) {
    const url = `https://api.trakt.tv${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': this.config.traktApiKey,
    }

    try {
      this.log(`Fetching: ${endpoint}`)
      const response = await fetch(url, { headers })

      if (!response.ok) {
        throw new Error(`Trakt API Error: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, this.requestDelay))

      return data
    } catch (error) {
      this.log(`Error fetching ${endpoint}: ${error.message}`, 'error')
      throw error
    }
  }

  // Send movie data to our movie API
  async sendToMovieAPI(movieData) {
    try {
      const response = await fetch(this.config.movieApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movieData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Movie API Error: ${response.status} - ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      this.log(`Error sending to Movie API: ${error.message}`, 'error')
      throw error
    }
  }

  // Transform Trakt movie data to EchoFeed-like format
  transformTraktMovie(traktMovie, watchData = null, ratingData = null) {
    const movie = traktMovie.movie

    // Create a feed item that mimics what EchoFeed would send
    const feedItem = {
      title: movie.title,
      year: movie.year,
      trakt_id: movie.ids.trakt.toString(),
      content: this.buildMovieContent(movie, watchData, ratingData),
      link: `https://trakt.tv/movies/${movie.ids.slug}`,
      guid: `trakt-movie-${movie.ids.trakt}`,
      pubDate: watchData?.watched_at || new Date().toISOString(),
    }

    return {
      item: feedItem,
      source: 'trakt-backfill',
    }
  }

  // Build content string for the movie (simulates review content)
  buildMovieContent(movie, watchData, ratingData) {
    let content = ''

    // Add rating if available (convert 10-point to 5-point scale)
    if (ratingData?.rating) {
      const fiveStarRating = Math.round(ratingData.rating / 2)
      content += '★'.repeat(fiveStarRating) + '☆'.repeat(5 - fiveStarRating) + ' '
    }

    // Add basic movie info
    if (movie.overview) {
      content += movie.overview.substring(0, 200) + '...'
    } else {
      content += `Watched ${movie.title}`
      if (movie.year) content += ` (${movie.year})`
    }

    // Add metadata
    if (movie.genres && movie.genres.length > 0) {
      content += `\n\nGenres: ${movie.genres.join(', ')}`
    }

    if (movie.runtime) {
      content += `\nRuntime: ${movie.runtime} minutes`
    }

    return content
  }

  // Get movie ratings from Trakt
  async getMovieRatings() {
    this.log('Fetching movie ratings...')

    try {
      const ratings = await this.traktRequest(`/users/${this.config.traktUsername}/ratings/movies`)
      this.log(`Found ${ratings.length} movie ratings`)

      // Create a map for quick lookup
      const ratingsMap = new Map()
      ratings.forEach(rating => {
        ratingsMap.set(rating.movie.ids.trakt, rating)
      })

      return ratingsMap
    } catch (error) {
      this.log(`Failed to fetch ratings: ${error.message}`, 'warning')
      return new Map()
    }
  }

  // Get movie watch history from Trakt
  async getMovieHistory() {
    this.log('Fetching movie watch history...')

    try {
      let endpoint = `/users/${this.config.traktUsername}/history/movies`
      if (this.config.maxMovies) {
        endpoint += `?limit=${this.config.maxMovies}`
      }

      const history = await this.traktRequest(endpoint)
      this.log(`Found ${history.length} movie watches in history`)

      return history
    } catch (error) {
      this.log(`Failed to fetch movie history: ${error.message}`, 'error')
      throw error
    }
  }

  // Get watched movies with play counts
  async getWatchedMovies() {
    this.log('Fetching watched movies...')

    try {
      let endpoint = `/users/${this.config.traktUsername}/watched/movies`

      const watchedMovies = await this.traktRequest(endpoint)
      this.log(`Found ${watchedMovies.length} unique watched movies`)

      return watchedMovies
    } catch (error) {
      this.log(`Failed to fetch watched movies: ${error.message}`, 'error')
      throw error
    }
  }

  // Process movie history (with timestamps)
  async processMovieHistory() {
    this.log('Starting movie history backfill...')

    try {
      // Get ratings for enrichment
      const ratingsMap = await this.getMovieRatings()

      // Get watch history
      const movieHistory = await this.getMovieHistory()

      this.log(`Processing ${movieHistory.length} movie watch entries...`)

      for (let i = 0; i < movieHistory.length; i++) {
        const historyEntry = movieHistory[i]
        const movie = historyEntry.movie

        try {
          // Check if we already processed this specific watch
          const watchKey = `${movie.ids.trakt}-${historyEntry.watched_at}`
          if (this.processedMovies.has(watchKey)) {
            this.stats.skipped++
            this.log(`Skipping duplicate watch: ${movie.title}`, 'warning')
            continue
          }

          // Get rating for this movie
          const ratingData = ratingsMap.get(movie.ids.trakt)

          // Transform to our format
          const movieData = this.transformTraktMovie(historyEntry, historyEntry, ratingData)

          // Send to movie API
          const result = await this.sendToMovieAPI(movieData)

          this.stats.moviesProcessed++
          this.stats.watchesAdded++
          this.processedMovies.add(watchKey)

          this.log(
            `✓ Processed: ${movie.title} (${movie.year}) - ${historyEntry.watched_at}`,
            'success'
          )

          // Progress update
          if ((i + 1) % 10 === 0) {
            this.log(`Progress: ${i + 1}/${movieHistory.length} watches processed`)
          }
        } catch (error) {
          this.stats.errors++
          this.log(`Failed to process ${movie.title}: ${error.message}`, 'error')
          continue // Continue with next movie
        }
      }

      this.log(`Movie history backfill completed!`, 'success')
    } catch (error) {
      this.log(`Movie history backfill failed: ${error.message}`, 'error')
      throw error
    }
  }

  // Process watched movies (for movies without detailed history)
  async processWatchedMovies() {
    this.log('Starting watched movies backfill...')

    try {
      // Get ratings and watched movies
      const [ratingsMap, watchedMovies] = await Promise.all([
        this.getMovieRatings(),
        this.getWatchedMovies(),
      ])

      this.log(`Processing ${watchedMovies.length} watched movies...`)

      for (let i = 0; i < watchedMovies.length; i++) {
        const watchedMovie = watchedMovies[i]
        const movie = watchedMovie.movie

        try {
          // Skip if we already processed this movie from history
          const movieKey = `movie-${movie.ids.trakt}`
          if (this.processedMovies.has(movieKey)) {
            this.stats.skipped++
            continue
          }

          // Get rating for this movie
          const ratingData = ratingsMap.get(movie.ids.trakt)

          // Use last watched date or rating date
          const watchDate =
            watchedMovie.last_watched_at || ratingData?.rated_at || new Date().toISOString()

          // Create watch data
          const watchData = {
            watched_at: watchDate,
            plays: watchedMovie.plays || 1,
          }

          // Transform to our format
          const movieData = this.transformTraktMovie({ movie }, watchData, ratingData)

          // Send to movie API
          const result = await this.sendToMovieAPI(movieData)

          this.stats.moviesProcessed++
          this.stats.watchesAdded++
          this.processedMovies.add(movieKey)

          this.log(
            `✓ Processed: ${movie.title} (${movie.year}) - ${watchedMovie.plays} play(s)`,
            'success'
          )

          // Progress update
          if ((i + 1) % 10 === 0) {
            this.log(`Progress: ${i + 1}/${watchedMovies.length} movies processed`)
          }
        } catch (error) {
          this.stats.errors++
          this.log(`Failed to process ${movie.title}: ${error.message}`, 'error')
          continue
        }
      }

      this.log(`Watched movies backfill completed!`, 'success')
    } catch (error) {
      this.log(`Watched movies backfill failed: ${error.message}`, 'error')
      throw error
    }
  }

  // Main backfill process
  async run(mode = 'history') {
    const startTime = Date.now()
    this.log('🎬 Starting Trakt.tv movie backfill process...')

    try {
      // Test Trakt connection
      this.log('Testing Trakt.tv connection...')
      const userProfile = await this.traktRequest(`/users/${this.config.traktUsername}`)
      this.log(`✓ Connected to Trakt! User: ${userProfile.name} (@${userProfile.username})`)

      // Test movie API connection
      this.log('Testing Movie API connection...')
      const testResponse = await fetch(this.config.movieApiUrl)
      if (testResponse.ok) {
        this.log('✓ Movie API is accessible')
      } else {
        throw new Error(`Movie API returned status ${testResponse.status}`)
      }

      // Run backfill based on mode
      if (mode === 'history') {
        // Backfill with detailed watch history (includes timestamps)
        await this.processMovieHistory()
      } else if (mode === 'watched') {
        // Backfill watched movies (less detailed but faster)
        await this.processWatchedMovies()
      } else if (mode === 'both') {
        // Do both - history first, then fill gaps with watched
        await this.processMovieHistory()
        await this.processWatchedMovies()
      }

      // Final stats
      const duration = Math.round((Date.now() - startTime) / 1000)
      this.log('\n🎉 Movie backfill completed successfully!')
      this.log(`📊 Final Stats:`)
      this.log(`   Movies Processed: ${this.stats.moviesProcessed}`)
      this.log(`   Watches Added: ${this.stats.watchesAdded}`)
      this.log(`   Errors: ${this.stats.errors}`)
      this.log(`   Skipped: ${this.stats.skipped}`)
      this.log(`   Duration: ${duration} seconds`)

      if (this.stats.errors > 0) {
        this.log(`⚠️  There were ${this.stats.errors} errors during processing`, 'warning')
      }
    } catch (error) {
      this.log(`❌ Movie backfill failed: ${error.message}`, 'error')
      process.exit(1)
    }
  }

  // Show current progress stats
  showStats() {
    this.log('\n📊 Current Stats:')
    this.log(`   Movies: ${this.stats.moviesProcessed}`)
    this.log(`   Watches: ${this.stats.watchesAdded}`)
    this.log(`   Errors: ${this.stats.errors}`)
    this.log(`   Skipped: ${this.stats.skipped}`)
  }
}

// Main function
async function main() {
  // Validate configuration
  if (!CONFIG.traktApiKey) {
    console.error('❌ Please set TRAKT_API_KEY in .env file')
    console.error('   Get it from: https://trakt.tv/oauth/applications')
    process.exit(1)
  }

  if (!CONFIG.traktUsername) {
    console.error('❌ Please set TRAKT_USERNAME in .env file')
    process.exit(1)
  }

  if (!CONFIG.movieApiUrl) {
    console.error('❌ Please set MOVIE_API_URL in .env file')
    console.error('   Format: https://your-project.supabase.co/functions/v1/movies')
    process.exit(1)
  }

  const backfill = new MovieBackfill(CONFIG)

  // Get mode from command line argument
  const mode = process.argv[2] || 'history'

  if (!['history', 'watched', 'both'].includes(mode)) {
    console.error('❌ Invalid mode. Use: history, watched, or both')
    console.error('   node movie-backfill.js history   # Detailed watch history with timestamps')
    console.error('   node movie-backfill.js watched   # Basic watched movies')
    console.error('   node movie-backfill.js both      # Both methods (recommended)')
    process.exit(1)
  }

  console.log(`🎬 Starting backfill in '${mode}' mode...`)
  await backfill.run(mode)
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MovieBackfill
}

// Run if called directly
if (typeof require !== 'undefined' && require.main === module) {
  main().catch(console.error)
}

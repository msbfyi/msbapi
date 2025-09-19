// tmdb-enricher.js - Enrich movies with TMDB data (posters, metadata)
// Using built-in fetch (Node.js 18+)
require('dotenv').config()

// Configuration loaded from environment variables
const CONFIG = {
  tmdbApiKey: process.env.TMDB_API_KEY,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_KEY,
  batchSize: parseInt(process.env.TMDB_BATCH_SIZE) || 50,
  imageSize: process.env.TMDB_IMAGE_SIZE || 'w500',
  backdropSize: process.env.TMDB_BACKDROP_SIZE || 'w1280',
  updateExisting: process.env.TMDB_UPDATE_EXISTING === 'true' || false,
  onlyMissingPosters: process.env.TMDB_ONLY_MISSING_POSTERS !== 'false',
}

class TMDBEnricher {
  constructor(config) {
    this.config = config
    this.stats = {
      moviesProcessed: 0,
      moviesEnriched: 0,
      moviesNotFound: 0,
      postersAdded: 0,
      backdropsAdded: 0,
      metadataUpdated: 0,
      errors: 0,
      skipped: 0,
    }

    // TMDB API rate limiting: 40 requests per 10 seconds
    this.requestDelay = 250 // 250ms between requests to be safe
    this.tmdbBaseUrl = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3'
    this.tmdbImageBaseUrl = process.env.TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p'
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const prefix =
      type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'
    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  // Make TMDB API request with rate limiting
  async tmdbRequest(endpoint, params = {}) {
    const url = new URL(`${this.tmdbBaseUrl}${endpoint}`)
    url.searchParams.append('api_key', this.config.tmdbApiKey)

    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, value)
      }
    })

    try {
      const response = await fetch(url.toString())

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited, wait longer
          this.log('Rate limited, waiting 2 seconds...', 'warning')
          await new Promise(resolve => setTimeout(resolve, 2000))
          return this.tmdbRequest(endpoint, params) // Retry
        }
        throw new Error(`TMDB API Error: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, this.requestDelay))

      return data
    } catch (error) {
      this.log(`Error fetching TMDB ${endpoint}: ${error.message}`, 'error')
      throw error
    }
  }

  // Make Supabase API request
  async supabaseRequest(table, operation, data = null, filters = null) {
    const url = `${this.config.supabaseUrl}/rest/v1/${table}`
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.config.supabaseKey}`,
      apikey: this.config.supabaseKey,
      Prefer: 'return=representation',
    }

    let requestUrl = url
    let requestOptions = { headers }

    switch (operation) {
      case 'select':
        requestOptions.method = 'GET'
        if (filters) {
          const params = new URLSearchParams(filters)
          requestUrl += `?${params.toString()}`
        }
        break

      case 'update':
        requestOptions.method = 'PATCH'
        requestOptions.body = JSON.stringify(data)
        if (filters) {
          const params = new URLSearchParams(filters)
          requestUrl += `?${params.toString()}`
        }
        break
    }

    try {
      const response = await fetch(requestUrl, requestOptions)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Supabase API Error: ${response.status} - ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      this.log(`Error with Supabase ${operation} on ${table}: ${error.message}`, 'error')
      throw error
    }
  }

  // Search for movie on TMDB
  async searchTMDBMovie(title, year = null) {
    try {
      const params = { query: title }
      if (year) {
        params.year = year
        params.primary_release_year = year
      }

      const searchResults = await this.tmdbRequest('/search/movie', params)

      if (!searchResults.results || searchResults.results.length === 0) {
        return null
      }

      // Find best match
      let bestMatch = searchResults.results[0]

      if (year) {
        // Try to find exact year match
        const exactYearMatch = searchResults.results.find(movie => {
          const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : null
          return releaseYear === year
        })

        if (exactYearMatch) {
          bestMatch = exactYearMatch
        }
      }

      return bestMatch
    } catch (error) {
      this.log(`Error searching TMDB for "${title}": ${error.message}`, 'error')
      return null
    }
  }

  // Get detailed movie info from TMDB
  async getTMDBMovieDetails(tmdbId) {
    try {
      const details = await this.tmdbRequest(`/movie/${tmdbId}`, {
        append_to_response: 'credits,videos,keywords',
      })

      return details
    } catch (error) {
      this.log(`Error getting TMDB details for ID ${tmdbId}: ${error.message}`, 'error')
      return null
    }
  }

  // Build full image URLs
  buildImageUrls(tmdbMovie) {
    const posterUrl = tmdbMovie.poster_path
      ? `${this.tmdbImageBaseUrl}/${this.config.imageSize}${tmdbMovie.poster_path}`
      : null

    const backdropUrl = tmdbMovie.backdrop_path
      ? `${this.tmdbImageBaseUrl}/${this.config.backdropSize}${tmdbMovie.backdrop_path}`
      : null

    return { posterUrl, backdropUrl }
  }

  // Extract enriched data from TMDB movie
  extractEnrichedData(tmdbMovie, tmdbDetails = null) {
    const data = tmdbDetails || tmdbMovie
    const { posterUrl, backdropUrl } = this.buildImageUrls(data)

    const enrichedData = {
      poster_url: posterUrl,
      backdrop_url: backdropUrl,
      tmdb_id: data.id?.toString(),
      plot_summary: data.overview || null,
      mpaa_rating: null, // Would need additional API call for US ratings
      country: data.production_countries?.[0]?.iso_3166_1 || null,
      language: data.original_language || null,
      budget: data.budget || null,
      box_office: data.revenue || null,
    }

    // Add director from credits if available
    if (tmdbDetails?.credits?.crew) {
      const director = tmdbDetails.credits.crew.find(person => person.job === 'Director')
      if (director) {
        enrichedData.director = director.name
      }
    }

    // Add genres if available
    if (data.genres) {
      enrichedData.genres = data.genres.map(genre => genre.name)
    }

    // Add trailer URL if available
    if (tmdbDetails?.videos?.results) {
      const trailer = tmdbDetails.videos.results.find(
        video => video.type === 'Trailer' && video.site === 'YouTube'
      )
      if (trailer) {
        enrichedData.trailer_url = `https://www.youtube.com/watch?v=${trailer.key}`
      }
    }

    return enrichedData
  }

  // Get movies from database that need enrichment
  async getMoviesToEnrich() {
    try {
      let filters = {
        select: 'id,title,year,poster_url,backdrop_url,tmdb_id',
      }

      if (this.config.onlyMissingPosters) {
        filters['poster_url'] = 'is.null'
      } else if (!this.config.updateExisting) {
        filters['or'] = '(poster_url.is.null,backdrop_url.is.null)'
      }

      const movies = await this.supabaseRequest('movies', 'select', null, filters)

      this.log(`Found ${movies.length} movies to enrich`)
      return movies || []
    } catch (error) {
      this.log(`Error fetching movies from database: ${error.message}`, 'error')
      throw error
    }
  }

  // Enrich a single movie
  async enrichMovie(movie) {
    try {
      this.log(`Enriching: ${movie.title} (${movie.year})`)

      // Skip if already has TMDB ID and poster (unless updating existing)
      if (movie.tmdb_id && movie.poster_url && !this.config.updateExisting) {
        this.stats.skipped++
        this.log(`Skipping ${movie.title} - already enriched`, 'warning')
        return
      }

      let tmdbMovie = null
      let tmdbDetails = null

      // If we have TMDB ID, get details directly
      if (movie.tmdb_id) {
        tmdbDetails = await this.getTMDBMovieDetails(movie.tmdb_id)
        if (tmdbDetails) {
          tmdbMovie = tmdbDetails
        }
      }

      // If no TMDB ID or details not found, search
      if (!tmdbMovie) {
        tmdbMovie = await this.searchTMDBMovie(movie.title, movie.year)

        if (!tmdbMovie) {
          this.stats.moviesNotFound++
          this.log(`Movie not found on TMDB: ${movie.title} (${movie.year})`, 'warning')
          return
        }

        // Get detailed info
        tmdbDetails = await this.getTMDBMovieDetails(tmdbMovie.id)
      }

      // Extract enriched data
      const enrichedData = this.extractEnrichedData(tmdbMovie, tmdbDetails)

      // Filter out null values and empty strings
      const updateData = Object.fromEntries(
        Object.entries(enrichedData).filter(
          ([key, value]) => value !== null && value !== undefined && value !== ''
        )
      )

      if (Object.keys(updateData).length === 0) {
        this.log(`No enrichment data found for: ${movie.title}`, 'warning')
        return
      }

      // Update movie in database
      await this.supabaseRequest('movies', 'update', updateData, {
        id: `eq.${movie.id}`,
      })

      // Update stats
      this.stats.moviesEnriched++
      if (updateData.poster_url) this.stats.postersAdded++
      if (updateData.backdrop_url) this.stats.backdropsAdded++
      if (updateData.plot_summary || updateData.director || updateData.genres) {
        this.stats.metadataUpdated++
      }

      this.log(`✓ Enriched: ${movie.title} - ${Object.keys(updateData).join(', ')}`, 'success')
    } catch (error) {
      this.stats.errors++
      this.log(`Failed to enrich ${movie.title}: ${error.message}`, 'error')
    }
  }

  // Process movies in batches
  async processBatch(movies, batchIndex) {
    const batchStart = batchIndex * this.config.batchSize
    const batchEnd = Math.min(batchStart + this.config.batchSize, movies.length)
    const batch = movies.slice(batchStart, batchEnd)

    this.log(
      `Processing batch ${batchIndex + 1}: ${batchStart + 1}-${batchEnd} of ${movies.length}`
    )

    for (let i = 0; i < batch.length; i++) {
      const movie = batch[i]

      try {
        await this.enrichMovie(movie)
        this.stats.moviesProcessed++

        // Progress within batch
        if ((i + 1) % 10 === 0) {
          this.log(`Batch progress: ${i + 1}/${batch.length} movies`)
        }
      } catch (error) {
        this.stats.errors++
        this.log(`Error in batch processing: ${error.message}`, 'error')
        continue
      }
    }
  }

  // Main enrichment process
  async run() {
    const startTime = Date.now()
    this.log('🎨 Starting TMDB movie enrichment process...')

    try {
      // Test TMDB API connection
      this.log('Testing TMDB API connection...')
      const testResult = await this.tmdbRequest('/configuration')
      this.log('✓ TMDB API connection successful')

      // Test Supabase connection
      this.log('Testing Supabase connection...')
      await this.supabaseRequest('movies', 'select', null, { limit: '1' })
      this.log('✓ Supabase connection successful')

      // Get movies to enrich
      const movies = await this.getMoviesToEnrich()

      if (movies.length === 0) {
        this.log('No movies found that need enrichment', 'warning')
        return
      }

      // Calculate number of batches
      const totalBatches = Math.ceil(movies.length / this.config.batchSize)
      this.log(`Will process ${movies.length} movies in ${totalBatches} batches`)

      // Process in batches
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        await this.processBatch(movies, batchIndex)

        // Small delay between batches
        if (batchIndex < totalBatches - 1) {
          this.log('Pausing between batches...')
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      // Final stats
      const duration = Math.round((Date.now() - startTime) / 1000)
      this.log('\n🎉 TMDB enrichment completed successfully!')
      this.log(`🎨 Final Stats:`)
      this.log(`   Movies Processed: ${this.stats.moviesProcessed}`)
      this.log(`   Movies Enriched: ${this.stats.moviesEnriched}`)
      this.log(`   Posters Added: ${this.stats.postersAdded}`)
      this.log(`   Backdrops Added: ${this.stats.backdropsAdded}`)
      this.log(`   Metadata Updated: ${this.stats.metadataUpdated}`)
      this.log(`   Movies Not Found: ${this.stats.moviesNotFound}`)
      this.log(`   Errors: ${this.stats.errors}`)
      this.log(`   Skipped: ${this.stats.skipped}`)
      this.log(`   Duration: ${duration} seconds`)

      if (this.stats.errors > 0) {
        this.log(`⚠️  There were ${this.stats.errors} errors during processing`, 'warning')
      }

      if (this.stats.moviesNotFound > 0) {
        this.log(
          `📝 ${this.stats.moviesNotFound} movies not found on TMDB (check titles/years)`,
          'info'
        )
      }
    } catch (error) {
      this.log(`❌ TMDB enrichment failed: ${error.message}`, 'error')
      process.exit(1)
    }
  }

  // Show sample of movies that will be enriched
  async preview() {
    this.log('🔍 Previewing movies that will be enriched...')

    try {
      const movies = await this.getMoviesToEnrich()

      if (movies.length === 0) {
        this.log('No movies found that need enrichment', 'warning')
        return
      }

      this.log(`\n📋 Sample of ${Math.min(10, movies.length)} movies to be enriched:`)

      const sample = movies.slice(0, 10)
      for (const movie of sample) {
        const status = movie.poster_url ? '🖼️' : '📝'
        this.log(`   ${status} ${movie.title} (${movie.year})`)
      }

      if (movies.length > 10) {
        this.log(`   ... and ${movies.length - 10} more movies`)
      }

      this.log(`\n📊 Summary:`)
      this.log(`   Total movies to enrich: ${movies.length}`)
      this.log(`   Estimated time: ${Math.round((movies.length * 0.3) / 60)} minutes`)
      this.log(`   API calls needed: ~${movies.length * 2}`)
    } catch (error) {
      this.log(`Error during preview: ${error.message}`, 'error')
    }
  }
}

// Main function
async function main() {
  // Validate configuration
  const requiredFields = ['tmdbApiKey', 'supabaseUrl', 'supabaseKey']

  for (const field of requiredFields) {
    if (!CONFIG[field]) {
      const envVar =
        field === 'tmdbApiKey'
          ? 'TMDB_API_KEY'
          : field === 'supabaseUrl'
            ? 'SUPABASE_URL'
            : field === 'supabaseKey'
              ? 'SUPABASE_SERVICE_KEY'
              : field
      console.error(`❌ Please set ${envVar} in .env file`)
      if (field === 'tmdbApiKey') {
        console.error('   Get it from: https://www.themoviedb.org/settings/api')
        console.error('   1. Create TMDB account')
        console.error('   2. Go to Settings > API')
        console.error('   3. Request API key')
        console.error('   4. Copy "API Key (v3 auth)"')
      }
      if (field === 'supabaseKey') {
        console.error('   Get service role key from: Supabase Dashboard > Settings > API')
      }
      process.exit(1)
    }
  }

  const enricher = new TMDBEnricher(CONFIG)

  // Get command from command line argument
  const command = process.argv[2] || 'run'

  if (command === 'preview' || command === 'show') {
    await enricher.preview()
  } else if (command === 'debug') {
    await enricher.debug()
  } else if (command === 'run' || command === 'enrich') {
    await enricher.run()
  } else {
    console.error('❌ Invalid command. Use:')
    console.error('   node tmdb-enricher.js preview  # Show what will be enriched')
    console.error('   node tmdb-enricher.js debug    # Debug database state')
    console.error('   node tmdb-enricher.js run      # Run the enrichment')
    process.exit(1)
  }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TMDBEnricher
}

// Run if called directly
if (typeof require !== 'undefined' && require.main === module) {
  main().catch(console.error)
}

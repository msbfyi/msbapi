// supabase/functions/movies/index.ts
// Movie function with automatic TMDB enrichment

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
)

// TMDB configuration
const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY')
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'

Deno.serve(async req => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log(`${req.method} ${req.url}`)

  try {
    const url = new URL(req.url)
    const path = url.pathname

    // Handle EchoFeed webhooks (POST requests)
    if (req.method === 'POST') {
      return await handleEchoFeedWebhook(req, corsHeaders)
    }

    // Handle DELETE requests for cleanup
    if (req.method === 'DELETE' && path.includes('/cleanup')) {
      return await handleCleanup(req, corsHeaders)
    }

    // Handle debug endpoint
    if (path.includes('/debug') && req.method === 'POST') {
      const payload = await req.json()
      console.log('=== DEBUG WEBHOOK PAYLOAD ===')
      console.log(JSON.stringify(payload, null, 2))
      console.log('=== END DEBUG ===')

      return new Response(
        JSON.stringify({
          message: 'Debug payload logged',
          payload: payload,
          keys: Object.keys(payload),
          hasItem: !!payload.item,
          hasTitle: !!payload.title,
          hasId: !!payload.id,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Handle GET requests [previous GET endpoints remain the same]
    if (path.includes('/movie/') && path.split('/').length >= 3) {
      const movieId = path.split('/')[2]
      return await getMovieById(movieId, corsHeaders)
    }

    if (path.includes('/movies') || path === '/') {
      return await getMovies(req, corsHeaders)
    }

    if (path.includes('/watches')) {
      return await getWatches(req, corsHeaders)
    }

    if (path.includes('/stats')) {
      return await getMovieStats(corsHeaders)
    }

    // Default response
    return new Response(
      JSON.stringify({
        message: 'Movie API with Auto-TMDB Enrichment!',
        endpoints: {
          'POST /movies': 'Process webhooks + auto-enrich',
          'GET /movies': 'Get enriched movies',
          'GET /movies/movie/{id}': 'Get movie details',
          'GET /movies/watches': 'Get recent watches',
          'GET /movies/stats': 'Get statistics',
        },
        features: [
          'Automatic TMDB enrichment for new movies',
          'Poster and backdrop URLs',
          'Plot summaries and metadata',
          'Director and genre information',
        ],
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('API Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  }
})

// TMDB Helper Functions
async function tmdbRequest(endpoint, params = {}) {
  if (!TMDB_API_KEY) {
    console.warn('TMDB_API_KEY not set, skipping enrichment')
    return null
  }

  const url = new URL(`${TMDB_BASE_URL}${endpoint}`)
  url.searchParams.append('api_key', TMDB_API_KEY)

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.append(key, value)
    }
  })

  try {
    console.log(`TMDB Request: ${endpoint}`)
    const response = await fetch(url.toString())

    if (!response.ok) {
      console.error(`TMDB API Error: ${response.status}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error(`TMDB request failed: ${error.message}`)
    return null
  }
}

async function searchTMDBMovie(title, year = null) {
  const params = { query: title }
  if (year) {
    params.year = year
    params.primary_release_year = year
  }

  const searchResults = await tmdbRequest('/search/movie', params)

  if (!searchResults?.results || searchResults.results.length === 0) {
    return null
  }

  // Find best match
  let bestMatch = searchResults.results[0]

  if (year) {
    const exactYearMatch = searchResults.results.find(movie => {
      const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : null
      return releaseYear === year
    })

    if (exactYearMatch) {
      bestMatch = exactYearMatch
    }
  }

  return bestMatch
}

async function getTMDBMovieDetails(tmdbId) {
  return await tmdbRequest(`/movie/${tmdbId}`, {
    append_to_response: 'credits,videos',
  })
}

function buildImageUrls(tmdbMovie) {
  const posterUrl = tmdbMovie.poster_path
    ? `${TMDB_IMAGE_BASE_URL}/w500${tmdbMovie.poster_path}`
    : null

  const backdropUrl = tmdbMovie.backdrop_path
    ? `${TMDB_IMAGE_BASE_URL}/w1280${tmdbMovie.backdrop_path}`
    : null

  return { posterUrl, backdropUrl }
}

function extractTMDBData(tmdbMovie, tmdbDetails = null) {
  const data = tmdbDetails || tmdbMovie
  const { posterUrl, backdropUrl } = buildImageUrls(data)

  const enrichedData = {
    poster_url: posterUrl,
    backdrop_url: backdropUrl,
    tmdb_id: data.id?.toString(),
    plot_summary: data.overview || null,
    country: data.production_countries?.[0]?.iso_3166_1 || null,
    language: data.original_language || null,
    budget: data.budget || null,
    box_office: data.revenue || null,
  }

  // Add director from credits
  if (tmdbDetails?.credits?.crew) {
    const director = tmdbDetails.credits.crew.find(person => person.job === 'Director')
    if (director) {
      enrichedData.director = director.name
    }
  }

  // Add genres
  if (data.genres) {
    enrichedData.genres = data.genres.map(genre => genre.name)
  }

  // Add trailer URL
  if (tmdbDetails?.videos?.results) {
    const trailer = tmdbDetails.videos.results.find(
      video => video.type === 'Trailer' && video.site === 'YouTube'
    )
    if (trailer) {
      enrichedData.trailer_url = `https://www.youtube.com/watch?v=${trailer.key}`
    }
  }

  // Filter out null values
  return Object.fromEntries(
    Object.entries(enrichedData).filter(
      ([key, value]) => value !== null && value !== undefined && value !== ''
    )
  )
}

async function enrichMovieWithTMDB(title, year) {
  try {
    console.log(`Enriching with TMDB: ${title} (${year})`)

    // Search for movie
    const tmdbMovie = await searchTMDBMovie(title, year)

    if (!tmdbMovie) {
      console.log(`Movie not found on TMDB: ${title} (${year})`)
      return {}
    }

    console.log(`Found TMDB movie: ${tmdbMovie.title} (ID: ${tmdbMovie.id})`)

    // Get detailed info
    const tmdbDetails = await getTMDBMovieDetails(tmdbMovie.id)

    // Extract enriched data
    const enrichedData = extractTMDBData(tmdbMovie, tmdbDetails)

    console.log(`TMDB enrichment added: ${Object.keys(enrichedData).join(', ')}`)

    return enrichedData
  } catch (error) {
    console.error(`TMDB enrichment failed for ${title}: ${error.message}`)
    return {}
  }
}

// Enhanced movie creation with automatic TMDB enrichment
async function upsertMovie(movieData) {
  console.log(`Upserting movie: ${movieData.title} (${movieData.year})`)

  // Check if movie exists first
  let existingMovie = null

  if (movieData.externalIds.letterboxd_id) {
    const { data } = await supabase
      .from('movies')
      .select('*')
      .eq('letterboxd_id', movieData.externalIds.letterboxd_id)
      .maybeSingle()
    existingMovie = data
  }

  if (!existingMovie && movieData.title && movieData.year) {
    const { data } = await supabase
      .from('movies')
      .select('*')
      .eq('title', movieData.title)
      .eq('year', movieData.year)
      .maybeSingle()
    existingMovie = data
  }

  if (existingMovie) {
    console.log(`Found existing movie: ${existingMovie.id}`)

    // If existing movie doesn't have poster, try to enrich it
    if (!existingMovie.poster_url && TMDB_API_KEY) {
      console.log('Existing movie missing poster, enriching...')
      const tmdbData = await enrichMovieWithTMDB(existingMovie.title, existingMovie.year)

      if (Object.keys(tmdbData).length > 0) {
        const { data: updatedMovie, error } = await supabase
          .from('movies')
          .update(tmdbData)
          .eq('id', existingMovie.id)
          .select()
          .single()

        if (!error) {
          console.log(`Enriched existing movie: ${existingMovie.title}`)
          return updatedMovie
        }
      }
    }

    return existingMovie
  }

  // Create new movie with TMDB enrichment
  console.log('Creating new movie...')

  const baseMovieData = {
    title: movieData.title,
    year: movieData.year,
    director: movieData.director,
    letterboxd_id: movieData.externalIds.letterboxd_id,
    trakt_id: movieData.externalIds.trakt_id,
  }

  // Try to get TMDB data for new movie
  let tmdbData = {}
  if (TMDB_API_KEY && movieData.title && movieData.year) {
    tmdbData = await enrichMovieWithTMDB(movieData.title, movieData.year)
  }

  // Merge base data with TMDB data
  const fullMovieData = { ...baseMovieData, ...tmdbData }

  const { data: newMovie, error } = await supabase
    .from('movies')
    .insert(fullMovieData)
    .select()
    .single()

  if (error) {
    console.error('Error creating movie:', error)
    throw error
  }

  const enrichmentStatus =
    Object.keys(tmdbData).length > 0
      ? ` + TMDB enriched (${Object.keys(tmdbData).join(', ')})`
      : ' (no TMDB enrichment)'

  console.log(`Created new movie: ${newMovie.id}${enrichmentStatus}`)
  return newMovie
}

// [Rest of the functions remain the same - webhook handling, data extraction, etc.]
async function handleEchoFeedWebhook(req, corsHeaders) {
  try {
    const payload = await req.json()
    console.log('EchoFeed webhook received:', JSON.stringify(payload, null, 2))

    // Handle different payload structures
    let feedItem = null

    if (payload.item) {
      // Standard format: { item: { ... } }
      feedItem = payload.item
    } else if (payload.id || payload.title) {
      // Direct format: { id: ..., title: ..., ... }
      feedItem = payload
    } else {
      throw new Error(
        'No valid feed item found in webhook payload. Expected either payload.item or direct payload with id/title fields'
      )
    }

    const result = await processMovieFeedItem(feedItem)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed movie: ${result.movie.title}`,
        enriched: !!result.movie.poster_url,
        result: result,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to process webhook',
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
}

async function processMovieFeedItem(feedItem) {
  console.log('Processing feed item:', feedItem.title)

  const movieData = await extractMovieData(feedItem)
  const movie = await upsertMovie(movieData) // This now includes automatic TMDB enrichment
  const watch = await createMovieWatch(movie.id, feedItem, movieData)

  return {
    movie: movie,
    watch: watch,
    action: 'movie_watch_recorded',
  }
}

// [Include all the previous extraction and watch creation functions here...]
// extractMovieData, extractLetterboxdData, extractTraktData, extractGenericData, createMovieWatch

async function extractMovieData(feedItem) {
  const { id, title, year, trakt_id, content, link, guid, pubDate, date } = feedItem

  const movieData = {
    title: null,
    year: null,
    director: null,
    rating: null,
    review: null,
    source: 'unknown',
    sourceUrl: link,
    watchedAt: pubDate || date || new Date().toISOString(),
    externalIds: {},
  }

  // Set title and year from various sources
  // Don't set title/year here - let the specific extraction functions handle parsing

  // If trakt_id is provided directly, use it
  if (trakt_id) {
    movieData.externalIds.trakt_id = trakt_id
  }

  // Extract numeric Trakt ID from EchoFeed id field if available
  if (id && !movieData.externalIds.trakt_id) {
    const traktIdMatch = id.match(/tag:trakt\.tv,\d+:Movie\/(\d+)\//)
    if (traktIdMatch) {
      movieData.externalIds.trakt_id = traktIdMatch[1]
    }
  }

  // Debug logging for troubleshooting
  console.log(
    `Initial extraction - raw title: "${title}", link: "${link}", has_trakt_id: ${!!movieData.externalIds.trakt_id}`
  )

  let extractedData
  if (link && link.includes('letterboxd.com')) {
    console.log('Using Letterboxd extraction')
    extractedData = await extractLetterboxdData(feedItem, movieData)
  } else if (link && link.includes('trakt.tv')) {
    console.log('Using Trakt extraction')
    extractedData = await extractTraktData(feedItem, movieData)
  } else if (movieData.externalIds.trakt_id) {
    // If we have a trakt_id but no trakt.tv link, still use Trakt extraction
    console.log('Using Trakt extraction (based on trakt_id)')
    extractedData = await extractTraktData(feedItem, movieData)
  } else {
    console.log('Using generic extraction')
    extractedData = await extractGenericData(feedItem, movieData)
  }

  console.log(
    `Final extracted data - title: "${extractedData.title}", year: ${extractedData.year}, trakt_id: ${extractedData.externalIds.trakt_id}`
  )
  return extractedData
}

async function extractLetterboxdData(feedItem, movieData) {
  const { title, content, link } = feedItem

  movieData.source = 'letterboxd'

  // Only parse title/year from title field if not already set
  if (!movieData.title) {
    const titleMatch = title.match(/^(.+?),\s*(\d{4})/)
    if (titleMatch) {
      movieData.title = titleMatch[1].trim()
      movieData.year = parseInt(titleMatch[2])
    } else {
      movieData.title = title
    }
  }

  if (content) {
    const ratingMatch = content.match(/★+/)
    if (ratingMatch) {
      movieData.rating = ratingMatch[0].length
    }
    movieData.review = content.replace(/<[^>]*>/g, '').trim()
  }

  const letterboxdMatch = link.match(/letterboxd\.com\/[^\/]+\/film\/([^\/]+)/)
  if (letterboxdMatch) {
    movieData.externalIds.letterboxd_id = letterboxdMatch[1]
  }

  return movieData
}

async function extractTraktData(feedItem, movieData) {
  const { title, content, link, summary } = feedItem

  movieData.source = 'trakt'

  // Always parse title/year from title field
  if (title) {
    // Handle both "Movie (Year)" and "Movie, Year" formats
    const titleMatch = title.match(/^(.+?)\s*[\(,]\s*(\d{4})[\)]?/)
    if (titleMatch) {
      movieData.title = titleMatch[1].trim()
      movieData.year = parseInt(titleMatch[2])
    } else {
      movieData.title = title.trim()
    }
  }

  // Extract review content from content or summary, handling HTML
  if (content) {
    movieData.review = content.replace(/<[^>]*>/g, '').trim()
    // Check for numeric ratings in content
    const ratingMatch = content.match(/(\d+(?:\.\d+)?)\s*\/\s*10/)
    if (ratingMatch) {
      movieData.rating = parseFloat(ratingMatch[1])
    }
  } else if (summary) {
    movieData.review = summary.replace(/<[^>]*>/g, '').trim()
  }

  // Extract Trakt ID from link (only if not already set)
  if (link && !movieData.externalIds.trakt_id) {
    const traktMatch = link.match(/trakt\.tv\/movies\/([^\/]+)/)
    if (traktMatch) {
      movieData.externalIds.trakt_id = traktMatch[1]
    }
  }

  console.log(
    `Trakt extraction result - title: "${movieData.title}", year: ${movieData.year}, review length: ${movieData.review?.length || 0}`
  )

  return movieData
}

async function extractGenericData(feedItem, movieData) {
  const { title, content } = feedItem

  movieData.source = 'generic'

  // Only parse title/year from title field if not already set
  if (!movieData.title) {
    const yearMatch = title.match(/\((\d{4})\)/)
    if (yearMatch) {
      movieData.year = parseInt(yearMatch[1])
      movieData.title = title.replace(/\s*\(\d{4}\)/, '').trim()
    } else {
      movieData.title = title
    }
  }

  if (content) {
    movieData.review = content.replace(/<[^>]*>/g, '').trim()
  }

  return movieData
}

async function createMovieWatch(movieId, feedItem, movieData) {
  console.log('Creating movie watch record...')

  const { data: watch, error } = await supabase
    .from('movie_watches')
    .insert({
      movie_id: movieId,
      watched_at: movieData.watchedAt,
      personal_rating: movieData.rating,
      review_text: movieData.review,
      source: movieData.source,
      source_url: movieData.sourceUrl,
      external_id: feedItem.guid || feedItem.link,
      metadata: {
        feed_title: feedItem.title,
        feed_content: feedItem.content,
        processed_at: new Date().toISOString(),
      },
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating watch:', error)
    throw error
  }

  console.log(`Created watch record: ${watch.id}`)
  return watch
}

// [Include the enhanced GET endpoints from the previous enhanced API...]
async function getMovies(req, corsHeaders) {
  const url = new URL(req.url)
  const limit = parseInt(url.searchParams.get('limit') || '50')
  const search = url.searchParams.get('search')
  const withPosters = url.searchParams.get('posters') === 'true'

  let query = supabase
    .from('movies')
    .select(
      `
      *,
      movie_watches (
        id,
        watched_at,
        personal_rating,
        review_text,
        source
      )
    `
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  if (withPosters) {
    query = query.not('poster_url', 'is', null)
  }

  const { data, error } = await query

  if (error) throw error

  const enhancedMovies = data.map(movie => ({
    ...movie,
    watch_count: movie.movie_watches?.length || 0,
    has_poster: !!movie.poster_url,
    has_backdrop: !!movie.backdrop_url,
  }))

  return new Response(
    JSON.stringify({
      count: enhancedMovies.length,
      movies: enhancedMovies,
    }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  )
}

async function getMovieById(movieId, corsHeaders) {
  const { data: movie, error } = await supabase
    .from('movies')
    .select(
      `
      *,
      movie_watches (
        id,
        watched_at,
        personal_rating,
        review_text,
        source,
        source_url
      )
    `
    )
    .eq('id', movieId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return new Response(JSON.stringify({ error: 'Movie not found' }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      })
    }
    throw error
  }

  return new Response(JSON.stringify(movie), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

async function getWatches(req, corsHeaders) {
  const url = new URL(req.url)
  const limit = parseInt(url.searchParams.get('limit') || '20')

  const { data, error } = await supabase
    .from('movie_watches')
    .select(
      `
      *,
      movies (
        id,
        title,
        year,
        director,
        poster_url,
        backdrop_url,
        genres
      )
    `
    )
    .order('watched_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return new Response(JSON.stringify({ count: data.length, watches: data }), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

async function handleCleanup(req, corsHeaders) {
  try {
    const { movieIds } = await req.json()

    if (!movieIds || !Array.isArray(movieIds)) {
      return new Response(JSON.stringify({ error: 'movieIds array is required' }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      })
    }

    console.log(`Cleaning up movies: ${movieIds.join(', ')}`)

    // First delete watch records
    const { data: deletedWatches, error: watchError } = await supabase
      .from('movie_watches')
      .delete()
      .in('movie_id', movieIds)

    if (watchError) {
      console.error('Error deleting watches:', watchError)
      throw watchError
    }

    // Then delete movie records
    const { data: deletedMovies, error: movieError } = await supabase
      .from('movies')
      .delete()
      .in('id', movieIds)

    if (movieError) {
      console.error('Error deleting movies:', movieError)
      throw movieError
    }

    console.log(
      `Deleted ${deletedWatches?.length || 0} watches and ${deletedMovies?.length || 0} movies`
    )

    return new Response(
      JSON.stringify({
        success: true,
        deleted: {
          watches: deletedWatches?.length || 0,
          movies: deletedMovies?.length || 0,
        },
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Cleanup error:', error)
    return new Response(
      JSON.stringify({
        error: 'Cleanup failed',
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
}

async function getMovieStats(corsHeaders) {
  const { data: movieCount } = await supabase.from('movies').select('id', { count: 'exact' })

  const { data: watchCount } = await supabase.from('movie_watches').select('id', { count: 'exact' })

  const { data: moviesWithPosters } = await supabase
    .from('movies')
    .select('id', { count: 'exact' })
    .not('poster_url', 'is', null)

  const { data: avgRating } = await supabase
    .from('movie_watches')
    .select('personal_rating')
    .not('personal_rating', 'is', null)

  const avgRatingValue =
    avgRating.length > 0
      ? avgRating.reduce((sum, w) => sum + w.personal_rating, 0) / avgRating.length
      : 0

  return new Response(
    JSON.stringify({
      total_movies: movieCount?.length || 0,
      total_watches: watchCount?.length || 0,
      movies_with_posters: moviesWithPosters?.length || 0,
      poster_coverage:
        movieCount?.length > 0
          ? Math.round(((moviesWithPosters?.length || 0) / movieCount.length) * 100)
          : 0,
      average_rating: Math.round(avgRatingValue * 10) / 10,
    }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  )
}

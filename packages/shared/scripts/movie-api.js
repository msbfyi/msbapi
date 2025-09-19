// movie-api.js - Client for movie tracking API

class MovieAPI {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, '') // Remove trailing slash
  }

  // Helper method for making requests
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API Error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // Get movies with optional filtering
  async getMovies(options = {}) {
    const params = new URLSearchParams()

    if (options.limit) params.append('limit', options.limit.toString())
    if (options.search) params.append('search', options.search)

    const query = params.toString() ? `?${params.toString()}` : ''
    return this.request(`/movies${query}`)
  }

  // Get recent movie watches
  async getRecentWatches(limit = 20) {
    return this.request(`/movies/watches?limit=${limit}`)
  }

  // Get movie statistics
  async getMovieStats() {
    return this.request('/movies/stats')
  }

  // Search movies by title
  async searchMovies(query, limit = 20) {
    return this.getMovies({ search: query, limit })
  }

  // Utility methods for common movie operations

  // Get movies by year
  async getMoviesByYear(year, limit = 50) {
    const movies = await this.getMovies({ limit: 100 })
    return {
      ...movies,
      movies: movies.movies.filter(movie => movie.year === year).slice(0, limit),
    }
  }

  // Get top rated movies
  async getTopRatedMovies(limit = 10) {
    const watches = await this.getRecentWatches(200) // Get more to filter

    // Calculate average ratings for each movie
    const movieRatings = {}
    watches.watches.forEach(watch => {
      if (watch.personal_rating && watch.movies) {
        const movieId = watch.movies.id
        if (!movieRatings[movieId]) {
          movieRatings[movieId] = {
            movie: watch.movies,
            ratings: [],
            totalWatches: 0,
          }
        }
        movieRatings[movieId].ratings.push(watch.personal_rating)
        movieRatings[movieId].totalWatches++
      }
    })

    // Calculate averages and sort
    const topRated = Object.values(movieRatings)
      .map(item => ({
        ...item.movie,
        average_rating: item.ratings.reduce((sum, r) => sum + r, 0) / item.ratings.length,
        total_watches: item.totalWatches,
        ratings_count: item.ratings.length,
      }))
      .sort((a, b) => b.average_rating - a.average_rating)
      .slice(0, limit)

    return { movies: topRated }
  }

  // Get recent movie activity for dashboard
  async getDashboardData() {
    const [stats, recentWatches, topRated] = await Promise.all([
      this.getMovieStats(),
      this.getRecentWatches(5),
      this.getTopRatedMovies(5),
    ])

    return {
      stats,
      recent_watches: recentWatches.watches,
      top_rated: topRated.movies,
    }
  }

  // Get movies watched this year
  async getThisYearActivity() {
    const currentYear = new Date().getFullYear()
    const watches = await this.getRecentWatches(500) // Get lots to filter

    const thisYearWatches = watches.watches.filter(
      watch => new Date(watch.watched_at).getFullYear() === currentYear
    )

    return {
      count: thisYearWatches.length,
      watches: thisYearWatches,
      year: currentYear,
    }
  }

  // Get movie watching streaks
  async getWatchingStreaks() {
    const watches = await this.getRecentWatches(100)
    const watchDates = watches.watches.map(w => new Date(w.watched_at).toDateString())

    // Remove duplicates and sort
    const uniqueDates = [...new Set(watchDates)].sort()

    let currentStreak = 0
    let longestStreak = 0
    let currentDate = new Date()

    // Calculate current streak (consecutive days from today backwards)
    for (let i = 0; i < uniqueDates.length; i++) {
      const watchDate = new Date(uniqueDates[uniqueDates.length - 1 - i])
      const diffDays = Math.floor((currentDate - watchDate) / (1000 * 60 * 60 * 24))

      if (diffDays === i) {
        currentStreak++
      } else {
        break
      }
    }

    // Calculate longest streak
    let tempStreak = 1
    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1])
      const currDate = new Date(uniqueDates[i])
      const diffDays = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 1
      }
    }

    return {
      current_streak: currentStreak,
      longest_streak: Math.max(longestStreak, currentStreak),
      total_watch_days: uniqueDates.length,
    }
  }

  // Get movies by rating range
  async getMoviesByRating(minRating, maxRating = 5) {
    const watches = await this.getRecentWatches(200)

    const filteredWatches = watches.watches.filter(
      watch => watch.personal_rating >= minRating && watch.personal_rating <= maxRating
    )

    return {
      count: filteredWatches.length,
      watches: filteredWatches,
      rating_range: { min: minRating, max: maxRating },
    }
  }

  // Export data for backup
  async exportMovieData() {
    const [movies, watches, stats] = await Promise.all([
      this.getMovies({ limit: 1000 }),
      this.getRecentWatches(1000),
      this.getMovieStats(),
    ])

    return {
      export_date: new Date().toISOString(),
      stats,
      movies: movies.movies,
      watches: watches.watches,
    }
  }
}

// Example usage for building a movie website
class MovieWebsite {
  constructor(apiUrl) {
    this.api = new MovieAPI(apiUrl)
  }

  // Build homepage with recent activity
  async buildHomepage() {
    try {
      const dashboard = await this.api.getDashboardData()

      return {
        pageTitle: 'My Movie Collection',
        stats: dashboard.stats,
        recentWatches: dashboard.recent_watches,
        topRated: dashboard.top_rated,
      }
    } catch (error) {
      console.error('Error building homepage:', error)
      return { error: 'Failed to load movie data' }
    }
  }

  // Build movie library page
  async buildLibraryPage(searchQuery = '', page = 1, limit = 20) {
    try {
      const movies = searchQuery
        ? await this.api.searchMovies(searchQuery, limit)
        : await this.api.getMovies({ limit })

      return {
        pageTitle: searchQuery ? `Search: ${searchQuery}` : 'Movie Library',
        movies: movies.movies,
        searchQuery,
        count: movies.count,
      }
    } catch (error) {
      console.error('Error building library page:', error)
      return { error: 'Failed to load movies' }
    }
  }

  // Build stats page
  async buildStatsPage() {
    try {
      const [stats, thisYear, streaks] = await Promise.all([
        this.api.getMovieStats(),
        this.api.getThisYearActivity(),
        this.api.getWatchingStreaks(),
      ])

      return {
        pageTitle: 'Movie Statistics',
        stats,
        thisYear,
        streaks,
      }
    } catch (error) {
      console.error('Error building stats page:', error)
      return { error: 'Failed to load statistics' }
    }
  }

  // Generate HTML for recent watches widget
  generateRecentWatchesHTML(watches, maxItems = 5) {
    if (!watches || watches.length === 0) {
      return '<p>No recent watches</p>'
    }

    return watches
      .slice(0, maxItems)
      .map(
        watch => `
      <div class="movie-watch">
        <h4>${watch.movies.title} (${watch.movies.year})</h4>
        ${watch.personal_rating ? `<p>⭐ ${watch.personal_rating}/5</p>` : ''}
        <p class="watch-date">${new Date(watch.watched_at).toLocaleDateString()}</p>
        ${watch.review_text ? `<p class="review">${watch.review_text.substring(0, 100)}...</p>` : ''}
      </div>
    `
      )
      .join('')
  }

  // Generate HTML for movie stats widget
  generateStatsHTML(stats) {
    return `
      <div class="movie-stats">
        <div class="stat">
          <span class="stat-number">${stats.total_movies}</span>
          <span class="stat-label">Movies</span>
        </div>
        <div class="stat">
          <span class="stat-number">${stats.total_watches}</span>
          <span class="stat-label">Watches</span>
        </div>
        <div class="stat">
          <span class="stat-number">${stats.average_rating}</span>
          <span class="stat-label">Avg Rating</span>
        </div>
      </div>
    `
  }
}

// Export for use in different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MovieAPI, MovieWebsite }
} else if (typeof window !== 'undefined') {
  window.MovieAPI = MovieAPI
  window.MovieWebsite = MovieWebsite
}

// Example initialization
// const api = new MovieAPI('https://your-project.supabase.co/functions/v1/movies');
// const website = new MovieWebsite('https://your-project.supabase.co/functions/v1/movies');

const fetch = require('node-fetch');

// movie-api.js - Client for movie tracking API (Node.js version for 11ty)

class MovieAPI {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  // Helper method for making requests
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Get recent movie watches (ordered by most recent first)
  async getRecentWatches(limit = 20) {
    return this.request(`/watches?limit=${limit}`);
  }

  // Get movies with optional filtering
  async getMovies(options = {}) {
    const params = new URLSearchParams();

    if (options.limit) params.append('limit', options.limit.toString());
    if (options.search) params.append('search', options.search);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/movies${query}`);
  }

  // Get movie statistics
  async getMovieStats() {
    return this.request('/stats');
  }

  // Helper method to get poster URL from TMDB (if available)
  getPosterUrl(movie, size = 'w500') {
    if (movie.tmdb_id) {
      return `https://image.tmdb.org/t/p/${size}/${movie.poster_path || movie.tmdb_id}.jpg`;
    }
    // Fallback placeholder
    return `https://via.placeholder.com/500x750/cccccc/666666?text=${encodeURIComponent(movie.title)}`;
  }
}

module.exports = { MovieAPI };
const { MovieAPI } = require('../../movie-api.js');
require('dotenv').config();

module.exports = async function() {
  // Load from environment variable
  const API_URL = process.env.MOVIE_API_URL;

  try {
    const api = new MovieAPI(API_URL);

    // Get recent watches (this returns movies with nested watches)
    const recentMovies = await api.getRecentWatches(50);

    // Handle case where movies might not exist or be undefined
    const movies = recentMovies?.movies || [];

    // Transform to flat watch structure ordered by most recent watch
    const allWatches = [];
    movies.forEach(movie => {
      if (movie.movie_watches && movie.movie_watches.length > 0) {
        movie.movie_watches.forEach(watch => {
          allWatches.push({
            ...watch,
            movies: {
              ...movie,
              poster_url: movie.poster_url || api.getPosterUrl(movie)
            }
          });
        });
      }
    });

    // Sort by watch date (most recent first)
    allWatches.sort((a, b) => new Date(b.watched_at) - new Date(a.watched_at));

    return {
      watches: allWatches,
      count: recentMovies?.count || 0,
      last_updated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching movie data:', error);

    // Return empty data with error info for graceful degradation
    return {
      watches: [],
      count: 0,
      error: error.message,
      last_updated: new Date().toISOString()
    };
  }
}
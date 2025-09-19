// Database types
export interface Movie {
  id: string
  title: string
  year: number | null
  director: string | null
  letterboxd_id: string | null
  trakt_id: string | null
  tmdb_id: string | null
  poster_url: string | null
  backdrop_url: string | null
  plot_summary: string | null
  genres: string[] | null
  country: string | null
  language: string | null
  budget: number | null
  box_office: number | null
  trailer_url: string | null
  created_at: string
  updated_at: string
}

export interface MovieWatch {
  id: string
  movie_id: string
  watched_at: string
  personal_rating: number | null
  review_text: string | null
  source: string
  source_url: string | null
  external_id: string | null
  metadata: Record<string, any> | null
  created_at: string
  updated_at: string
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface MoviesResponse {
  count: number
  movies: (Movie & { movie_watches?: MovieWatch[] })[]
}

export interface WatchesResponse {
  count: number
  watches: (MovieWatch & { movies?: Movie })[]
}

export interface StatsResponse {
  total_movies: number
  total_watches: number
  movies_with_posters: number
  poster_coverage: number
  average_rating: number
}

// Webhook types
export interface EchoFeedItem {
  id?: string
  title: string
  content?: string
  link?: string
  guid?: string
  pubDate?: string
  date?: string
  summary?: string
  trakt_id?: string
}

export interface EchoFeedWebhook {
  item?: EchoFeedItem
  // Direct payload format
  id?: string
  title?: string
  content?: string
  link?: string
  guid?: string
  pubDate?: string
  date?: string
  summary?: string
  trakt_id?: string
}

// TMDB types
export interface TMDBMovie {
  id: number
  title: string
  overview?: string
  poster_path?: string
  backdrop_path?: string
  release_date?: string
  genres?: Array<{ id: number; name: string }>
  production_countries?: Array<{ iso_3166_1: string; name: string }>
  original_language?: string
  budget?: number
  revenue?: number
  videos?: {
    results: Array<{
      key: string
      site: string
      type: string
    }>
  }
  credits?: {
    crew: Array<{
      name: string
      job: string
    }>
  }
}

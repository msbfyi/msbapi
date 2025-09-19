// Define types locally until shared package is built
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

export interface MSBApiConfig {
  baseUrl: string
  apiKey?: string
}

export class MSBApi {
  private baseUrl: string
  private apiKey?: string

  constructor(config: MSBApiConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.apiKey = config.apiKey
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Movies API
  async getMovies(params?: {
    limit?: number
    search?: string
    posters?: boolean
  }): Promise<MoviesResponse> {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.search) searchParams.set('search', params.search)
    if (params?.posters) searchParams.set('posters', 'true')

    const query = searchParams.toString()
    return this.request<MoviesResponse>(`/movies${query ? `?${query}` : ''}`)
  }

  async getMovie(id: string): Promise<Movie> {
    return this.request<Movie>(`/movies/movie/${id}`)
  }

  // Watches API
  async getWatches(params?: { limit?: number }): Promise<WatchesResponse> {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const query = searchParams.toString()
    return this.request<WatchesResponse>(`/movies/watches${query ? `?${query}` : ''}`)
  }

  // Stats API
  async getStats(): Promise<StatsResponse> {
    return this.request<StatsResponse>('/movies/stats')
  }

  // Webhook API (for testing)
  async sendWebhook(payload: any): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/movies', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  // Cleanup API
  async cleanupMovies(movieIds: string[]): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/movies/cleanup', {
      method: 'DELETE',
      body: JSON.stringify({ movieIds }),
    })
  }
}

// Types are exported above with interfaces

// Default export for convenience
export default MSBApi

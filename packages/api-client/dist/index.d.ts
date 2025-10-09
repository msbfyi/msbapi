export interface Movie {
    id: string;
    title: string;
    year: number | null;
    director: string | null;
    letterboxd_id: string | null;
    trakt_id: string | null;
    tmdb_id: string | null;
    poster_url: string | null;
    backdrop_url: string | null;
    plot_summary: string | null;
    genres: string[] | null;
    country: string | null;
    language: string | null;
    budget: number | null;
    box_office: number | null;
    trailer_url: string | null;
    created_at: string;
    updated_at: string;
}
export interface MovieWatch {
    id: string;
    movie_id: string;
    watched_at: string;
    personal_rating: number | null;
    review_text: string | null;
    source: string;
    source_url: string | null;
    external_id: string | null;
    metadata: Record<string, any> | null;
    created_at: string;
    updated_at: string;
}
export interface ApiResponse<T> {
    data?: T;
    error?: string;
    message?: string;
}
export interface MoviesResponse {
    count: number;
    movies: (Movie & {
        movie_watches?: MovieWatch[];
    })[];
}
export interface WatchesResponse {
    count: number;
    watches: (MovieWatch & {
        movies?: Movie;
    })[];
}
export interface StatsResponse {
    total_movies: number;
    total_watches: number;
    movies_with_posters: number;
    poster_coverage: number;
    average_rating: number;
}
export interface MSBApiConfig {
    baseUrl: string;
    apiKey?: string;
}
export declare class MSBApi {
    private baseUrl;
    private apiKey?;
    constructor(config: MSBApiConfig);
    private request;
    getMovies(params?: {
        limit?: number;
        search?: string;
        posters?: boolean;
    }): Promise<MoviesResponse>;
    getMovie(id: string): Promise<Movie>;
    getWatches(params?: {
        limit?: number;
    }): Promise<WatchesResponse>;
    getStats(): Promise<StatsResponse>;
    sendWebhook(payload: any): Promise<ApiResponse<any>>;
    cleanupMovies(movieIds: string[]): Promise<ApiResponse<any>>;
}
export default MSBApi;
//# sourceMappingURL=index.d.ts.map
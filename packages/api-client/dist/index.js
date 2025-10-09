export class MSBApi {
    baseUrl;
    apiKey;
    constructor(config) {
        this.baseUrl = config.baseUrl.replace(/\/$/, '');
        this.apiKey = config.apiKey;
    }
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        if (this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }
        const response = await fetch(url, {
            ...options,
            headers,
        });
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }
    // Movies API
    async getMovies(params) {
        const searchParams = new URLSearchParams();
        if (params?.limit)
            searchParams.set('limit', params.limit.toString());
        if (params?.search)
            searchParams.set('search', params.search);
        if (params?.posters)
            searchParams.set('posters', 'true');
        const query = searchParams.toString();
        return this.request(`/movies${query ? `?${query}` : ''}`);
    }
    async getMovie(id) {
        return this.request(`/movies/movie/${id}`);
    }
    // Watches API
    async getWatches(params) {
        const searchParams = new URLSearchParams();
        if (params?.limit)
            searchParams.set('limit', params.limit.toString());
        const query = searchParams.toString();
        return this.request(`/movies/watches${query ? `?${query}` : ''}`);
    }
    // Stats API
    async getStats() {
        return this.request('/movies/stats');
    }
    // Webhook API (for testing)
    async sendWebhook(payload) {
        return this.request('/movies', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }
    // Cleanup API
    async cleanupMovies(movieIds) {
        return this.request('/movies/cleanup', {
            method: 'DELETE',
            body: JSON.stringify({ movieIds }),
        });
    }
}
// Types are exported above with interfaces
// Default export for convenience
export default MSBApi;
//# sourceMappingURL=index.js.map
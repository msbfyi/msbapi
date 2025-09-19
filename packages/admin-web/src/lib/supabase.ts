import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      movies: {
        Row: {
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
        Insert: {
          id?: string
          title: string
          year?: number | null
          director?: string | null
          letterboxd_id?: string | null
          trakt_id?: string | null
          tmdb_id?: string | null
          poster_url?: string | null
          backdrop_url?: string | null
          plot_summary?: string | null
          genres?: string[] | null
          country?: string | null
          language?: string | null
          budget?: number | null
          box_office?: number | null
          trailer_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          year?: number | null
          director?: string | null
          letterboxd_id?: string | null
          trakt_id?: string | null
          tmdb_id?: string | null
          poster_url?: string | null
          backdrop_url?: string | null
          plot_summary?: string | null
          genres?: string[] | null
          country?: string | null
          language?: string | null
          budget?: number | null
          box_office?: number | null
          trailer_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      movie_watches: {
        Row: {
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
        Insert: {
          id?: string
          movie_id: string
          watched_at: string
          personal_rating?: number | null
          review_text?: string | null
          source: string
          source_url?: string | null
          external_id?: string | null
          metadata?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          movie_id?: string
          watched_at?: string
          personal_rating?: number | null
          review_text?: string | null
          source?: string
          source_url?: string | null
          external_id?: string | null
          metadata?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

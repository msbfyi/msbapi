import { useState, useEffect } from 'react'
import Head from 'next/head'
import { supabase } from '@/lib/supabase'

interface Stats {
  total_movies: number
  total_watches: number
  movies_with_posters: number
  poster_coverage: number
  average_rating: number
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/movies/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>MSB API Admin Dashboard</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">MSB API Admin Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Manage your movie tracking system and monitor database statistics.
            </p>
          </div>

          {loading ? (
            <div className="animate-pulse">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="card">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="card">
                <div className="text-sm font-medium text-gray-500">Total Movies</div>
                <div className="text-3xl font-bold text-gray-900">{stats.total_movies}</div>
              </div>
              <div className="card">
                <div className="text-sm font-medium text-gray-500">Total Watches</div>
                <div className="text-3xl font-bold text-gray-900">{stats.total_watches}</div>
              </div>
              <div className="card">
                <div className="text-sm font-medium text-gray-500">Poster Coverage</div>
                <div className="text-3xl font-bold text-gray-900">{stats.poster_coverage}%</div>
                <div className="text-sm text-gray-500">
                  {stats.movies_with_posters} of {stats.total_movies} movies
                </div>
              </div>
              <div className="card">
                <div className="text-sm font-medium text-gray-500">Average Rating</div>
                <div className="text-3xl font-bold text-gray-900">{stats.average_rating}</div>
              </div>
            </div>
          ) : (
            <div className="card">
              <p className="text-gray-500">Unable to load statistics. Check your API connection.</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button className="btn-primary w-full">View Movies</button>
                <button className="btn-secondary w-full">Recent Watches</button>
                <button className="btn-secondary w-full">TMDB Enrichment</button>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">System Status</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">API Status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ● Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Database</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ● Connected
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">TMDB Integration</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ● Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

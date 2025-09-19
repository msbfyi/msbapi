// Date utilities
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// String utilities
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

// Rating utilities
export function formatRating(rating: number | null): string {
  if (rating === null) return 'No rating'
  return `${rating.toFixed(1)}/10`
}

export function ratingToStars(rating: number | null): string {
  if (rating === null) return '☆☆☆☆☆'
  const stars = Math.round(rating / 2) // Convert 10-point to 5-star scale
  return '★'.repeat(stars) + '☆'.repeat(5 - stars)
}

// URL utilities
export function buildImageUrl(path: string | null, size = 'w500'): string | null {
  if (!path) return null
  return `https://image.tmdb.org/t/p/${size}${path}`
}

// Validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Movie utilities
export function parseMovieTitle(title: string): { title: string; year?: number } {
  // Handle "Title, Year" format (Letterboxd)
  const letterboxdMatch = title.match(/^(.+?),\s*(\d{4})$/)
  if (letterboxdMatch) {
    return {
      title: letterboxdMatch[1].trim(),
      year: parseInt(letterboxdMatch[2]),
    }
  }

  // Handle "Title (Year)" format
  const parenMatch = title.match(/^(.+?)\s*\((\d{4})\)$/)
  if (parenMatch) {
    return {
      title: parenMatch[1].trim(),
      year: parseInt(parenMatch[2]),
    }
  }

  return { title: title.trim() }
}

export function extractExternalIds(url: string): {
  letterboxd_id?: string
  trakt_id?: string
} {
  const ids: { letterboxd_id?: string; trakt_id?: string } = {}

  // Letterboxd film URL
  const letterboxdMatch = url.match(/letterboxd\.com\/[^\/]+\/film\/([^\/]+)/)
  if (letterboxdMatch) {
    ids.letterboxd_id = letterboxdMatch[1]
  }

  // Trakt.tv movie URL
  const traktMatch = url.match(/trakt\.tv\/movies\/([^\/]+)/)
  if (traktMatch) {
    ids.trakt_id = traktMatch[1]
  }

  return ids
}

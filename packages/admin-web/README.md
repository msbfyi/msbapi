# MSB Admin Web Interface

A Next.js 14 admin dashboard for managing the MSB movie tracking API. Features
real-time statistics, database management, and TMDB enrichment tools.

## Features

- 📊 **Real-time Dashboard** - Live statistics and movie database metrics
- 🎬 **Movie Management** - Browse, search, and manage movie records
- 👀 **Watch History** - View and manage movie watch records
- 🖼️ **TMDB Integration** - Tools for enriching movie data with posters and
  metadata
- 🎨 **Modern UI** - Tailwind CSS with responsive design
- 🔒 **Type Safety** - Full TypeScript integration with Supabase

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase PostgreSQL
- **UI Components**: Headless UI, Heroicons
- **Build Tool**: esbuild via Next.js

## Quick Start

### Prerequisites

- Node.js 18+
- Configured Supabase project
- Environment variables (see root `.env.example`)

### Development

```bash
# From project root
npm run workspace:admin-web

# Or from this package
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm run start
```

## Environment Variables

Required environment variables (set in root `.env`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - TypeScript validation

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Next.js pages (App Router)
├── lib/                # Utilities and configurations
│   └── supabase.ts     # Supabase client
├── types/              # TypeScript type definitions
├── styles/             # Global styles and Tailwind config
├── hooks/              # Custom React hooks
└── contexts/           # React contexts
```

## Features Overview

### Dashboard

- Total movies and watches count
- Poster coverage statistics
- Average rating metrics
- System status indicators

### Movie Management

- Paginated movie list with search
- Individual movie detail views
- TMDB enrichment status
- Bulk operations for cleanup

### Watch History

- Recent watches with movie details
- Rating and review display
- Source attribution (Letterboxd, Trakt.tv)

### TMDB Integration

- Manual enrichment triggers
- Batch processing tools
- Poster and metadata status

## API Integration

The admin interface consumes the MSB API via:

1. **Direct Supabase Client** - For real-time data and authentication
2. **API Proxy** - Next.js API routes proxy to edge functions
3. **MSB API Client** - Type-safe SDK for complex operations

### API Routes

```typescript
// Example API usage
import { supabase } from '@/lib/supabase'

// Get movies with watches
const { data: movies } = await supabase
  .from('movies')
  .select(
    `
    *,
    movie_watches (*)
  `
  )
  .order('created_at', { ascending: false })
```

## Customization

### Styling

The interface uses Tailwind CSS with custom components in `globals.css`:

- `.btn-primary` - Primary action buttons
- `.btn-secondary` - Secondary action buttons
- `.card` - Content containers
- `.input-field` - Form inputs

### Components

Key reusable components:

- `MovieCard` - Movie display with poster and metadata
- `StatsWidget` - Metric display components
- `SearchBar` - Movie search interface
- `PaginationControls` - List pagination

### Theming

Colors and styling can be customized in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        500: '#3b82f6', // Customize primary color
        // ...
      }
    }
  }
}
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Other Platforms

The app builds to static files and can be deployed on:

- Netlify
- AWS Amplify
- Cloudflare Pages
- Any static hosting service

### Environment Variables

Ensure these are set in your deployment environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Development

### Adding New Pages

1. Create page in `src/pages/`
2. Add navigation links
3. Update TypeScript types if needed

### API Integration

1. Use Supabase client for direct database access
2. Use MSB API client for complex operations
3. Handle loading and error states

### Styling Guidelines

- Use Tailwind utility classes
- Create component styles in `globals.css`
- Follow mobile-first responsive design
- Maintain consistent spacing and typography

## Security

- Environment variables are properly scoped (`NEXT_PUBLIC_` prefix)
- Supabase RLS policies control data access
- No sensitive data in client-side code
- CORS configured for API access

## Performance

- Next.js automatic code splitting
- Image optimization for movie posters
- Static generation where possible
- Efficient database queries with proper indexes

## Contributing

See the main [Contributing Guide](../../README.md#contributing) for general
guidelines.

### Admin-Specific Guidelines

- Follow Next.js best practices
- Use TypeScript strictly
- Test responsive design
- Optimize for fast loading
- Maintain accessibility standards

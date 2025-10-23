# MSB Admin App - Phase 1

A modern admin dashboard built with web standards.

## Tech Stack

- **Lit** - Web Components framework
- **@preact/signals-core** - Reactive state management
- **Tailwind CSS** - Utility-first CSS framework
- **Shoelace** - UI component library (for form inputs and buttons)
- **Supabase** - Authentication and backend
- **Vite** - Build tool and dev server

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the `packages/admin-app/` directory:

```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

You can copy the example file:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` with your actual Supabase credentials.

### 3. Set up Supabase (if needed)

If you haven't already set up the required database tables, run this SQL in your
Supabase SQL Editor:

```sql
-- Enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- Set up RLS policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
```

### 4. Start development server

```bash
npm run dev
```

The app will be available at [http://localhost:3001](http://localhost:3001)

## Features Implemented (Phase 1)

- ✅ Supabase authentication integration
- ✅ Login/logout functionality
- ✅ Basic dashboard with mock data
- ✅ Responsive layout with sidebar navigation
- ✅ Signal-based state management
- ✅ Modern UI with Tailwind CSS and Shoelace components
- ✅ Loading states and error handling
- ✅ Utility-first styling with custom theme

## Project Structure

```
packages/admin-app/
├── public/
│   └── index.html           # HTML entry point
├── src/
│   ├── components/
│   │   ├── base-component.js    # Base component with signal support
│   │   ├── app-shell.js         # Main app layout (Tailwind)
│   │   ├── login-form.js        # Login interface (Tailwind)
│   │   └── dashboard-page.js    # Dashboard content (Tailwind)
│   ├── lib/
│   │   └── supabase.js          # Supabase client
│   ├── store/
│   │   └── auth-signals.js      # Auth state management
│   ├── styles/
│   │   └── globals.css          # Global styles with Tailwind directives
│   └── main.js                  # App entry point
├── tailwind.config.js           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
├── package.json
├── vite.config.js
└── README.md
```

## Available Scripts

- `npm run dev` - Start development server on port 3001
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Coming in Phase 2

- ⏳ Client-side routing with URL-based navigation
- ⏳ Route guards for authentication/authorization
- ⏳ Users management page
- ⏳ Settings page
- ⏳ 404 error handling

## Coming in Phase 3

- ⏳ Global error boundary
- ⏳ Toast notification system
- ⏳ Form validation utilities
- ⏳ Comprehensive test suite
- ⏳ Production deployment readiness

## Development Notes

### Component Architecture

All components extend `BaseComponent` which provides:

- Automatic signal subscription management
- Cleanup on component disconnect
- Standard Lit element lifecycle

**Important**: Components use Light DOM (not Shadow DOM) to enable Tailwind CSS
styling. This is achieved by overriding `createRenderRoot()` to return `this`
instead of creating a shadow root.

### Styling with Tailwind CSS

This project uses **Tailwind CSS v3** for utility-first styling:

- **Custom Theme**: Configured in `tailwind.config.js` with brand colors
  matching the original design
  - Purple gradient: `bg-gradient-brand` (#667eea to #764ba2)
  - Custom color palettes: `primary`, `success`, `warning`, `danger`, `info`
  - Brand colors: `brand-purple`, `brand-indigo`
- **Responsive Design**: Built-in breakpoints (`sm:`, `md:`, `lg:`, etc.)
- **Shoelace Integration**: Tailwind handles layout/utilities, Shoelace provides
  accessible form components
- **Production Optimization**: Tailwind automatically purges unused styles in
  production builds

**Example usage**:

```html
<!-- Gradient background -->
<div class="bg-gradient-brand">
  <!-- Responsive grid -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    <!-- Custom theme colors -->
    <div class="bg-white border-l-4 border-success-500 p-6"></div>
  </div>
</div>
```

### State Management

Using @preact/signals-core for reactive state:

- `authState` - Current user, session, loading, and error states
- `isAuthenticated` - Computed value for auth status
- `isLoading` - Computed value for loading state

### Authentication Flow

1. App loads and checks for existing session
2. If authenticated, shows dashboard
3. If not authenticated, shows login form
4. After login, automatically redirects to dashboard
5. Sign out clears session and returns to login

## Troubleshooting

### Port 3001 already in use

Change the port in `vite.config.js`:

```js
server: {
  port: 3002, // or any available port
  host: true
}
```

### Supabase connection errors

- Verify `.env.local` exists and has correct values
- Check that Supabase project is active
- Ensure you're using the correct URL and anon key (not service role key)

### Icons not loading

Icons are loaded from CDN. If you see icon loading errors:

- Check your internet connection
- The CDN path is set in `src/main.js` using `setBasePath()`

## License

Part of the MSB API project.

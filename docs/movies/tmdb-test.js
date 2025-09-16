// tmdb-test.js - Simple test script to debug the issue
require('dotenv').config();

// Configuration loaded from environment variables
const CONFIG = {
  tmdbApiKey: process.env.TMDB_API_KEY,
  supabaseUrl: process.env.MOVIE_API_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_KEY
};

async function testSupabaseConnection() {
  const url = `${CONFIG.supabaseUrl}/rest/v1/movies`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${CONFIG.supabaseKey}`,
    'apikey': CONFIG.supabaseKey
  };

  console.log('🔍 Testing Supabase connection...');
  console.log(`URL: ${url}`);
  console.log(`Headers: Authorization Bearer ${CONFIG.supabaseKey.substring(0, 20)}...`);

  try {
    // Test 1: Get any movies
    console.log('\n📊 Test 1: Get any movies (limit 5)');
    const response1 = await fetch(`${url}?select=id,title,year,poster_url&limit=5`, {
      method: 'GET',
      headers
    });
    
    console.log(`Status: ${response1.status}`);
    
    if (!response1.ok) {
      const errorText = await response1.text();
      console.log(`Error: ${errorText}`);
      return;
    }
    
    const allMovies = await response1.json();
    console.log(`Response type: ${Array.isArray(allMovies) ? 'array' : typeof allMovies}`);
    console.log(`Movies count: ${allMovies?.length || 'undefined'}`);
    
    if (Array.isArray(allMovies) && allMovies.length > 0) {
      console.log('\n📋 Sample movies:');
      allMovies.forEach((movie, i) => {
        const poster = movie.poster_url ? '🖼️' : '📝';
        console.log(`  ${i + 1}. ${poster} ${movie.title} (${movie.year})`);
      });
    } else if (allMovies?.length === 0) {
      console.log('❌ No movies found in database!');
      console.log('   Run movie backfill first: node movie-backfill.js');
      return;
    }

    // Test 2: Get movies without posters
    console.log('\n📊 Test 2: Get movies without posters');
    const response2 = await fetch(`${url}?select=id,title,year,poster_url&poster_url=is.null&limit=10`, {
      method: 'GET',
      headers
    });
    
    console.log(`Status: ${response2.status}`);
    
    if (!response2.ok) {
      const errorText = await response2.text();
      console.log(`Error: ${errorText}`);
      return;
    }
    
    const moviesWithoutPosters = await response2.json();
    console.log(`Response type: ${Array.isArray(moviesWithoutPosters) ? 'array' : typeof moviesWithoutPosters}`);
    console.log(`Movies without posters: ${moviesWithoutPosters?.length || 'undefined'}`);
    
    if (Array.isArray(moviesWithoutPosters)) {
      if (moviesWithoutPosters.length > 0) {
        console.log('\n📋 Movies that need enrichment:');
        moviesWithoutPosters.slice(0, 5).forEach((movie, i) => {
          console.log(`  ${i + 1}. 📝 ${movie.title} (${movie.year})`);
        });
        console.log(`\n✅ Found ${moviesWithoutPosters.length} movies that need TMDB enrichment!`);
      } else {
        console.log('\n✅ All movies already have posters!');
      }
    }

    // Test 3: Count stats
    console.log('\n📊 Test 3: Database statistics');
    
    // Total movies
    const totalResponse = await fetch(`${url}?select=id`, {
      method: 'GET',
      headers
    });
    const totalMovies = await totalResponse.json();
    
    // Movies with posters
    const withPostersResponse = await fetch(`${url}?select=id&poster_url=not.is.null`, {
      method: 'GET',
      headers
    });
    const moviesWithPosters = await withPostersResponse.json();
    
    console.log(`Total movies: ${totalMovies?.length || 0}`);
    console.log(`Movies with posters: ${moviesWithPosters?.length || 0}`);
    console.log(`Movies needing enrichment: ${(totalMovies?.length || 0) - (moviesWithPosters?.length || 0)}`);
    
    if (totalMovies?.length > 0) {
      const coverage = Math.round((moviesWithPosters?.length || 0) / totalMovies.length * 100);
      console.log(`Poster coverage: ${coverage}%`);
    }

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.error('Full error:', error);
  }
}

async function testTMDBConnection() {
  console.log('\n🎬 Testing TMDB connection...');
  
  try {
    const response = await fetch(`https://api.themoviedb.org/3/configuration?api_key=${CONFIG.tmdbApiKey}`);
    
    if (!response.ok) {
      console.log(`❌ TMDB API Error: ${response.status}`);
      if (response.status === 401) {
        console.log('   Check your TMDB API key');
      }
      return;
    }
    
    const config = await response.json();
    console.log('✅ TMDB API connection successful');
    console.log(`   Base image URL: ${config.images?.base_url}`);
    
    // Test movie search
    console.log('\n🔍 Testing movie search...');
    const searchResponse = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${CONFIG.tmdbApiKey}&query=matrix`);
    const searchResults = await searchResponse.json();
    
    if (searchResults.results?.length > 0) {
      const movie = searchResults.results[0];
      console.log(`✅ Found movie: ${movie.title} (${movie.release_date?.substring(0, 4)})`);
      console.log(`   Poster: ${config.images?.base_url}w500${movie.poster_path}`);
    }
    
  } catch (error) {
    console.error('❌ TMDB test failed:', error.message);
  }
}

async function main() {
  console.log('🔬 TMDB Enricher Diagnostic Tool\n');
  
  // Validate config
  if (!CONFIG.supabaseUrl) {
    console.error('❌ Please set MOVIE_API_URL in .env file');
    process.exit(1);
  }

  if (!CONFIG.supabaseKey) {
    console.error('❌ Please set SUPABASE_SERVICE_KEY in .env file');
    process.exit(1);
  }

  if (!CONFIG.tmdbApiKey) {
    console.error('❌ Please set TMDB_API_KEY in .env file');
    process.exit(1);
  }
  
  await testSupabaseConnection();
  await testTMDBConnection();
  
  console.log('\n✅ Diagnostic complete!');
}

main().catch(console.error);
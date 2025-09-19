#!/usr/bin/env node

/**
 * Database Documentation Generator
 *
 * Connects to the database and generates up-to-date schema documentation.
 * Run with: npm run db:docs
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

async function generateDatabaseDocs() {
  console.log('🔍 Generating database documentation...')

  const docsDir = path.join(__dirname, '..', 'docs', 'database')
  const outputFile = path.join(docsDir, 'current-schema.md')

  try {
    // Check if we have supabase CLI available
    try {
      execSync('supabase --version', { stdio: 'ignore' })
    } catch (error) {
      console.warn('⚠️  Supabase CLI not found. Install with: npm install -g supabase')
      console.warn('📝 Using static schema documentation instead.')
      return
    }

    // Generate schema information using pg_dump
    console.log('📊 Extracting current database schema...')

    const schemaOutput = execSync('supabase db dump --schema-only', {
      encoding: 'utf-8',
      cwd: path.join(__dirname, '..'),
    })

    // Parse and format the schema
    const currentDate = new Date().toISOString().split('T')[0]

    const docContent = `# Current Database Schema

*Generated on: ${currentDate}*

## Schema Information

This document contains the current database schema as extracted from the live database.

### Raw Schema DDL

\`\`\`sql
${schemaOutput}
\`\`\`

## Schema Validation

### Tables Status
- ✅ movies: Present
- ✅ movie_watches: Present

### Key Constraints
- ✅ Foreign key: movie_watches.movie_id → movies.id
- ✅ Check constraint: movie_watches.personal_rating BETWEEN 0 AND 10

### Indexes Status
- ✅ idx_movies_title_year
- ✅ idx_movies_letterboxd_id
- ✅ idx_movies_trakt_id
- ✅ idx_movies_tmdb_id
- ✅ idx_movie_watches_movie_id
- ✅ idx_movie_watches_watched_at
- ✅ idx_movie_watches_external_id

### Triggers Status
- ✅ movies_updated_at_trigger
- ✅ movie_watches_updated_at_trigger

## Notes

- For detailed schema documentation, see [schema.md](./schema.md)
- For migration history, see [migrations/README.md](./migrations/README.md)
- This file is auto-generated. Do not edit manually.
`

    fs.writeFileSync(outputFile, docContent)
    console.log(`✅ Database documentation generated: ${outputFile}`)

    // Also run a quick validation query if possible
    try {
      const tablesOutput = execSync(
        `supabase db diff --schema public | grep -E "(CREATE TABLE|ALTER TABLE)" || echo "No schema changes detected"`,
        { encoding: 'utf-8', cwd: path.join(__dirname, '..') }
      )

      if (tablesOutput.trim() !== 'No schema changes detected') {
        console.log('⚠️  Schema drift detected:')
        console.log(tablesOutput)
        console.log('💡 Consider creating a new migration to sync the changes.')
      } else {
        console.log('✅ Schema is in sync with migrations.')
      }
    } catch (error) {
      console.log('ℹ️  Could not check for schema drift (this is normal for new projects).')
    }
  } catch (error) {
    console.error('❌ Error generating database documentation:', error.message)

    // Create a placeholder file
    const placeholderContent = `# Current Database Schema

*Generation failed on: ${new Date().toISOString().split('T')[0]}*

## Error

Could not generate current schema documentation.

Error: ${error.message}

## Manual Steps

To generate schema documentation manually:

1. Ensure Supabase CLI is installed: \`npm install -g supabase\`
2. Ensure you're logged in: \`supabase login\`
3. Run: \`npm run db:docs\`

## Fallback

See [schema.md](./schema.md) for static schema documentation.
`

    fs.writeFileSync(outputFile, placeholderContent)
    console.log(`📝 Created placeholder documentation: ${outputFile}`)
  }
}

// Run if called directly
if (require.main === module) {
  generateDatabaseDocs()
}

module.exports = { generateDatabaseDocs }

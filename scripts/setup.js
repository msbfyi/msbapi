#!/usr/bin/env node

/**
 * Development Environment Setup Script
 *
 * Initializes the development environment for the MSB API monorepo.
 * Run with: npm run setup
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function runCommand(command, options = {}) {
  console.log(`🔧 Running: ${command}`)
  try {
    execSync(command, { stdio: 'inherit', ...options })
  } catch (error) {
    console.error(`❌ Failed to run: ${command}`)
    throw error
  }
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath)
}

async function setupEnvironment() {
  console.log('🚀 Setting up MSB API development environment...\n')

  // Check if we're in the right directory
  if (!checkFileExists('package.json')) {
    console.error('❌ Please run this script from the project root directory')
    process.exit(1)
  }

  // Check Node.js version
  console.log('📋 Checking Node.js version...')
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf-8' }).trim()
    console.log(`✅ Node.js version: ${nodeVersion}`)
  } catch (error) {
    console.error('❌ Node.js is not installed')
    process.exit(1)
  }

  // Install dependencies
  console.log('\n📦 Installing dependencies...')
  runCommand('npm install')

  // Check for Supabase CLI
  console.log('\n🔍 Checking for Supabase CLI...')
  try {
    const supabaseVersion = execSync('supabase --version', { encoding: 'utf-8' }).trim()
    console.log(`✅ Supabase CLI version: ${supabaseVersion}`)
  } catch (error) {
    console.log('⚠️  Supabase CLI not found. Installing...')
    runCommand('npm install -g supabase')
  }

  // Check for Deno (for edge functions)
  console.log('\n🦕 Checking for Deno...')
  try {
    const denoVersion = execSync('deno --version', { encoding: 'utf-8' }).split('\n')[0]
    console.log(`✅ ${denoVersion}`)
  } catch (error) {
    console.log('⚠️  Deno not found. Please install Deno manually:')
    console.log('   curl -fsSL https://deno.land/install.sh | sh')
    console.log('   https://deno.land/manual/getting_started/installation')
  }

  // Setup environment files
  console.log('\n🔐 Setting up environment files...')
  const envExamplePath = '.env.example'
  const envPath = '.env'

  if (checkFileExists(envExamplePath) && !checkFileExists(envPath)) {
    fs.copyFileSync(envExamplePath, envPath)
    console.log('✅ Created .env from .env.example')
    console.log('⚠️  Please update .env with your actual environment variables')
  } else if (checkFileExists(envPath)) {
    console.log('✅ .env file already exists')
  } else {
    console.log('⚠️  No .env.example file found')
  }

  // Initialize Supabase project (if needed)
  console.log('\n🗄️  Checking Supabase project...')
  const supabaseConfigPath = 'packages/edge-functions/supabase/config.toml'

  if (checkFileExists(supabaseConfigPath)) {
    console.log('✅ Supabase project already initialized')
  } else {
    console.log('⚠️  Supabase project not found. You may need to run:')
    console.log('   cd packages/edge-functions && supabase init')
    console.log('   cd packages/edge-functions && supabase login')
    console.log('   cd packages/edge-functions && supabase link --project-ref YOUR_PROJECT_REF')
  }

  // Build packages
  console.log('\n🏗️  Building packages...')
  try {
    runCommand('npm run build')
    console.log('✅ All packages built successfully')
  } catch (error) {
    console.log('⚠️  Some packages failed to build (this may be normal for initial setup)')
  }

  // Generate database documentation
  console.log('\n📚 Generating database documentation...')
  try {
    runCommand('npm run db:docs')
    console.log('✅ Database documentation generated')
  } catch (error) {
    console.log('⚠️  Could not generate database documentation (requires Supabase connection)')
  }

  // Final checks
  console.log('\n🔍 Running final checks...')
  try {
    runCommand('npm run typecheck')
    console.log('✅ TypeScript type checking passed')
  } catch (error) {
    console.log('⚠️  TypeScript type checking failed - you may need to install dependencies')
  }

  // Success message
  console.log('\n🎉 Setup complete!\n')
  console.log('Next steps:')
  console.log('1. Update your .env file with the correct environment variables')
  console.log('2. Set up your Supabase project connection')
  console.log('3. Run `npm run dev` to start development')
  console.log('4. Visit the admin interface at http://localhost:3000 (when ready)')
  console.log('\nHelpful commands:')
  console.log('- `npm run dev` - Start all development servers')
  console.log('- `npm run build` - Build all packages')
  console.log('- `npm run test` - Run all tests')
  console.log('- `npm run lint` - Lint all code')
  console.log('- `npm run db:docs` - Generate database documentation')
}

// Run if called directly
if (require.main === module) {
  setupEnvironment().catch(error => {
    console.error('Setup failed:', error.message)
    process.exit(1)
  })
}

module.exports = { setupEnvironment }

import { defineConfig } from 'vite'

export default defineConfig({
  publicDir: 'public',
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
  optimizeDeps: {
    include: ['@preact/signals-core', 'lit', '@supabase/supabase-js', '@shoelace-style/shoelace'],
  },
  server: {
    port: 3001,
    host: true,
  },
})

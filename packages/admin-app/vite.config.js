import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    target: 'esnext',
    outDir: 'dist',
    rollupOptions: {
      input: resolve(__dirname, 'public/index.html'),
    },
  },
  optimizeDeps: {
    include: ['@preact/signals-core', 'lit', '@supabase/supabase-js', '@shoelace-style/shoelace'],
  },
  server: {
    port: 3001,
    host: true,
  },
})

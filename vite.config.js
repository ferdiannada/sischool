import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Path aliases for cleaner imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@store': path.resolve(__dirname, './src/store'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@constants': path.resolve(__dirname, './src/constants'),
    },
  },

  // Build optimizations
  build: {
    // Enable source maps for debugging
    sourcemap: false,

    // Chunk splitting strategy
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-ui': ['lucide-react', 'class-variance-authority', 'clsx', 'tailwind-merge'],
          'vendor-charts': ['recharts'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-state': ['zustand'],
          'vendor-utils': ['date-fns'],
        },
      },
    },

    // Minification
    minify: 'esbuild',

    // Target modern browsers
    target: 'es2020',

    // Chunk size warning limit
    chunkSizeWarningLimit: 500,
  },

  // Development server
  server: {
    port: 5173,
    open: true,
    // Enable HMR
    hmr: {
      overlay: true,
    },
    // Proxy API requests to avoid CORS issues
    proxy: {
      '/api': {
        target: 'http://localhost:54321/rest/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },

  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'lucide-react',
    ],
  },
})

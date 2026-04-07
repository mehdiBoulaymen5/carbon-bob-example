import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    assetsInlineLimit: 0, // Don't inline assets, serve them separately
  },
  resolve: {
    alias: {
      // Resolve ~ prefix to node_modules for font paths
      '~@ibm/plex': path.resolve(__dirname, 'node_modules/@ibm/plex'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Allow Sass to resolve ~ prefix
        includePaths: [path.resolve(__dirname, 'node_modules')],
      },
    },
  },
});

// Made with Bob

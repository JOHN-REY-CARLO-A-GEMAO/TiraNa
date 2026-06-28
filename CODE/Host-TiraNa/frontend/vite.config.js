import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch:{
      usePolling: true,
      interval: 300
    },
    hmr: {
      host: 'localhost',
    },
    proxy: {
      '/api/host/properties': {
        target: 'http://host-backend:5000',
        changeOrigin: true,
      },
      '/api/host/property-reviews': {
        target: 'http://host-backend:5000',
        changeOrigin: true,
      },
      '/api/listings': {
        target: 'http://host-backend:5000',
        changeOrigin: true,
      },
      '/api/auth': {
        target: 'http://host-backend:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://host-backend:5000',
        changeOrigin: true,
      },
    },
  },
})
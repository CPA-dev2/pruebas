/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  server: {
    host: true,          
    allowedHosts: true,
    
    // 👇 AGREGA ESTO PARA SOLUCIONAR EL MIXED CONTENT
    proxy: {
      '/graphql': {
        target: 'http://127.0.0.1:8000', // Tu backend Django
        changeOrigin: true,
        secure: false,
      },
      '/media': { // Si sirves imágenes/archivos
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
  },
})
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // bütün şəbəkədən girişə icazə verir
    port: 5173,      // istəsən bunu dəyişə bilərsən (məs: 3000)
  },
  build: {
    // Cache busting üçün
    rollupOptions: {
      output: {
        // Her build-də fərqli hash istifadə et
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`
      }
    }
  }
})

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          admin: ['@vueuse/core', 'vee-validate'],
          analytics: ['axios']
        }
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@import "@/assets/styles/variables.scss";'
      }
    }
  },
  define: {
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
      VUE_APP_API_BASE_URL: JSON.stringify(process.env.VUE_APP_API_BASE_URL || 'http://localhost:5001/api/v1'),
      VUE_APP_SITE_URL: JSON.stringify(process.env.VUE_APP_SITE_URL || 'http://localhost:3000'),
      VUE_APP_GA4_ID: JSON.stringify(process.env.VUE_APP_GA4_ID || 'G-P11JTJ21NZ'),
      VUE_APP_GTM_ID: JSON.stringify(process.env.VUE_APP_GTM_ID || ''),
      VUE_APP_META_PIXEL_ID: JSON.stringify(process.env.VUE_APP_META_PIXEL_ID || '')
    }
  }
})
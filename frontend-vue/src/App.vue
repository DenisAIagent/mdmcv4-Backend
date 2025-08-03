<template>
  <div id="app" class="app">
    <!-- Router View pour rendu des pages -->
    <router-view />
    
    <!-- Toast Container (géré par vue-toastification) -->
    
    <!-- Loading Overlay global si nécessaire -->
    <div v-if="globalLoading" class="app-loading-overlay">
      <div class="loading-spinner"></div>
      <p class="loading-text">{{ loadingText }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, provide } from 'vue'
import { useHead } from '@vueuse/head'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

// ===== STORES =====
const authStore = useAuthStore()
const router = useRouter()

// ===== STATE =====
const globalLoading = ref(false)
const loadingText = ref('Chargement...')

// ===== META TAGS GLOBAUX =====
useHead({
  titleTemplate: '%s | MDMC SmartLinks',
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'format-detection', content: 'telephone=no' },
    { name: 'theme-color', content: '#E50914' },
    { name: 'msapplication-TileColor', content: '#E50914' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
    { name: 'apple-mobile-web-app-title', content: 'MDMC SmartLinks' },
    
    // Open Graph par défaut
    { property: 'og:site_name', content: 'MDMC SmartLinks' },
    { property: 'og:type', content: 'website' },
    { property: 'og:locale', content: 'fr_FR' },
    { property: 'og:image', content: 'https://www.mdmcmusicads.com/assets/images/og-default.jpg' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    
    // Twitter Card par défaut
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: '@MDMCMusicAds' },
    { name: 'twitter:creator', content: '@MDMCMusicAds' },
    
    // SEO
    { name: 'robots', content: 'index, follow' },
    { name: 'googlebot', content: 'index, follow' },
    { name: 'author', content: 'MDMC Music Ads' },
    { name: 'generator', content: 'Vue.js 3 + Vite' }
  ],
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
    { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
    { rel: 'manifest', href: '/manifest.json' },
    { rel: 'canonical', href: process.env.VUE_APP_SITE_URL || 'http://localhost:3000' }
  ]
})

// ===== FONCTIONS GLOBALES =====
const setGlobalLoading = (isLoading, text = 'Chargement...') => {
  globalLoading.value = isLoading
  loadingText.value = text
}

const handleGlobalError = (error) => {
  console.error('Erreur globale:', error)
  
  // En production, envoyer à un service de monitoring
  if (process.env.NODE_ENV === 'production') {
    // Sentry.captureException(error)
  }
}

// ===== PROVIDE/INJECT =====
provide('setGlobalLoading', setGlobalLoading)
provide('handleGlobalError', handleGlobalError)

// ===== LIFECYCLE =====
onMounted(async () => {
  try {
    // Initialiser l'authentification au démarrage
    setGlobalLoading(true, 'Initialisation...')
    
    await authStore.initializeAuth()
    
    // Initialiser d'autres services si nécessaire
    // await initializeAnalytics()
    // await initializeNotifications()
    
    console.log('✅ Application initialisée')
    
  } catch (error) {
    console.error('❌ Erreur initialisation app:', error)
    handleGlobalError(error)
  } finally {
    setGlobalLoading(false)
  }
})

// ===== GESTION D'ERREURS VUE =====
const handleVueError = (err, instance, info) => {
  console.error('Vue Error:', err, info)
  handleGlobalError(err)
}

// ===== ANALYTICS HELPERS =====
const initializeAnalytics = () => {
  // Configuration Google Analytics
  if (typeof gtag !== 'undefined') {
    gtag('config', process.env.VUE_APP_GA4_ID, {
      send_page_view: false, // Vue Router gère les page views
      custom_map: {
        'custom_parameter_1': 'dimension1',
        'custom_parameter_2': 'dimension2'
      }
    })
  }
  
  // Configuration Meta Pixel
  if (typeof fbq !== 'undefined') {
    fbq('init', process.env.VUE_APP_META_PIXEL_ID)
    fbq('track', 'PageView')
  }
  
  console.log('📊 Analytics initialisé')
}

// ===== PERFORMANCE MONITORING =====
if (process.env.NODE_ENV === 'production') {
  // Web Vitals monitoring
  const observeWebVitals = () => {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS((metric) => {
        if (typeof gtag !== 'undefined') {
          gtag('event', 'web_vitals', {
            event_category: 'Web Vitals',
            event_label: 'CLS',
            value: Math.round(metric.value * 1000)
          })
        }
      })
      
      getFID((metric) => {
        if (typeof gtag !== 'undefined') {
          gtag('event', 'web_vitals', {
            event_category: 'Web Vitals',
            event_label: 'FID',
            value: Math.round(metric.value)
          })
        }
      })
      
      getFCP((metric) => {
        if (typeof gtag !== 'undefined') {
          gtag('event', 'web_vitals', {
            event_category: 'Web Vitals',
            event_label: 'FCP',
            value: Math.round(metric.value)
          })
        }
      })
      
      getLCP((metric) => {
        if (typeof gtag !== 'undefined') {
          gtag('event', 'web_vitals', {
            event_category: 'Web Vitals',
            event_label: 'LCP',
            value: Math.round(metric.value)
          })
        }
      })
      
      getTTFB((metric) => {
        if (typeof gtag !== 'undefined') {
          gtag('event', 'web_vitals', {
            event_category: 'Web Vitals',
            event_label: 'TTFB',
            value: Math.round(metric.value)
          })
        }
      })
    })
  }
  
  // Observer après que la page soit entièrement chargée
  if (document.readyState === 'complete') {
    observeWebVitals()
  } else {
    window.addEventListener('load', observeWebVitals)
  }
}
</script>

<style lang="scss">
// App styles principaux (déjà définis dans main.scss)
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

// Loading overlay global
.app-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(5px);
  
  .loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #f0f0f0;
    border-top: 4px solid $primary-color;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: $spacing-base;
  }
  
  .loading-text {
    font-family: $font-primary;
    font-weight: $font-weight-medium;
    color: $secondary-color;
    margin: 0;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
}

// Optimisations pour les mobiles
@media (max-width: 768px) {
  .app {
    // Désactiver le zoom sur focus d'input
    input, textarea, select {
      font-size: 16px; // Empêche le zoom sur iOS
    }
  }
  
  // Masquer la scrollbar horizontale sur mobile
  body {
    overflow-x: hidden;
  }
}

// Mode sombre (si implémenté plus tard)
@media (prefers-color-scheme: dark) {
  .app {
    // Variables sombres si nécessaire
  }
}

// Accessibilité - réduire les animations si demandé
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

// Print styles
@media print {
  .app-loading-overlay,
  .no-print {
    display: none !important;
  }
  
  .app {
    min-height: auto;
  }
}
</style>
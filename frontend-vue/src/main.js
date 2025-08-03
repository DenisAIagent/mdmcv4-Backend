import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@vueuse/head'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

import App from './App.vue'
import router from './router'

// Styles globaux
import './assets/styles/main.scss'

// Configuration Vue app
const app = createApp(App)

// Configuration Pinia (state management)
const pinia = createPinia()
app.use(pinia)

// Configuration VueUse Head pour métadonnées SEO
const head = createHead()
app.use(head)

// Configuration Toast notifications
app.use(Toast, {
  transition: 'Vue-Toastification__bounce',
  maxToasts: 3,
  newestOnTop: true,
  position: 'top-right',
  timeout: 4000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false
})

// Configuration Vue Router
app.use(router)

// Directives globales
app.directive('focus', {
  mounted(el) {
    el.focus()
  }
})

// Propriétés globales
app.config.globalProperties.$api = {
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:5001/api/v1'
}

// Gestion d'erreurs globales
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err, info)
  
  // En production, envoyer à un service de logging
  if (process.env.NODE_ENV === 'production') {
    // Sentry, LogRocket, etc.
  }
}

// Analytics helper global
app.config.globalProperties.$analytics = {
  track(event, data = {}) {
    // Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', event, data)
    }
    
    // Meta Pixel
    if (typeof fbq !== 'undefined') {
      fbq('track', event, data)
    }
    
    // Console log en dev
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', event, data)
    }
  },
  
  trackSmartlinkView(artistSlug, trackSlug, smartlinkData) {
    this.track('smartlink_view', {
      artist_slug: artistSlug,
      track_slug: trackSlug,
      smartlink_id: smartlinkData.id,
      artist_name: smartlinkData.artist,
      track_title: smartlinkData.title,
      event_category: 'SmartLink',
      event_label: `${smartlinkData.artist} - ${smartlinkData.title}`
    })
  },
  
  trackPlatformClick(platform, artistSlug, trackSlug, smartlinkData) {
    this.track('platform_click', {
      platform: platform,
      artist_slug: artistSlug,
      track_slug: trackSlug,
      smartlink_id: smartlinkData.id,
      artist_name: smartlinkData.artist,
      track_title: smartlinkData.title,
      event_category: 'SmartLink',
      event_label: `${platform} - ${smartlinkData.artist} - ${smartlinkData.title}`,
      value: 1
    })
  }
}

// Montage de l'application
app.mount('#app')

// Cacher le loading spinner initial
const loadingElement = document.querySelector('.app-loading')
if (loadingElement) {
  loadingElement.style.display = 'none'
}

// Performance monitoring
if (process.env.NODE_ENV === 'production') {
  // Web Vitals
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(console.log)
    getFID(console.log) 
    getFCP(console.log)
    getLCP(console.log)
    getTTFB(console.log)
  })
}
<template>
  <div class="smartlink-public">
    <!-- SEO et métadonnées -->
    <Head v-if="smartlink">
      <title>{{ metaTitle }}</title>
      <meta name="description" :content="metaDescription" />
      <meta name="keywords" :content="metaKeywords" />
      
      <!-- Open Graph -->
      <meta property="og:title" :content="metaTitle" />
      <meta property="og:description" :content="metaDescription" />
      <meta property="og:image" :content="smartlink.coverImageUrl" />
      <meta property="og:url" :content="currentUrl" />
      <meta property="og:type" content="music.song" />
      
      <!-- Twitter Card -->
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" :content="metaTitle" />
      <meta name="twitter:description" :content="metaDescription" />
      <meta name="twitter:image" :content="smartlink.coverImageUrl" />
      
      <!-- Music specific -->
      <meta property="music:song" :content="smartlink.trackTitle" />
      <meta property="music:musician" :content="smartlink.artist?.name" />
      
      <!-- Canonical URL -->
      <link rel="canonical" :href="currentUrl" />
    </Head>
    
    <!-- Contenu principal -->
    <div class="smartlink-container">
      <!-- Loading state -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Chargement de votre SmartLink...</p>
      </div>
      
      <!-- Error state -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <h2>SmartLink non trouvé</h2>
        <p>{{ error }}</p>
        <router-link to="/" class="btn btn-primary">
          Retour à l'accueil
        </router-link>
      </div>
      
      <!-- SmartLink content -->
      <div v-else-if="smartlink" class="smartlink-content">
        <!-- Preview banner (mode admin) -->
        <div v-if="isPreview" class="preview-banner">
          <span class="preview-label">Mode Prévisualisation</span>
          <button @click="goToEdit" class="btn btn-sm btn-outline">
            Modifier
          </button>
        </div>
        
        <!-- SmartLink Player -->
        <SmartLinkPlayer 
          :smartlink="smartlink"
          @platform-click="handlePlatformClick"
        />
        
        <!-- Informations supplémentaires -->
        <div v-if="smartlink.description" class="smartlink-description">
          <p>{{ smartlink.description }}</p>
        </div>
        
        <!-- Powered by MDMC -->
        <div class="powered-by">
          <small>
            Powered by 
            <a href="https://www.mdmcmusicads.com" target="_blank" rel="noopener">
              MDMC Music Ads
            </a>
          </small>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Head } from '@vueuse/head'
import { useSmartLinksStore } from '@/stores/smartlinks'
import { useAuthStore } from '@/stores/auth'

import SmartLinkPlayer from '@/components/smartlinks/SmartLinkPlayer.vue'

// ===== PROPS =====
const props = defineProps({
  artistSlug: {
    type: String,
    required: true
  },
  trackSlug: {
    type: String,
    required: true
  },
  preview: {
    type: Boolean,
    default: false
  },
  utm_source: String,
  utm_medium: String,
  utm_campaign: String
})

// ===== STORES =====
const smartLinksStore = useSmartLinksStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

// ===== STATE =====
const loading = ref(true)
const error = ref(null)
const viewTracked = ref(false)

// ===== COMPUTED =====
const smartlink = computed(() => smartLinksStore.currentSmartLink)

const isPreview = computed(() => {
  return props.preview || route.query.preview === 'true'
})

const metaTitle = computed(() => {
  if (!smartlink.value) return 'MDMC SmartLinks'
  return `${smartlink.value.trackTitle} - ${smartlink.value.artist?.name}`
})

const metaDescription = computed(() => {
  if (!smartlink.value) return 'SmartLink MDMC Music Ads'
  
  const description = smartlink.value.description || 
    `Écoutez "${smartlink.value.trackTitle}" de ${smartlink.value.artist?.name} sur toutes les plateformes de streaming.`
  
  return description
})

const metaKeywords = computed(() => {
  if (!smartlink.value) return 'musique, streaming, smartlink'
  
  return [
    'musique',
    'streaming',
    smartlink.value.artist?.name,
    smartlink.value.trackTitle,
    'smartlink',
    'MDMC'
  ].filter(Boolean).join(', ')
})

const currentUrl = computed(() => {
  const baseUrl = process.env.VUE_APP_SITE_URL || window.location.origin
  return `${baseUrl}/#/smartlinks/${props.artistSlug}/${props.trackSlug}`
})

// ===== MÉTHODES =====
const fetchSmartLink = async () => {
  loading.value = true
  error.value = null
  
  try {
    await smartLinksStore.fetchSmartLinkBySlug(props.artistSlug, props.trackSlug)
    
    if (!smartlink.value) {
      throw new Error('SmartLink non trouvé')
    }
    
    // Tracker la vue si pas encore fait et pas en mode preview
    if (!viewTracked.value && !isPreview.value) {
      await trackView()
    }
    
  } catch (err) {
    console.error('Erreur chargement SmartLink:', err)
    error.value = err.message || 'Impossible de charger le SmartLink'
  } finally {
    loading.value = false
  }
}

const trackView = async () => {
  if (viewTracked.value || isPreview.value) return
  
  try {
    const metadata = {
      referrer: document.referrer,
      utm_source: props.utm_source,
      utm_medium: props.utm_medium,
      utm_campaign: props.utm_campaign,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      screen: {
        width: window.screen.width,
        height: window.screen.height
      },
      timestamp: new Date().toISOString()
    }
    
    await smartLinksStore.trackView(props.artistSlug, props.trackSlug, metadata)
    
    // Analytics Vue.js
    if (typeof window !== 'undefined' && window.$analytics) {
      window.$analytics.trackSmartlinkView(props.artistSlug, props.trackSlug, smartlink.value)
    }
    
    // Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'smartlink_view', {
        event_category: 'SmartLink',
        event_label: `${smartlink.value.artist?.name} - ${smartlink.value.trackTitle}`,
        artist_slug: props.artistSlug,
        track_slug: props.trackSlug,
        smartlink_id: smartlink.value._id
      })
    }
    
    // Meta Pixel
    if (typeof fbq !== 'undefined') {
      fbq('track', 'ViewContent', {
        content_type: 'music',
        content_id: smartlink.value._id,
        content_name: smartlink.value.trackTitle,
        content_category: 'SmartLink'
      })
    }
    
    viewTracked.value = true
    console.log('📊 Vue SmartLink trackée')
    
  } catch (err) {
    console.error('Erreur tracking vue:', err)
  }
}

const handlePlatformClick = async (platform, url) => {
  if (!smartlink.value) return
  
  try {
    // Tracker le clic
    if (!isPreview.value) {
      const metadata = {
        referrer: document.referrer,
        utm_source: props.utm_source,
        utm_medium: props.utm_medium,
        utm_campaign: props.utm_campaign,
        timestamp: new Date().toISOString()
      }
      
      await smartLinksStore.trackClick(props.artistSlug, props.trackSlug, platform, metadata)
      
      // Analytics Vue.js
      if (typeof window !== 'undefined' && window.$analytics) {
        window.$analytics.trackPlatformClick(platform, props.artistSlug, props.trackSlug, smartlink.value)
      }
      
      // Google Analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', 'platform_click', {
          event_category: 'SmartLink',
          event_label: `${platform} - ${smartlink.value.artist?.name} - ${smartlink.value.trackTitle}`,
          artist_slug: props.artistSlug,
          track_slug: props.trackSlug,
          platform: platform,
          value: 1
        })
      }
      
      // Meta Pixel
      if (typeof fbq !== 'undefined') {
        fbq('track', 'Lead', {
          content_type: 'music',
          content_id: smartlink.value._id,
          content_name: smartlink.value.trackTitle,
          source: platform
        })
      }
      
      console.log('📊 Clic plateforme tracké:', platform)
    }
    
    // Ouvrir le lien
    window.open(url, '_blank', 'noopener,noreferrer')
    
  } catch (err) {
    console.error('Erreur tracking clic:', err)
    // Ouvrir le lien même en cas d'erreur de tracking
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

const goToEdit = () => {
  if (authStore.isAuthenticated && smartlink.value) {
    router.push({
      name: 'admin-smartlinks-edit',
      params: { id: smartlink.value._id }
    })
  }
}

// ===== WATCHERS =====
watch(
  () => [props.artistSlug, props.trackSlug],
  () => {
    viewTracked.value = false
    fetchSmartLink()
  },
  { immediate: false }
)

// ===== LIFECYCLE =====
onMounted(() => {
  fetchSmartLink()
})
</script>

<style lang="scss" scoped>
.smartlink-public {
  min-height: 100vh;
  background: $gradient-hero;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-lg;
  
  @include mobile-only {
    padding: $spacing-base;
  }
}

.smartlink-container {
  width: 100%;
  max-width: $smartlink-max-width;
}

.loading-state,
.error-state {
  background: $white;
  border-radius: $smartlink-border-radius;
  padding: $spacing-3xl;
  text-align: center;
  box-shadow: $smartlink-shadow;
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f0f0f0;
    border-top: 4px solid $primary-color;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto $spacing-base;
  }
  
  p {
    color: $gray;
    margin-bottom: 0;
  }
}

.error-state {
  .error-icon {
    font-size: $font-size-4xl;
    margin-bottom: $spacing-base;
  }
  
  h2 {
    color: $secondary-color;
    margin-bottom: $spacing-base;
  }
  
  .btn {
    margin-top: $spacing-lg;
  }
}

.smartlink-content {
  .preview-banner {
    background: $warning;
    color: $secondary-color;
    padding: $spacing-sm $spacing-base;
    border-radius: $border-radius-base;
    margin-bottom: $spacing-lg;
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    .preview-label {
      font-weight: $font-weight-medium;
      font-size: $font-size-sm;
    }
  }
}

.smartlink-description {
  background: $white;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  margin-top: $spacing-lg;
  box-shadow: $shadow-sm;
  
  p {
    margin: 0;
    line-height: $line-height-relaxed;
    color: $secondary-color;
  }
}

.powered-by {
  text-align: center;
  margin-top: $spacing-lg;
  
  small {
    color: rgba($white, 0.8);
    font-size: $font-size-xs;
    
    a {
      color: $white;
      text-decoration: underline;
      
      &:hover {
        text-decoration: none;
      }
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
// Services API pour MDMC SmartLinks Vue.js
// Communication avec backend Express.js

import axios from 'axios'
import { useToast } from 'vue-toastification'

// Configuration de base Axios
const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:5001/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // Pour les cookies de session
})

// Intercepteur de requêtes
api.interceptors.request.use(
  (config) => {
    // Ajouter le token d'authentification si disponible
    const token = localStorage.getItem('mdmc_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Log en développement
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data)
    }
    
    return config
  },
  (error) => {
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  }
)

// Intercepteur de réponses
api.interceptors.response.use(
  (response) => {
    // Log en développement
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data)
    }
    
    return response
  },
  (error) => {
    const toast = useToast()
    
    console.error('❌ Response Error:', error)
    
    // Gestion des erreurs communes
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // Token expiré ou invalide
          localStorage.removeItem('mdmc_token')
          toast.error('Session expirée. Veuillez vous reconnecter.')
          window.location.href = '/admin/login'
          break
          
        case 403:
          toast.error('Accès refusé. Permissions insuffisantes.')
          break
          
        case 404:
          toast.error('Ressource non trouvée.')
          break
          
        case 422:
          // Erreurs de validation
          const errorMessage = data.error || 'Données invalides'
          toast.error(errorMessage)
          break
          
        case 429:
          toast.error('Trop de requêtes. Veuillez patienter.')
          break
          
        case 500:
          toast.error('Erreur serveur. Veuillez réessayer plus tard.')
          break
          
        default:
          toast.error(data.error || 'Une erreur est survenue')
      }
    } else if (error.request) {
      toast.error('Impossible de contacter le serveur. Vérifiez votre connexion.')
    } else {
      toast.error('Erreur inattendue. Veuillez réessayer.')
    }
    
    return Promise.reject(error)
  }
)

// ===== SERVICES SMARTLINKS =====
export const smartlinksAPI = {
  // Récupérer tous les SmartLinks (avec pagination et filtres)
  async getAll(params = {}) {
    const response = await api.get('/smartlinks', { params })
    return response.data
  },
  
  // Récupérer un SmartLink par slug composite
  async getBySlug(artistSlug, trackSlug) {
    const response = await api.get(`/smartlinks/public/${artistSlug}/${trackSlug}`)
    return response.data
  },
  
  // Récupérer un SmartLink par ID
  async getById(id) {
    const response = await api.get(`/smartlinks/${id}`)
    return response.data
  },
  
  // Créer un nouveau SmartLink
  async create(smartlinkData) {
    const response = await api.post('/smartlinks', smartlinkData)
    return response.data
  },
  
  // Mettre à jour un SmartLink
  async update(id, smartlinkData) {
    const response = await api.put(`/smartlinks/${id}`, smartlinkData)
    return response.data
  },
  
  // Supprimer un SmartLink
  async delete(id) {
    const response = await api.delete(`/smartlinks/${id}`)
    return response.data
  },
  
  // Dupliquer un SmartLink
  async duplicate(id) {
    const response = await api.post(`/smartlinks/${id}/duplicate`)
    return response.data
  },
  
  // Publier/dépublier un SmartLink
  async togglePublish(id, isPublished) {
    const response = await api.patch(`/smartlinks/${id}/publish`, { isPublished })
    return response.data
  },
  
  // Analytics d'un SmartLink
  async getAnalytics(id, timeframe = '7d') {
    const response = await api.get(`/smartlinks/${id}/analytics`, {
      params: { timeframe }
    })
    return response.data
  },
  
  // Tracker une vue
  async trackView(artistSlug, trackSlug, metadata = {}) {
    const response = await api.post(`/smartlinks/track/view`, {
      artistSlug,
      trackSlug,
      metadata: {
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    })
    return response.data
  },
  
  // Tracker un clic sur plateforme
  async trackClick(artistSlug, trackSlug, platform, metadata = {}) {
    const response = await api.post(`/smartlinks/track/click`, {
      artistSlug,
      trackSlug,
      platform,
      metadata: {
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    })
    return response.data
  }
}

// ===== SERVICES ARTISTES =====
export const artistsAPI = {
  // Récupérer tous les artistes
  async getAll(params = {}) {
    const response = await api.get('/artists', { params })
    return response.data
  },
  
  // Récupérer un artiste par ID
  async getById(id) {
    const response = await api.get(`/artists/${id}`)
    return response.data
  },
  
  // Récupérer un artiste par slug
  async getBySlug(slug) {
    const response = await api.get(`/artists/slug/${slug}`)
    return response.data
  },
  
  // Créer un nouvel artiste
  async create(artistData) {
    const response = await api.post('/artists', artistData)
    return response.data
  },
  
  // Mettre à jour un artiste
  async update(id, artistData) {
    const response = await api.put(`/artists/${id}`, artistData)
    return response.data
  },
  
  // Supprimer un artiste
  async delete(id) {
    const response = await api.delete(`/artists/${id}`)
    return response.data
  },
  
  // Rechercher des artistes
  async search(query) {
    const response = await api.get('/artists/search', {
      params: { q: query }
    })
    return response.data
  }
}

// ===== SERVICES AUTHENTIFICATION =====
export const authAPI = {
  // Connexion
  async login(credentials) {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },
  
  // Inscription
  async register(userData) {
    const response = await api.post('/auth/register', userData)
    return response.data
  },
  
  // Déconnexion
  async logout() {
    const response = await api.post('/auth/logout')
    return response.data
  },
  
  // Récupérer l'utilisateur actuel
  async getCurrentUser() {
    const response = await api.get('/auth/me')
    return response.data
  },
  
  // Réinitialiser le mot de passe
  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },
  
  // Confirmer la réinitialisation
  async resetPassword(token, newPassword) {
    const response = await api.post('/auth/reset-password', {
      token,
      password: newPassword
    })
    return response.data
  }
}

// ===== SERVICES UPLOAD =====
export const uploadAPI = {
  // Upload d'image (cover, avatar, etc.)
  async uploadImage(file, type = 'general') {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('type', type)
    
    const response = await api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        console.log(`Upload progress: ${percentCompleted}%`)
      }
    })
    
    return response.data
  },
  
  // Upload d'audio (preview)
  async uploadAudio(file) {
    const formData = new FormData()
    formData.append('audio', file)
    
    const response = await api.post('/upload/audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        console.log(`Upload progress: ${percentCompleted}%`)
      }
    })
    
    return response.data
  }
}

// ===== SERVICES ANALYTICS =====
export const analyticsAPI = {
  // Dashboard analytics général
  async getDashboard(timeframe = '7d') {
    const response = await api.get('/analytics/dashboard', {
      params: { timeframe }
    })
    return response.data
  },
  
  // Analytics par SmartLink
  async getSmartlinkStats(timeframe = '7d') {
    const response = await api.get('/analytics/smartlinks', {
      params: { timeframe }
    })
    return response.data
  },
  
  // Analytics par plateforme
  async getPlatformStats(timeframe = '7d') {
    const response = await api.get('/analytics/platforms', {
      params: { timeframe }
    })
    return response.data
  },
  
  // Export des données
  async exportData(type, timeframe = '30d') {
    const response = await api.get(`/analytics/export/${type}`, {
      params: { timeframe },
      responseType: 'blob'
    })
    return response.data
  }
}

// ===== SERVICES INTÉGRATIONS =====
export const integrationsAPI = {
  // Service Odesli pour récupération automatique des liens
  async getOdesliData(url) {
    const response = await api.post('/integrations/odesli', { url })
    return response.data
  },
  
  // Configuration tracking IDs
  async updateTrackingConfig(config) {
    const response = await api.put('/integrations/tracking', config)
    return response.data
  },
  
  // Test webhook
  async testWebhook(url, data) {
    const response = await api.post('/integrations/webhook/test', { url, data })
    return response.data
  }
}

// Fonctions utilitaires
export const apiUtils = {
  // Helper pour construire des URLs d'images
  getImageUrl(path) {
    if (!path) return null
    if (path.startsWith('http')) return path
    return `${api.defaults.baseURL.replace('/api/v1', '')}/uploads/${path}`
  },
  
  // Helper pour les paramètres de requête
  buildQueryParams(params) {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        query.append(key, value)
      }
    })
    return query.toString()
  },
  
  // Helper pour le cache local
  setCacheItem(key, data, ttl = 300000) { // 5 minutes par défaut
    const item = {
      data,
      timestamp: Date.now(),
      ttl
    }
    localStorage.setItem(`mdmc_cache_${key}`, JSON.stringify(item))
  },
  
  getCacheItem(key) {
    const item = localStorage.getItem(`mdmc_cache_${key}`)
    if (!item) return null
    
    const parsed = JSON.parse(item)
    if (Date.now() - parsed.timestamp > parsed.ttl) {
      localStorage.removeItem(`mdmc_cache_${key}`)
      return null
    }
    
    return parsed.data
  },
  
  clearCache(pattern = '') {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('mdmc_cache_') && key.includes(pattern)) {
        localStorage.removeItem(key)
      }
    })
  }
}

// Export de l'instance Axios pour usage avancé
export { api }

// Export par défaut
export default {
  smartlinks: smartlinksAPI,
  artists: artistsAPI,
  auth: authAPI,
  upload: uploadAPI,
  analytics: analyticsAPI,
  integrations: integrationsAPI,
  utils: apiUtils
}
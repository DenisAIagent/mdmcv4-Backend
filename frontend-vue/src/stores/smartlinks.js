// Store SmartLinks - Pinia
// Gestion d'état des SmartLinks MDMC

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { smartlinksAPI, apiUtils } from '@/services/api'
import { useToast } from 'vue-toastification'

export const useSmartLinksStore = defineStore('smartlinks', () => {
  // ===== STATE =====
  const smartlinks = ref([])
  const currentSmartLink = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const filters = ref({
    search: '',
    artistId: '',
    isPublished: null,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  
  // Cache pour optimiser les performances
  const cache = ref(new Map())
  const cacheTimeout = 5 * 60 * 1000 // 5 minutes
  
  // ===== GETTERS =====
  const publishedSmartLinks = computed(() => {
    return smartlinks.value.filter(sl => sl.isPublished)
  })
  
  const draftSmartLinks = computed(() => {
    return smartlinks.value.filter(sl => !sl.isPublished)
  })
  
  const smartLinksByArtist = computed(() => {
    const grouped = {}
    smartlinks.value.forEach(sl => {
      const artistName = sl.artist?.name || 'Artiste inconnu'
      if (!grouped[artistName]) {
        grouped[artistName] = []
      }
      grouped[artistName].push(sl)
    })
    return grouped
  })
  
  const totalViews = computed(() => {
    return smartlinks.value.reduce((total, sl) => total + (sl.viewCount || 0), 0)
  })
  
  const totalClicks = computed(() => {
    return smartlinks.value.reduce((total, sl) => total + (sl.platformClickCount || 0), 0)
  })
  
  const averageConversion = computed(() => {
    const totalViews = smartlinks.value.reduce((total, sl) => total + (sl.viewCount || 0), 0)
    const totalClicks = smartlinks.value.reduce((total, sl) => total + (sl.platformClickCount || 0), 0)
    
    if (totalViews === 0) return 0
    return ((totalClicks / totalViews) * 100).toFixed(2)
  })
  
  // ===== ACTIONS =====
  const fetchSmartLinks = async (options = {}) => {
    loading.value = true
    error.value = null
    
    try {
      // Construire les paramètres de requête
      const params = {
        page: options.page || pagination.value.page,
        limit: options.limit || pagination.value.limit,
        ...filters.value,
        ...options.filters
      }
      
      // Vérifier le cache
      const cacheKey = JSON.stringify(params)
      const cached = cache.value.get(cacheKey)
      
      if (cached && Date.now() - cached.timestamp < cacheTimeout) {
        console.log('📦 SmartLinks depuis cache')
        smartlinks.value = cached.data.smartlinks
        pagination.value = cached.data.pagination
        return cached.data
      }
      
      const response = await smartlinksAPI.getAll(params)
      
      if (response.success) {
        smartlinks.value = response.smartlinks
        pagination.value = {
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages
        }
        
        // Mettre en cache
        cache.value.set(cacheKey, {
          data: response,
          timestamp: Date.now()
        })
        
        return response
      }
    } catch (err) {
      console.error('Erreur fetchSmartLinks:', err)
      error.value = err.response?.data?.error || 'Erreur lors du chargement'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const fetchSmartLinkBySlug = async (artistSlug, trackSlug, options = {}) => {
    loading.value = true
    error.value = null
    
    try {
      // Vérifier le cache d'abord
      const cacheKey = `smartlink_${artistSlug}_${trackSlug}`
      const cached = apiUtils.getCacheItem(cacheKey)
      
      if (cached && !options.forceRefresh) {
        console.log('📦 SmartLink depuis cache:', cached.title)
        currentSmartLink.value = cached
        return cached
      }
      
      const response = await smartlinksAPI.getBySlug(artistSlug, trackSlug)
      
      if (response.success) {
        currentSmartLink.value = response.smartlink
        
        // Mettre en cache
        apiUtils.setCacheItem(cacheKey, response.smartlink, 300000) // 5 minutes
        
        return response.smartlink
      }
    } catch (err) {
      console.error('Erreur fetchSmartLinkBySlug:', err)
      error.value = err.response?.data?.error || 'SmartLink non trouvé'
      
      // Si 404, vider currentSmartLink
      if (err.response?.status === 404) {
        currentSmartLink.value = null
      }
      
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const createSmartLink = async (smartlinkData) => {
    const toast = useToast()
    loading.value = true
    
    try {
      const response = await smartlinksAPI.create(smartlinkData)
      
      if (response.success) {
        // Ajouter à la liste locale
        smartlinks.value.unshift(response.smartlink)
        
        // Invalider le cache
        clearCache()
        
        // Analytics
        if (typeof gtag !== 'undefined') {
          gtag('event', 'smartlink_created', {
            event_category: 'Content',
            artist_name: response.smartlink.artist?.name,
            track_title: response.smartlink.trackTitle
          })
        }
        
        toast.success('SmartLink créé avec succès!')
        return response.smartlink
      }
    } catch (err) {
      console.error('Erreur createSmartLink:', err)
      const errorMsg = err.response?.data?.error || 'Erreur lors de la création'
      toast.error(errorMsg)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const updateSmartLink = async (id, smartlinkData) => {
    const toast = useToast()
    loading.value = true
    
    try {
      const response = await smartlinksAPI.update(id, smartlinkData)
      
      if (response.success) {
        // Mettre à jour dans la liste locale
        const index = smartlinks.value.findIndex(sl => sl._id === id)
        if (index !== -1) {
          smartlinks.value[index] = response.smartlink
        }
        
        // Mettre à jour currentSmartLink si c'est le même
        if (currentSmartLink.value?._id === id) {
          currentSmartLink.value = response.smartlink
        }
        
        // Invalider le cache
        clearCache()
        
        // Analytics
        if (typeof gtag !== 'undefined') {
          gtag('event', 'smartlink_updated', {
            event_category: 'Content',
            smartlink_id: id
          })
        }
        
        toast.success('SmartLink mis à jour avec succès!')
        return response.smartlink
      }
    } catch (err) {
      console.error('Erreur updateSmartLink:', err)
      const errorMsg = err.response?.data?.error || 'Erreur lors de la mise à jour'
      toast.error(errorMsg)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const deleteSmartLink = async (id) => {
    const toast = useToast()
    loading.value = true
    
    try {
      const response = await smartlinksAPI.delete(id)
      
      if (response.success) {
        // Supprimer de la liste locale
        smartlinks.value = smartlinks.value.filter(sl => sl._id !== id)
        
        // Vider currentSmartLink si c'était celui-ci
        if (currentSmartLink.value?._id === id) {
          currentSmartLink.value = null
        }
        
        // Invalider le cache
        clearCache()
        
        // Analytics
        if (typeof gtag !== 'undefined') {
          gtag('event', 'smartlink_deleted', {
            event_category: 'Content',
            smartlink_id: id
          })
        }
        
        toast.success('SmartLink supprimé avec succès!')
        return response
      }
    } catch (err) {
      console.error('Erreur deleteSmartLink:', err)
      const errorMsg = err.response?.data?.error || 'Erreur lors de la suppression'
      toast.error(errorMsg)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const duplicateSmartLink = async (id) => {
    const toast = useToast()
    loading.value = true
    
    try {
      const response = await smartlinksAPI.duplicate(id)
      
      if (response.success) {
        // Ajouter la copie à la liste
        smartlinks.value.unshift(response.smartlink)
        
        // Invalider le cache
        clearCache()
        
        toast.success('SmartLink dupliqué avec succès!')
        return response.smartlink
      }
    } catch (err) {
      console.error('Erreur duplicateSmartLink:', err)
      const errorMsg = err.response?.data?.error || 'Erreur lors de la duplication'
      toast.error(errorMsg)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const togglePublish = async (id, isPublished) => {
    const toast = useToast()
    
    try {
      const response = await smartlinksAPI.togglePublish(id, isPublished)
      
      if (response.success) {
        // Mettre à jour localement
        const index = smartlinks.value.findIndex(sl => sl._id === id)
        if (index !== -1) {
          smartlinks.value[index].isPublished = isPublished
        }
        
        if (currentSmartLink.value?._id === id) {
          currentSmartLink.value.isPublished = isPublished
        }
        
        // Invalider le cache
        clearCache()
        
        const status = isPublished ? 'publié' : 'mis en brouillon'
        toast.success(`SmartLink ${status} avec succès!`)
        
        return response.smartlink
      }
    } catch (err) {
      console.error('Erreur togglePublish:', err)
      const errorMsg = err.response?.data?.error || 'Erreur lors du changement de statut'
      toast.error(errorMsg)
      throw err
    }
  }
  
  const trackView = async (artistSlug, trackSlug, metadata = {}) => {
    try {
      await smartlinksAPI.trackView(artistSlug, trackSlug, metadata)
      
      // Mettre à jour le compteur local si le SmartLink est chargé
      if (currentSmartLink.value && 
          currentSmartLink.value.artist?.slug === artistSlug &&
          currentSmartLink.value.slug === trackSlug) {
        currentSmartLink.value.viewCount = (currentSmartLink.value.viewCount || 0) + 1
      }
      
      console.log('📊 Vue trackée:', artistSlug, trackSlug)
    } catch (err) {
      console.error('Erreur trackView:', err)
    }
  }
  
  const trackClick = async (artistSlug, trackSlug, platform, metadata = {}) => {
    try {
      await smartlinksAPI.trackClick(artistSlug, trackSlug, platform, metadata)
      
      // Mettre à jour les compteurs locaux
      if (currentSmartLink.value && 
          currentSmartLink.value.artist?.slug === artistSlug &&
          currentSmartLink.value.slug === trackSlug) {
        currentSmartLink.value.platformClickCount = (currentSmartLink.value.platformClickCount || 0) + 1
        
        // Mettre à jour les stats par plateforme
        if (!currentSmartLink.value.platformClickStats) {
          currentSmartLink.value.platformClickStats = {}
        }
        currentSmartLink.value.platformClickStats[platform] = 
          (currentSmartLink.value.platformClickStats[platform] || 0) + 1
      }
      
      console.log('📊 Clic tracké:', platform, artistSlug, trackSlug)
    } catch (err) {
      console.error('Erreur trackClick:', err)
    }
  }
  
  const searchSmartLinks = async (query) => {
    loading.value = true
    
    try {
      const response = await smartlinksAPI.getAll({
        search: query,
        limit: 50
      })
      
      return response.smartlinks || []
    } catch (err) {
      console.error('Erreur searchSmartLinks:', err)
      return []
    } finally {
      loading.value = false
    }
  }
  
  const setFilters = (newFilters) => {
    filters.value = { ...filters.value, ...newFilters }
    
    // Resettre la pagination quand on change les filtres
    pagination.value.page = 1
    
    // Invalider le cache
    clearCache()
  }
  
  const clearCache = () => {
    cache.value.clear()
    apiUtils.clearCache('smartlink')
  }
  
  const resetStore = () => {
    smartlinks.value = []
    currentSmartLink.value = null
    loading.value = false
    error.value = null
    pagination.value = {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    }
    filters.value = {
      search: '',
      artistId: '',
      isPublished: null,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }
    clearCache()
  }
  
  // ===== EXPORTS =====
  return {
    // State
    smartlinks,
    currentSmartLink,
    loading,
    error,
    pagination,
    filters,
    
    // Getters
    publishedSmartLinks,
    draftSmartLinks,
    smartLinksByArtist,
    totalViews,
    totalClicks,
    averageConversion,
    
    // Actions
    fetchSmartLinks,
    fetchSmartLinkBySlug,
    createSmartLink,
    updateSmartLink,
    deleteSmartLink,
    duplicateSmartLink,
    togglePublish,
    trackView,
    trackClick,
    searchSmartLinks,
    setFilters,
    clearCache,
    resetStore
  }
})
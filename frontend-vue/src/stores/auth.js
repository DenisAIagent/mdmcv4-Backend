// Store d'authentification - Pinia
// Gestion des sessions admin MDMC SmartLinks

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '@/services/api'
import { useToast } from 'vue-toastification'

export const useAuthStore = defineStore('auth', () => {
  // ===== STATE =====
  const user = ref(null)
  const token = ref(localStorage.getItem('mdmc_token'))
  const loading = ref(false)
  const loginError = ref(null)
  
  // ===== GETTERS =====
  const isAuthenticated = computed(() => {
    return !!(token.value && user.value)
  })
  
  const userRole = computed(() => {
    return user.value?.role || null
  })
  
  const userName = computed(() => {
    return user.value?.name || user.value?.email || 'Utilisateur'
  })
  
  const hasRole = computed(() => {
    return (role) => {
      if (!user.value) return false
      
      // Système de hiérarchie des rôles
      const roleHierarchy = {
        'super_admin': ['super_admin', 'admin', 'editor', 'viewer'],
        'admin': ['admin', 'editor', 'viewer'],
        'editor': ['editor', 'viewer'],
        'viewer': ['viewer']
      }
      
      const userRole = user.value.role
      return roleHierarchy[userRole]?.includes(role) || false
    }
  })
  
  const permissions = computed(() => {
    if (!user.value) return []
    
    // Définir les permissions par rôle
    const rolePermissions = {
      'super_admin': [
        'smartlinks.create',
        'smartlinks.read',
        'smartlinks.update',
        'smartlinks.delete',
        'artists.create',
        'artists.read',
        'artists.update',
        'artists.delete',
        'analytics.view',
        'users.manage',
        'settings.manage'
      ],
      'admin': [
        'smartlinks.create',
        'smartlinks.read',
        'smartlinks.update',
        'smartlinks.delete',
        'artists.create',
        'artists.read',
        'artists.update',
        'artists.delete',
        'analytics.view'
      ],
      'editor': [
        'smartlinks.create',
        'smartlinks.read',
        'smartlinks.update',
        'artists.read',
        'analytics.view'
      ],
      'viewer': [
        'smartlinks.read',
        'artists.read',
        'analytics.view'
      ]
    }
    
    return rolePermissions[user.value.role] || []
  })
  
  const canPerform = computed(() => {
    return (action) => permissions.value.includes(action)
  })
  
  // ===== ACTIONS =====
  const login = async (credentials) => {
    const toast = useToast()
    loading.value = true
    loginError.value = null
    
    try {
      const response = await authAPI.login(credentials)
      
      if (response.success) {
        // Stocker les données d'authentification
        token.value = response.token
        user.value = response.user
        
        // Persister dans localStorage
        localStorage.setItem('mdmc_token', response.token)
        localStorage.setItem('mdmc_user', JSON.stringify(response.user))
        
        // Analytics login
        if (typeof gtag !== 'undefined') {
          gtag('event', 'login', {
            method: 'email',
            event_category: 'authentication',
            user_role: response.user.role
          })
        }
        
        toast.success(`Bienvenue ${userName.value}!`)
        
        return response
      }
    } catch (error) {
      console.error('Erreur login:', error)
      loginError.value = error.response?.data?.error || 'Erreur de connexion'
      
      // Analytics login failed
      if (typeof gtag !== 'undefined') {
        gtag('event', 'login_failed', {
          method: 'email',
          event_category: 'authentication',
          error_message: loginError.value
        })
      }
      
      throw error
    } finally {
      loading.value = false
    }
  }
  
  const logout = async () => {
    const toast = useToast()
    loading.value = true
    
    try {
      // Appeler l'API de déconnexion si token valide
      if (token.value) {
        await authAPI.logout()
      }
    } catch (error) {
      console.log('Erreur logout API (non critique):', error)
    } finally {
      // Nettoyer l'état local dans tous les cas
      clearAuthData()
      
      // Analytics logout
      if (typeof gtag !== 'undefined') {
        gtag('event', 'logout', {
          event_category: 'authentication'
        })
      }
      
      toast.info('Déconnexion réussie')
      loading.value = false
    }
  }
  
  const getCurrentUser = async () => {
    if (!token.value) {
      throw new Error('Aucun token disponible')
    }
    
    try {
      const response = await authAPI.getCurrentUser()
      
      if (response.success) {
        user.value = response.user
        
        // Mettre à jour localStorage
        localStorage.setItem('mdmc_user', JSON.stringify(response.user))
        
        return response.user
      } else {
        throw new Error('Impossible de récupérer l\'utilisateur')
      }
    } catch (error) {
      console.error('Erreur getCurrentUser:', error)
      
      // Si l'erreur est 401, nettoyer l'auth
      if (error.response?.status === 401) {
        clearAuthData()
      }
      
      throw error
    }
  }
  
  const register = async (userData) => {
    const toast = useToast()
    loading.value = true
    
    try {
      const response = await authAPI.register(userData)
      
      if (response.success) {
        toast.success('Inscription réussie! Veuillez vous connecter.')
        
        // Analytics register
        if (typeof gtag !== 'undefined') {
          gtag('event', 'sign_up', {
            method: 'email',
            event_category: 'authentication'
          })
        }
        
        return response
      }
    } catch (error) {
      console.error('Erreur register:', error)
      
      // Analytics register failed
      if (typeof gtag !== 'undefined') {
        gtag('event', 'sign_up_failed', {
          method: 'email',
          event_category: 'authentication',
          error_message: error.response?.data?.error || 'Erreur inscription'
        })
      }
      
      throw error
    } finally {
      loading.value = false
    }
  }
  
  const forgotPassword = async (email) => {
    const toast = useToast()
    loading.value = true
    
    try {
      const response = await authAPI.forgotPassword(email)
      
      if (response.success) {
        toast.success('Email de réinitialisation envoyé!')
        
        // Analytics password reset request
        if (typeof gtag !== 'undefined') {
          gtag('event', 'password_reset_request', {
            event_category: 'authentication'
          })
        }
        
        return response
      }
    } catch (error) {
      console.error('Erreur forgotPassword:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  const resetPassword = async (token, newPassword) => {
    const toast = useToast()
    loading.value = true
    
    try {
      const response = await authAPI.resetPassword(token, newPassword)
      
      if (response.success) {
        toast.success('Mot de passe réinitialisé avec succès!')
        
        // Analytics password reset success
        if (typeof gtag !== 'undefined') {
          gtag('event', 'password_reset_success', {
            event_category: 'authentication'
          })
        }
        
        return response
      }
    } catch (error) {
      console.error('Erreur resetPassword:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  const initializeAuth = async () => {
    // Récupérer les données depuis localStorage au démarrage
    const storedToken = localStorage.getItem('mdmc_token')
    const storedUser = localStorage.getItem('mdmc_user')
    
    if (storedToken && storedUser) {
      try {
        token.value = storedToken
        user.value = JSON.parse(storedUser)
        
        // Vérifier la validité du token en récupérant l'utilisateur actuel
        await getCurrentUser()
        
        console.log('✅ Auth initialisée:', userName.value)
      } catch (error) {
        console.log('❌ Token invalide, nettoyage auth')
        clearAuthData()
      }
    }
  }
  
  const clearAuthData = () => {
    user.value = null
    token.value = null
    loginError.value = null
    
    // Nettoyer localStorage
    localStorage.removeItem('mdmc_token')
    localStorage.removeItem('mdmc_user')
    
    // Nettoyer les caches API
    localStorage.removeItem('mdmc_cache_dashboard')
    localStorage.removeItem('mdmc_cache_smartlinks')
  }
  
  const updateProfile = async (profileData) => {
    const toast = useToast()
    loading.value = true
    
    try {
      // Cette route n'existe pas encore dans l'API, mais on peut la préparer
      const response = await authAPI.updateProfile(profileData)
      
      if (response.success) {
        user.value = { ...user.value, ...response.user }
        localStorage.setItem('mdmc_user', JSON.stringify(user.value))
        
        toast.success('Profil mis à jour avec succès!')
        return response
      }
    } catch (error) {
      console.error('Erreur updateProfile:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  const checkPermission = (action) => {
    return canPerform.value(action)
  }
  
  const requirePermission = (action) => {
    if (!checkPermission(action)) {
      throw new Error(`Permission refusée: ${action}`)
    }
  }
  
  // ===== EXPORTS =====
  return {
    // State
    user,
    token,
    loading,
    loginError,
    
    // Getters
    isAuthenticated,
    userRole,
    userName,
    hasRole,
    permissions,
    canPerform,
    
    // Actions
    login,
    logout,
    getCurrentUser,
    register,
    forgotPassword,
    resetPassword,
    initializeAuth,
    clearAuthData,
    updateProfile,
    checkPermission,
    requirePermission
  }
})
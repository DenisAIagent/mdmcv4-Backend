// Vue Router Configuration pour MDMC SmartLinks
// Routes SPA avec hash routing selon spécifications

import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// ===== LAZY LOADING DES COMPOSANTS =====
// Layout principal
const AppLayout = () => import('@/layouts/AppLayout.vue')
const AdminLayout = () => import('@/layouts/AdminLayout.vue')

// Pages publiques
const HomePage = () => import('@/views/public/HomePage.vue')
const SmartLinkPublic = () => import('@/views/public/SmartLinkPublic.vue')

// Pages admin
const AdminDashboard = () => import('@/views/admin/AdminDashboard.vue')
const AdminLogin = () => import('@/views/admin/AdminLogin.vue')

// SmartLinks admin
const SmartLinksIndex = () => import('@/views/admin/smartlinks/SmartLinksIndex.vue')
const SmartLinkCreate = () => import('@/views/admin/smartlinks/SmartLinkCreate.vue')
const SmartLinkEdit = () => import('@/views/admin/smartlinks/SmartLinkEdit.vue')
const SmartLinkAnalytics = () => import('@/views/admin/smartlinks/SmartLinkAnalytics.vue')

// Artistes admin
const ArtistsIndex = () => import('@/views/admin/artists/ArtistsIndex.vue')
const ArtistCreate = () => import('@/views/admin/artists/ArtistCreate.vue')
const ArtistEdit = () => import('@/views/admin/artists/ArtistEdit.vue')

// Analytics admin
const AnalyticsDashboard = () => import('@/views/admin/analytics/AnalyticsDashboard.vue')
const AnalyticsSmartLinks = () => import('@/views/admin/analytics/AnalyticsSmartLinks.vue')
const AnalyticsPlatforms = () => import('@/views/admin/analytics/AnalyticsPlatforms.vue')

// Pages d'erreur
const NotFound = () => import('@/views/errors/NotFound.vue')
const ServerError = () => import('@/views/errors/ServerError.vue')

// ===== CONFIGURATION DES ROUTES =====
const routes = [
  // ===== ROUTES PUBLIQUES =====
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: HomePage,
        meta: {
          title: 'MDMC SmartLinks - Marketing Musical qui Convertit',
          description: 'Créez des liens intelligents pour vos sorties musicales. Centralisez tous vos liens de streaming en un seul endroit.',
          requiresAuth: false,
          showInSitemap: true
        }
      },
      
      // ===== ROUTE SMARTLINK PUBLIC =====
      // Route principale selon spécifications : /#/smartlinks/:artistSlug/:trackSlug
      {
        path: '/smartlinks/:artistSlug/:trackSlug',
        name: 'smartlink-public',
        component: SmartLinkPublic,
        meta: {
          requiresAuth: false,
          dynamicMeta: true, // Métadonnées générées dynamiquement
          showInSitemap: false // Pas dans le sitemap (trop de variantes)
        },
        props: route => ({
          artistSlug: route.params.artistSlug,
          trackSlug: route.params.trackSlug,
          preview: route.query.preview === 'true',
          utm_source: route.query.utm_source,
          utm_medium: route.query.utm_medium,
          utm_campaign: route.query.utm_campaign
        })
      }
    ]
  },
  
  // ===== ROUTES ADMIN =====
  {
    path: '/admin',
    component: AdminLayout,
    meta: {
      requiresAuth: true,
      requiresRole: 'admin'
    },
    children: [
      // Dashboard admin
      {
        path: '',
        redirect: { name: 'admin-dashboard' }
      },
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: AdminDashboard,
        meta: {
          title: 'Dashboard Admin - MDMC SmartLinks',
          description: 'Tableau de bord administrateur MDMC SmartLinks',
          breadcrumb: 'Dashboard'
        }
      },
      
      // ===== GESTION SMARTLINKS =====
      {
        path: 'smartlinks',
        name: 'admin-smartlinks',
        component: SmartLinksIndex,
        meta: {
          title: 'Gestion SmartLinks - MDMC Admin',
          description: 'Gérer tous vos SmartLinks depuis le back-office',
          breadcrumb: 'SmartLinks'
        }
      },
      {
        path: 'smartlinks/create',
        name: 'admin-smartlinks-create',
        component: SmartLinkCreate,
        meta: {
          title: 'Créer un SmartLink - MDMC Admin',
          description: 'Créer un nouveau SmartLink pour un artiste',
          breadcrumb: 'Créer SmartLink'
        }
      },
      {
        path: 'smartlinks/:id/edit',
        name: 'admin-smartlinks-edit',
        component: SmartLinkEdit,
        meta: {
          title: 'Modifier SmartLink - MDMC Admin',
          description: 'Modifier un SmartLink existant',
          breadcrumb: 'Modifier SmartLink'
        },
        props: true
      },
      {
        path: 'smartlinks/:id/analytics',
        name: 'admin-smartlinks-analytics',
        component: SmartLinkAnalytics,
        meta: {
          title: 'Analytics SmartLink - MDMC Admin',
          description: 'Statistiques détaillées du SmartLink',
          breadcrumb: 'Analytics SmartLink'
        },
        props: true
      },
      
      // ===== GESTION ARTISTES =====
      {
        path: 'artists',
        name: 'admin-artists',
        component: ArtistsIndex,
        meta: {
          title: 'Gestion Artistes - MDMC Admin',
          description: 'Gérer la base de données des artistes',
          breadcrumb: 'Artistes'
        }
      },
      {
        path: 'artists/create',
        name: 'admin-artists-create',
        component: ArtistCreate,
        meta: {
          title: 'Ajouter Artiste - MDMC Admin',
          description: 'Ajouter un nouvel artiste à la base',
          breadcrumb: 'Ajouter Artiste'
        }
      },
      {
        path: 'artists/:id/edit',
        name: 'admin-artists-edit',
        component: ArtistEdit,
        meta: {
          title: 'Modifier Artiste - MDMC Admin',
          description: 'Modifier les informations d\'un artiste',
          breadcrumb: 'Modifier Artiste'
        },
        props: true
      },
      
      // ===== ANALYTICS =====
      {
        path: 'analytics',
        name: 'admin-analytics',
        component: AnalyticsDashboard,
        meta: {
          title: 'Analytics Générales - MDMC Admin',
          description: 'Vue d\'ensemble des performances',
          breadcrumb: 'Analytics'
        }
      },
      {
        path: 'analytics/smartlinks',
        name: 'admin-analytics-smartlinks',
        component: AnalyticsSmartLinks,
        meta: {
          title: 'Analytics SmartLinks - MDMC Admin',
          description: 'Performances détaillées par SmartLink',
          breadcrumb: 'Analytics SmartLinks'
        }
      },
      {
        path: 'analytics/platforms',
        name: 'admin-analytics-platforms',
        component: AnalyticsPlatforms,
        meta: {
          title: 'Analytics Plateformes - MDMC Admin',
          description: 'Performances par plateforme de streaming',
          breadcrumb: 'Analytics Plateformes'
        }
      }
    ]
  },
  
  // ===== AUTHENTIFICATION =====
  {
    path: '/admin/login',
    name: 'admin-login',
    component: AdminLogin,
    meta: {
      title: 'Connexion Admin - MDMC SmartLinks',
      description: 'Accès sécurisé au back-office MDMC',
      requiresAuth: false,
      layout: 'blank',
      hideFromGuests: false
    }
  },
  
  // ===== PAGES D'ERREUR =====
  {
    path: '/404',
    name: 'not-found',
    component: NotFound,
    meta: {
      title: 'Page non trouvée - MDMC SmartLinks',
      description: 'La page demandée n\'existe pas.',
      requiresAuth: false
    }
  },
  {
    path: '/500',
    name: 'server-error',
    component: ServerError,
    meta: {
      title: 'Erreur Serveur - MDMC SmartLinks',
      description: 'Une erreur serveur s\'est produite.',
      requiresAuth: false
    }
  },
  
  // ===== REDIRECT ET CATCH-ALL =====
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'not-found' }
  }
]

// ===== CRÉATION DU ROUTER =====
const router = createRouter({
  // Utilisation du hash routing comme spécifié
  history: createWebHashHistory(),
  routes,
  
  // Configuration du scroll
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth'
      }
    } else {
      return { top: 0 }
    }
  }
})

// ===== GUARDS DE NAVIGATION =====
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Vérifier l'authentification si nécessaire
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Essayer de récupérer l'utilisateur depuis le token
    try {
      await authStore.getCurrentUser()
    } catch (error) {
      console.log('Utilisateur non authentifié')
    }
    
    // Si toujours pas authentifié, rediriger vers login
    if (!authStore.isAuthenticated) {
      return next({
        name: 'admin-login',
        query: { redirect: to.fullPath }
      })
    }
  }
  
  // Vérifier les rôles si nécessaire
  if (to.meta.requiresRole && authStore.user) {
    const userRole = authStore.user.role
    const requiredRole = to.meta.requiresRole
    
    if (userRole !== requiredRole && !authStore.hasRole(requiredRole)) {
      return next({ name: 'not-found' })
    }
  }
  
  // Rediriger les utilisateurs connectés loin de la page de login
  if (to.name === 'admin-login' && authStore.isAuthenticated) {
    return next({ name: 'admin-dashboard' })
  }
  
  next()
})

// Navigation tracking pour analytics
router.afterEach((to, from) => {
  // Analytics de navigation
  if (typeof gtag !== 'undefined') {
    gtag('config', process.env.VUE_APP_GA4_ID, {
      page_title: to.meta.title || to.name,
      page_location: window.location.href,
      page_path: to.fullPath
    })
  }
  
  // Tracking des SmartLinks views
  if (to.name === 'smartlink-public') {
    // Le tracking se fera dans le composant SmartLinkPublic
    // pour avoir accès aux données du SmartLink
    console.log(`📊 SmartLink view: ${to.params.artistSlug}/${to.params.trackSlug}`)
  }
  
  // Log en développement
  if (process.env.NODE_ENV === 'development') {
    console.log(`🧭 Navigation: ${from.name || 'unknown'} → ${to.name}`)
  }
})

// ===== HELPERS DE NAVIGATION =====
export const navigationHelpers = {
  // Construire une URL de SmartLink public
  buildSmartLinkUrl(artistSlug, trackSlug, options = {}) {
    const route = {
      name: 'smartlink-public',
      params: { artistSlug, trackSlug }
    }
    
    // Ajouter les paramètres UTM si fournis
    const query = {}
    if (options.utm_source) query.utm_source = options.utm_source
    if (options.utm_medium) query.utm_medium = options.utm_medium
    if (options.utm_campaign) query.utm_campaign = options.utm_campaign
    if (options.preview) query.preview = 'true'
    
    if (Object.keys(query).length > 0) {
      route.query = query
    }
    
    return router.resolve(route).href
  },
  
  // Construire une URL complète (avec domaine)
  buildFullUrl(artistSlug, trackSlug, options = {}) {
    const path = this.buildSmartLinkUrl(artistSlug, trackSlug, options)
    const baseUrl = process.env.VUE_APP_SITE_URL || window.location.origin
    return `${baseUrl}${path}`
  },
  
  // Naviguer vers un SmartLink en mode preview
  previewSmartLink(artistSlug, trackSlug) {
    router.push({
      name: 'smartlink-public',
      params: { artistSlug, trackSlug },
      query: { preview: 'true' }
    })
  }
}

export default router
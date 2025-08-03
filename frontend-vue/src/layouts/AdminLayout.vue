<template>
  <div class="admin-layout">
    <!-- Header admin -->
    <AdminHeader 
      @toggle-sidebar="toggleSidebar"
      :user="authStore.user"
    />
    
    <!-- Container principal -->
    <div class="admin-container">
      <!-- Sidebar navigation -->
      <AdminSidebar 
        :is-open="sidebarOpen"
        @close="closeSidebar"
      />
      
      <!-- Zone de contenu -->
      <div class="admin-content" :class="{ 'sidebar-open': sidebarOpen }">
        <!-- Breadcrumb -->
        <AdminBreadcrumb v-if="showBreadcrumb" />
        
        <!-- Contenu de la page -->
        <div class="page-content">
          <router-view />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRoute } from 'vue-router'

import AdminHeader from '@/components/admin/layout/AdminHeader.vue'
import AdminSidebar from '@/components/admin/layout/AdminSidebar.vue'
import AdminBreadcrumb from '@/components/admin/layout/AdminBreadcrumb.vue'

// ===== STORES =====
const authStore = useAuthStore()
const route = useRoute()

// ===== STATE =====
const sidebarOpen = ref(false)

// ===== COMPUTED =====
const showBreadcrumb = computed(() => {
  return route.meta.breadcrumb && route.name !== 'admin-dashboard'
})

// ===== MÉTHODES =====
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const closeSidebar = () => {
  sidebarOpen.value = false
}

const handleResize = () => {
  // Fermer automatiquement la sidebar sur mobile
  if (window.innerWidth < 1024) {
    sidebarOpen.value = false
  } else {
    // Ouvrir automatiquement sur desktop
    sidebarOpen.value = true
  }
}

// ===== LIFECYCLE =====
onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
  
  // Fermer la sidebar quand on clique en dehors (mobile)
  document.addEventListener('click', (e) => {
    if (window.innerWidth < 1024 && sidebarOpen.value) {
      const sidebar = document.querySelector('.admin-sidebar')
      const toggleBtn = document.querySelector('.sidebar-toggle')
      
      if (sidebar && !sidebar.contains(e.target) && !toggleBtn?.contains(e.target)) {
        closeSidebar()
      }
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.admin-layout {
  min-height: 100vh;
  background-color: $light-gray;
  display: flex;
  flex-direction: column;
}

.admin-container {
  flex: 1;
  display: flex;
  min-height: 0;
  position: relative;
}

.admin-content {
  flex: 1;
  min-width: 0;
  transition: margin-left $transition-base;
  
  @include desktop-up {
    margin-left: 0;
    
    &.sidebar-open {
      margin-left: $admin-sidebar-width;
    }
  }
}

.page-content {
  padding: $admin-content-padding;
  max-width: 100%;
  
  @include mobile-only {
    padding: $spacing-lg;
  }
}

// Overlay pour mobile
.admin-container::before {
  content: '';
  position: fixed;
  top: $admin-header-height;
  left: 0;
  width: 100%;
  height: calc(100vh - #{$admin-header-height});
  background: rgba(0, 0, 0, 0.5);
  z-index: $z-modal-backdrop - 10;
  opacity: 0;
  visibility: hidden;
  transition: $transition-opacity;
  
  @include mobile-only {
    .sidebar-open & {
      opacity: 1;
      visibility: visible;
    }
  }
  
  @include desktop-up {
    display: none;
  }
}
</style>
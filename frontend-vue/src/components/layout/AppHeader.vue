<template>
  <header class="app-header">
    <div class="container">
      <!-- Logo MDMC -->
      <router-link to="/" class="logo-link">
        <img 
          src="/assets/images/logo-mdmc.svg" 
          alt="MDMC Music Ads" 
          class="logo"
        />
      </router-link>
      
      <!-- Navigation publique -->
      <nav class="main-nav" :class="{ 'mobile-open': mobileMenuOpen }">
        <router-link to="/" class="nav-link">
          Accueil
        </router-link>
        <a href="https://www.mdmcmusicads.com/services" class="nav-link">
          Services
        </a>
        <a href="https://www.mdmcmusicads.com/contact" class="nav-link">
          Contact
        </a>
        <router-link to="/admin" class="nav-link admin-link">
          Admin
        </router-link>
      </nav>
      
      <!-- Menu mobile toggle -->
      <button 
        @click="toggleMobileMenu"
        class="mobile-menu-toggle"
        :class="{ 'open': mobileMenuOpen }"
        aria-label="Toggle navigation"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// ===== STATE =====
const mobileMenuOpen = ref(false)

// ===== MÉTHODES =====
const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

const handleResize = () => {
  if (window.innerWidth >= 768) {
    closeMobileMenu()
  }
}

const handleClickOutside = (event) => {
  const header = document.querySelector('.app-header')
  if (header && !header.contains(event.target)) {
    closeMobileMenu()
  }
}

// ===== LIFECYCLE =====
onMounted(() => {
  window.addEventListener('resize', handleResize)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="scss" scoped>
.app-header {
  background: $white;
  box-shadow: $shadow-sm;
  position: sticky;
  top: 0;
  z-index: $z-sticky;
  
  .container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-base $spacing-lg;
    
    @include mobile-only {
      padding: $spacing-sm $spacing-base;
    }
  }
}

.logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  
  &:focus {
    outline: 2px solid $primary-color;
    outline-offset: 2px;
    border-radius: $border-radius-sm;
  }
  
  .logo {
    height: 40px;
    width: auto;
    
    @include mobile-only {
      height: 32px;
    }
  }
}

.main-nav {
  display: flex;
  align-items: center;
  gap: $spacing-xl;
  
  @include mobile-only {
    position: fixed;
    top: 60px; // Hauteur du header mobile
    left: 0;
    width: 100%;
    height: calc(100vh - 60px);
    background: $white;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: $spacing-3xl $spacing-lg;
    gap: $spacing-2xl;
    transform: translateX(-100%);
    transition: $transition-transform;
    box-shadow: $shadow-lg;
    
    &.mobile-open {
      transform: translateX(0);
    }
  }
  
  .nav-link {
    font-family: $font-primary;
    font-weight: $font-weight-medium;
    font-size: $font-size-base;
    color: $secondary-color;
    text-decoration: none;
    padding: $spacing-sm;
    border-radius: $border-radius-base;
    transition: $transition-colors;
    
    &:hover {
      color: $primary-color;
      background: rgba($primary-color, 0.1);
    }
    
    &:focus {
      outline: 2px solid $primary-color;
      outline-offset: 2px;
    }
    
    &.router-link-active {
      color: $primary-color;
      font-weight: $font-weight-semibold;
    }
    
    &.admin-link {
      background: $gradient-primary;
      color: $white;
      padding: $spacing-sm $spacing-base;
      border-radius: $border-radius-lg;
      
      &:hover {
        background: $primary-dark;
        color: $white;
        transform: translateY(-1px);
        box-shadow: $shadow-base;
      }
    }
    
    @include mobile-only {
      font-size: $font-size-lg;
      padding: $spacing-base $spacing-lg;
      
      &.admin-link {
        padding: $spacing-base $spacing-xl;
      }
    }
  }
}

.mobile-menu-toggle {
  @include button-reset;
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 24px;
  height: 24px;
  padding: 0;
  
  @include mobile-only {
    display: flex;
  }
  
  span {
    display: block;
    height: 2px;
    width: 100%;
    background: $secondary-color;
    border-radius: 1px;
    transition: $transition-all;
    transform-origin: center;
  }
  
  &.open {
    span:nth-child(1) {
      transform: rotate(45deg) translate(5px, 5px);
    }
    
    span:nth-child(2) {
      opacity: 0;
    }
    
    span:nth-child(3) {
      transform: rotate(-45deg) translate(7px, -6px);
    }
  }
  
  &:focus {
    outline: 2px solid $primary-color;
    outline-offset: 2px;
    border-radius: $border-radius-sm;
  }
}

// Overlay mobile
@include mobile-only {
  .main-nav.mobile-open::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    z-index: -1;
  }
}
</style>
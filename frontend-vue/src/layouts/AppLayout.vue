<template>
  <div class="app-layout">
    <!-- Navigation publique -->
    <AppHeader />
    
    <!-- Contenu principal -->
    <main class="main-content">
      <router-view />
    </main>
    
    <!-- Footer public -->
    <AppFooter />
  </div>
</template>

<script setup>
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
</script>

<style lang="scss" scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  min-height: 0; // Pour le flexbox
}
</style>
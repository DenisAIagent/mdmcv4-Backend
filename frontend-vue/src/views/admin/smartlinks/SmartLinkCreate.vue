<template>
  <div class="smartlink-create">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Créer un SmartLink</h1>
        <p class="page-description">
          Créez un nouveau SmartLink pour centraliser tous les liens de streaming d'un titre.
        </p>
      </div>
      
      <div class="header-actions">
        <router-link 
          to="/admin/smartlinks" 
          class="btn btn-secondary"
        >
          Annuler
        </router-link>
      </div>
    </div>
    
    <!-- Formulaire -->
    <div class="form-container">
      <SmartLinkForm
        :loading="loading"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useHead } from '@vueuse/head'
import { useToast } from 'vue-toastification'
import { useSmartLinksStore } from '@/stores/smartlinks'

import SmartLinkForm from '@/components/admin/smartlinks/SmartLinkForm.vue'

// ===== STORES =====
const smartLinksStore = useSmartLinksStore()
const router = useRouter()
const toast = useToast()

// ===== STATE =====
const loading = ref(false)

// ===== META =====
useHead({
  title: 'Créer un SmartLink - MDMC Admin',
  meta: [
    { name: 'description', content: 'Créer un nouveau SmartLink pour un artiste' }
  ]
})

// ===== MÉTHODES =====
const handleSubmit = async (formData) => {
  loading.value = true
  
  try {
    const smartlink = await smartLinksStore.createSmartLink(formData)
    
    // Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'smartlink_created', {
        event_category: 'Admin',
        artist_name: smartlink.artist?.name,
        track_title: smartlink.trackTitle
      })
    }
    
    toast.success('SmartLink créé avec succès!')
    
    // Rediriger vers la liste ou l'édition
    router.push({
      name: 'admin-smartlinks-edit',
      params: { id: smartlink._id }
    })
    
  } catch (error) {
    console.error('Erreur création SmartLink:', error)
    
    // Le toast d'erreur est géré par le store
    // On peut ajouter des actions spécifiques ici si nécessaire
    
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  router.push({ name: 'admin-smartlinks' })
}
</script>

<style lang="scss" scoped>
.smartlink-create {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: $spacing-2xl;
  
  @include mobile-only {
    flex-direction: column;
    gap: $spacing-lg;
  }
}

.header-content {
  flex: 1;
  
  .page-title {
    font-size: $font-size-3xl;
    font-weight: $font-weight-bold;
    color: $secondary-color;
    margin-bottom: $spacing-sm;
    
    @include mobile-only {
      font-size: $font-size-2xl;
    }
  }
  
  .page-description {
    font-size: $font-size-base;
    color: $gray;
    margin: 0;
    line-height: $line-height-relaxed;
  }
}

.header-actions {
  display: flex;
  gap: $spacing-base;
  flex-shrink: 0;
  
  @include mobile-only {
    width: 100%;
    justify-content: flex-end;
  }
}

.form-container {
  background: $white;
  border-radius: $border-radius-xl;
  box-shadow: $shadow-base;
  overflow: hidden;
}
</style>
<template>
  <form @submit.prevent="handleSubmit" class="smartlink-form">
    <!-- Section 1: Informations de base -->
    <div class="form-section">
      <h3 class="section-title">Informations du titre</h3>
      
      <!-- Artiste -->
      <div class="form-row">
        <div class="form-group">
          <label for="artist" class="form-label required">
            Artiste
          </label>
          <ArtistSelect
            v-model="form.artistId"
            :error="errors.artistId"
            @artist-selected="onArtistSelected"
          />
          <span v-if="errors.artistId" class="form-error">
            {{ errors.artistId }}
          </span>
        </div>
      </div>
      
      <!-- Titre et Slug -->
      <div class="form-row">
        <div class="form-group">
          <label for="trackTitle" class="form-label required">
            Titre du morceau
          </label>
          <input
            id="trackTitle"
            v-model="form.trackTitle"
            type="text"
            class="form-input"
            :class="{ 'error': errors.trackTitle }"
            placeholder="Ex: Bohemian Rhapsody"
            @input="generateSlug"
          />
          <span v-if="errors.trackTitle" class="form-error">
            {{ errors.trackTitle }}
          </span>
        </div>
        
        <div class="form-group">
          <label for="slug" class="form-label">
            Slug URL
          </label>
          <input
            id="slug"
            v-model="form.slug"
            type="text"
            class="form-input"
            :class="{ 'error': errors.slug }"
            placeholder="bohemian-rhapsody"
            @input="validateSlug"
          />
          <span v-if="errors.slug" class="form-error">
            {{ errors.slug }}
          </span>
          <div v-if="form.slug && selectedArtist" class="url-preview">
            <strong>URL finale:</strong> 
            {{ siteUrl }}/#/smartlinks/{{ selectedArtist.slug }}/{{ form.slug }}
          </div>
        </div>
      </div>
      
      <!-- Description -->
      <div class="form-row">
        <div class="form-group">
          <label for="description" class="form-label">
            Description
          </label>
          <textarea
            id="description"
            v-model="form.description"
            class="form-textarea"
            :class="{ 'error': errors.description }"
            placeholder="Description du titre (optionnel)"
            rows="3"
          ></textarea>
          <span v-if="errors.description" class="form-error">
            {{ errors.description }}
          </span>
        </div>
      </div>
      
      <!-- Date de sortie -->
      <div class="form-row">
        <div class="form-group">
          <label for="releaseDate" class="form-label">
            Date de sortie
          </label>
          <input
            id="releaseDate"
            v-model="form.releaseDate"
            type="date"
            class="form-input"
            :class="{ 'error': errors.releaseDate }"
          />
          <span v-if="errors.releaseDate" class="form-error">
            {{ errors.releaseDate }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- Section 2: Contenu média -->
    <div class="form-section">
      <h3 class="section-title">Contenu média</h3>
      
      <!-- Cover Image -->
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Image de couverture</label>
          <ImageUpload
            v-model="form.coverImageUrl"
            :current-image="form.coverImageUrl"
            accept="image/*"
            @upload-start="uploadingCover = true"
            @upload-complete="uploadingCover = false"
            @upload-error="uploadingCover = false"
          />
          <div class="form-help">
            Format recommandé: 1000x1000px, JPG ou PNG, max 2MB
          </div>
        </div>
      </div>
      
      <!-- Preview Audio -->
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Extrait audio (optionnel)</label>
          <AudioUpload
            v-model="form.previewAudioUrl"
            :current-audio="form.previewAudioUrl"
            accept="audio/*"
            @upload-start="uploadingAudio = true"
            @upload-complete="uploadingAudio = false"
            @upload-error="uploadingAudio = false"
          />
          <div class="form-help">
            MP3 recommandé, 30 secondes max, max 5MB
          </div>
        </div>
      </div>
    </div>
    
    <!-- Section 3: Liens des plateformes -->
    <div class="form-section">
      <h3 class="section-title">Liens des plateformes</h3>
      
      <!-- Outil d'import automatique -->
      <div class="import-tool">
        <h4>Import automatique</h4>
        <div class="import-input">
          <input
            v-model="importUrl"
            type="url"
            class="form-input"
            placeholder="Collez un lien Spotify, Apple Music, etc."
          />
          <button
            type="button"
            @click="importFromUrl"
            :disabled="!importUrl || importing"
            class="btn btn-primary"
          >
            {{ importing ? 'Import...' : 'Importer' }}
          </button>
        </div>
        <div class="form-help">
          Nous détecterons automatiquement les liens sur les autres plateformes
        </div>
      </div>
      
      <!-- Liste des liens manuels -->
      <div class="platforms-manual">
        <h4>Ou ajoutez manuellement</h4>
        
        <div
          v-for="(link, index) in form.platformLinks"
          :key="index"
          class="platform-link-row"
        >
          <div class="platform-select">
            <select
              v-model="link.platform"
              class="form-select"
              @change="onPlatformChange(index)"
            >
              <option value="">Choisir plateforme</option>
              <option
                v-for="platform in availablePlatforms"
                :key="platform.value"
                :value="platform.value"
              >
                {{ platform.label }}
              </option>
            </select>
          </div>
          
          <div class="platform-url">
            <input
              v-model="link.url"
              type="url"
              class="form-input"
              :placeholder="`URL ${link.platform || 'de la plateforme'}`"
            />
          </div>
          
          <button
            type="button"
            @click="removePlatformLink(index)"
            class="btn btn-ghost btn-sm remove-btn"
          >
            Supprimer
          </button>
        </div>
        
        <button
          type="button"
          @click="addPlatformLink"
          class="btn btn-outline btn-sm"
        >
          + Ajouter une plateforme
        </button>
      </div>
      
      <!-- Aperçu des liens -->
      <div v-if="form.platformLinks.length > 0" class="platforms-preview">
        <h4>Aperçu</h4>
        <div class="preview-list">
          <div
            v-for="(link, index) in validPlatformLinks"
            :key="index"
            class="preview-item"
          >
            <span class="platform-name">{{ getPlatformName(link.platform) }}</span>
            <a :href="link.url" target="_blank" class="platform-url">
              {{ truncateUrl(link.url) }}
            </a>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Section 4: Configuration -->
    <div class="form-section">
      <h3 class="section-title">Configuration</h3>
      
      <!-- Sous-titre personnalisé -->
      <div class="form-row">
        <div class="form-group">
          <label for="customSubtitle" class="form-label">
            Sous-titre personnalisé
          </label>
          <input
            id="customSubtitle"
            v-model="form.customSubtitle"
            type="text"
            class="form-input"
            placeholder="Ex: Choisir sa plateforme"
            maxlength="40"
          />
          <div class="form-help">
            {{ form.customSubtitle?.length || 0 }}/40 caractères
          </div>
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label class="checkbox-label">
            <input
              v-model="form.useDescriptionAsSubtitle"
              type="checkbox"
              class="form-checkbox"
            />
            Utiliser la description comme sous-titre
          </label>
        </div>
      </div>
      
      <!-- Statut de publication -->
      <div class="form-row">
        <div class="form-group">
          <label class="checkbox-label">
            <input
              v-model="form.isPublished"
              type="checkbox"
              class="form-checkbox"
            />
            Publier immédiatement
          </label>
          <div class="form-help">
            Un SmartLink publié sera accessible publiquement
          </div>
        </div>
      </div>
    </div>
    
    <!-- Section 5: Tracking (optionnel) -->
    <div class="form-section">
      <h3 class="section-title">Tracking avancé (optionnel)</h3>
      
      <div class="form-row grid-cols-2">
        <div class="form-group">
          <label for="ga4Id" class="form-label">
            Google Analytics 4 ID
          </label>
          <input
            id="ga4Id"
            v-model="form.trackingIds.ga4Id"
            type="text"
            class="form-input"
            placeholder="G-XXXXXXXXXX"
          />
        </div>
        
        <div class="form-group">
          <label for="gtmId" class="form-label">
            Google Tag Manager ID
          </label>
          <input
            id="gtmId"
            v-model="form.trackingIds.gtmId"
            type="text"
            class="form-input"
            placeholder="GTM-XXXXXXX"
          />
        </div>
      </div>
      
      <div class="form-row grid-cols-2">
        <div class="form-group">
          <label for="metaPixelId" class="form-label">
            Meta Pixel ID
          </label>
          <input
            id="metaPixelId"
            v-model="form.trackingIds.metaPixelId"
            type="text"
            class="form-input"
            placeholder="123456789012345"
          />
        </div>
        
        <div class="form-group">
          <label for="tiktokPixelId" class="form-label">
            TikTok Pixel ID
          </label>
          <input
            id="tiktokPixelId"
            v-model="form.trackingIds.tiktokPixelId"
            type="text"
            class="form-input"
            placeholder="C4XXXXXXXXXXXXXXXXXX"
          />
        </div>
      </div>
    </div>
    
    <!-- Actions du formulaire -->
    <div class="form-actions">
      <button
        type="button"
        @click="$emit('cancel')"
        class="btn btn-secondary"
        :disabled="loading"
      >
        Annuler
      </button>
      
      <div class="primary-actions">
        <button
          v-if="!isEditMode"
          type="button"
          @click="saveDraft"
          :disabled="loading || uploadingCover || uploadingAudio"
          class="btn btn-outline"
        >
          Sauvegarder en brouillon
        </button>
        
        <button
          type="submit"
          :disabled="loading || uploadingCover || uploadingAudio || !isFormValid"
          class="btn btn-primary"
        >
          {{ submitButtonText }}
        </button>
      </div>
    </div>
  </form>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useVeeValidate } from '@vueuse/integrations/useVeeValidate'
import slugify from 'slugify'
import { integrationsAPI } from '@/services/api'

import ArtistSelect from '@/components/admin/forms/ArtistSelect.vue'
import ImageUpload from '@/components/admin/forms/ImageUpload.vue'
import AudioUpload from '@/components/admin/forms/AudioUpload.vue'

// ===== PROPS =====
const props = defineProps({
  smartlink: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// ===== ÉMISSIONS =====
const emit = defineEmits(['submit', 'cancel'])

// ===== STATE =====
const form = reactive({
  artistId: '',
  trackTitle: '',
  slug: '',
  description: '',
  releaseDate: '',
  coverImageUrl: '',
  previewAudioUrl: '',
  customSubtitle: 'Choisir sa plateforme',
  useDescriptionAsSubtitle: false,
  platformLinks: [],
  isPublished: true,
  trackingIds: {
    ga4Id: '',
    gtmId: '',
    metaPixelId: '',
    tiktokPixelId: '',
    googleAdsId: ''
  }
})

const errors = ref({})
const selectedArtist = ref(null)
const importUrl = ref('')
const importing = ref(false)
const uploadingCover = ref(false)
const uploadingAudio = ref(false)

// ===== COMPUTED =====
const isEditMode = computed(() => !!props.smartlink)

const siteUrl = computed(() => {
  return process.env.VUE_APP_SITE_URL || window.location.origin
})

const availablePlatforms = computed(() => [
  { value: 'spotify', label: 'Spotify' },
  { value: 'apple', label: 'Apple Music' },
  { value: 'youtube', label: 'YouTube Music' },
  { value: 'deezer', label: 'Deezer' },
  { value: 'soundcloud', label: 'SoundCloud' },
  { value: 'bandcamp', label: 'Bandcamp' },
  { value: 'tidal', label: 'TIDAL' },
  { value: 'amazon', label: 'Amazon Music' },
  { value: 'napster', label: 'Napster' },
  { value: 'pandora', label: 'Pandora' }
])

const validPlatformLinks = computed(() => {
  return form.platformLinks.filter(link => link.platform && link.url)
})

const isFormValid = computed(() => {
  return form.artistId && 
         form.trackTitle && 
         form.slug && 
         validPlatformLinks.value.length > 0 &&
         Object.keys(errors.value).length === 0
})

const submitButtonText = computed(() => {
  if (loading.value) return 'Enregistrement...'
  if (isEditMode.value) return 'Mettre à jour'
  return form.isPublished ? 'Créer et publier' : 'Créer en brouillon'
})

// ===== MÉTHODES =====
const generateSlug = () => {
  if (form.trackTitle && !isEditMode.value) {
    form.slug = slugify(form.trackTitle, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@#%$^&={}|[\]\\;\/?]/g
    })
  }
}

const validateSlug = () => {
  if (form.slug) {
    const validSlug = slugify(form.slug, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@#%$^&={}|[\]\\;\/?]/g
    })
    
    if (form.slug !== validSlug) {
      form.slug = validSlug
    }
  }
}

const onArtistSelected = (artist) => {
  selectedArtist.value = artist
  form.artistId = artist._id
}

const addPlatformLink = () => {
  form.platformLinks.push({
    platform: '',
    url: ''
  })
}

const removePlatformLink = (index) => {
  form.platformLinks.splice(index, 1)
}

const onPlatformChange = (index) => {
  // Logique si nécessaire quand une plateforme est sélectionnée
}

const importFromUrl = async () => {
  if (!importUrl.value) return
  
  importing.value = true
  
  try {
    const response = await integrationsAPI.getOdesliData(importUrl.value)
    
    if (response.success && response.links) {
      // Mapper les liens Odesli vers notre format
      const newLinks = Object.entries(response.links).map(([platform, data]) => ({
        platform: mapOdesliPlatform(platform),
        url: data.url
      })).filter(link => link.platform)
      
      // Remplacer les liens existants ou les merger ?
      form.platformLinks = newLinks
      
      // Remplir automatiquement d'autres champs si disponibles
      if (response.metadata) {
        if (response.metadata.title && !form.trackTitle) {
          form.trackTitle = response.metadata.title
          generateSlug()
        }
        
        if (response.metadata.artist && !selectedArtist.value) {
          // Rechercher l'artiste ou proposer de le créer
        }
        
        if (response.metadata.thumbnail && !form.coverImageUrl) {
          form.coverImageUrl = response.metadata.thumbnail
        }
      }
      
      importUrl.value = ''
      
    } else {
      throw new Error('Impossible d\'importer depuis cette URL')
    }
    
  } catch (error) {
    console.error('Erreur import URL:', error)
    errors.value.import = error.message
  } finally {
    importing.value = false
  }
}

const mapOdesliPlatform = (odesliPlatform) => {
  const mapping = {
    'spotify': 'spotify',
    'itunes': 'apple',
    'appleMusic': 'apple',
    'youtube': 'youtube',
    'youtubeMusic': 'youtube',
    'deezer': 'deezer',
    'soundcloud': 'soundcloud',
    'bandcamp': 'bandcamp',
    'tidal': 'tidal',
    'amazon': 'amazon',
    'amazonMusic': 'amazon'
  }
  
  return mapping[odesliPlatform] || null
}

const getPlatformName = (platform) => {
  const platform_obj = availablePlatforms.value.find(p => p.value === platform)
  return platform_obj?.label || platform
}

const truncateUrl = (url) => {
  if (url.length > 40) {
    return url.substring(0, 37) + '...'
  }
  return url
}

const validateForm = () => {
  errors.value = {}
  
  if (!form.artistId) {
    errors.value.artistId = 'L\'artiste est requis'
  }
  
  if (!form.trackTitle) {
    errors.value.trackTitle = 'Le titre est requis'
  }
  
  if (!form.slug) {
    errors.value.slug = 'Le slug est requis'
  }
  
  if (form.description && form.description.length > 500) {
    errors.value.description = 'La description ne peut pas dépasser 500 caractères'
  }
  
  if (validPlatformLinks.value.length === 0) {
    errors.value.platformLinks = 'Au moins un lien de plateforme est requis'
  }
  
  if (form.customSubtitle && form.customSubtitle.length > 40) {
    errors.value.customSubtitle = 'Le sous-titre ne peut pas dépasser 40 caractères'
  }
  
  return Object.keys(errors.value).length === 0
}

const handleSubmit = () => {
  if (!validateForm()) return
  
  const formData = {
    ...form,
    platformLinks: validPlatformLinks.value
  }
  
  emit('submit', formData)
}

const saveDraft = () => {
  if (!validateForm()) return
  
  const formData = {
    ...form,
    isPublished: false,
    platformLinks: validPlatformLinks.value
  }
  
  emit('submit', formData)
}

const initializeForm = () => {
  if (props.smartlink) {
    // Pré-remplir le formulaire en mode édition
    Object.assign(form, {
      artistId: props.smartlink.artistId,
      trackTitle: props.smartlink.trackTitle,
      slug: props.smartlink.slug,
      description: props.smartlink.description || '',
      releaseDate: props.smartlink.releaseDate ? props.smartlink.releaseDate.split('T')[0] : '',
      coverImageUrl: props.smartlink.coverImageUrl || '',
      previewAudioUrl: props.smartlink.previewAudioUrl || '',
      customSubtitle: props.smartlink.customSubtitle || 'Choisir sa plateforme',
      useDescriptionAsSubtitle: props.smartlink.useDescriptionAsSubtitle || false,
      platformLinks: [...(props.smartlink.platformLinks || [])],
      isPublished: props.smartlink.isPublished,
      trackingIds: {
        ga4Id: props.smartlink.trackingIds?.ga4Id || '',
        gtmId: props.smartlink.trackingIds?.gtmId || '',
        metaPixelId: props.smartlink.trackingIds?.metaPixelId || '',
        tiktokPixelId: props.smartlink.trackingIds?.tiktokPixelId || '',
        googleAdsId: props.smartlink.trackingIds?.googleAdsId || ''
      }
    })
    
    selectedArtist.value = props.smartlink.artist
  } else {
    // Ajouter un lien de plateforme vide par défaut
    addPlatformLink()
  }
}

// ===== LIFECYCLE =====
onMounted(() => {
  initializeForm()
})

// ===== WATCHERS =====
watch(() => props.smartlink, () => {
  initializeForm()
}, { deep: true })
</script>

<style lang="scss" scoped>
.smartlink-form {
  padding: $spacing-xl;
}

.form-section {
  margin-bottom: $spacing-3xl;
  
  &:last-of-type {
    margin-bottom: $spacing-2xl;
  }
  
  .section-title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $secondary-color;
    margin-bottom: $spacing-lg;
    padding-bottom: $spacing-sm;
    border-bottom: 2px solid $light-gray;
  }
}

.form-row {
  display: grid;
  gap: $spacing-lg;
  margin-bottom: $spacing-lg;
  
  &.grid-cols-2 {
    grid-template-columns: 1fr 1fr;
    
    @include mobile-only {
      grid-template-columns: 1fr;
    }
  }
}

.url-preview {
  margin-top: $spacing-sm;
  padding: $spacing-sm;
  background: $light-gray;
  border-radius: $border-radius-base;
  font-size: $font-size-sm;
  word-break: break-all;
}

.import-tool {
  background: $light-gray;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  margin-bottom: $spacing-xl;
  
  h4 {
    margin-bottom: $spacing-base;
    font-size: $font-size-base;
    font-weight: $font-weight-medium;
  }
  
  .import-input {
    display: flex;
    gap: $spacing-base;
    margin-bottom: $spacing-sm;
    
    @include mobile-only {
      flex-direction: column;
    }
    
    .form-input {
      flex: 1;
    }
  }
}

.platforms-manual {
  h4 {
    margin-bottom: $spacing-lg;
    font-size: $font-size-base;
    font-weight: $font-weight-medium;
  }
}

.platform-link-row {
  display: grid;
  grid-template-columns: 200px 1fr auto;
  gap: $spacing-base;
  align-items: start;
  margin-bottom: $spacing-base;
  
  @include mobile-only {
    grid-template-columns: 1fr;
    gap: $spacing-sm;
  }
  
  .remove-btn {
    @include mobile-only {
      justify-self: end;
    }
  }
}

.platforms-preview {
  background: $light-gray;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  margin-top: $spacing-xl;
  
  h4 {
    margin-bottom: $spacing-base;
    font-size: $font-size-base;
    font-weight: $font-weight-medium;
  }
  
  .preview-list {
    display: grid;
    gap: $spacing-sm;
  }
  
  .preview-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-sm;
    background: $white;
    border-radius: $border-radius-base;
    
    .platform-name {
      font-weight: $font-weight-medium;
      color: $secondary-color;
    }
    
    .platform-url {
      color: $primary-color;
      font-size: $font-size-sm;
    }
  }
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  font-weight: $font-weight-normal;
  cursor: pointer;
  
  .form-checkbox {
    margin: 0;
  }
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: $spacing-xl;
  border-top: 1px solid #E2E8F0;
  
  @include mobile-only {
    flex-direction: column;
    gap: $spacing-base;
  }
  
  .primary-actions {
    display: flex;
    gap: $spacing-base;
    
    @include mobile-only {
      width: 100%;
      
      .btn {
        flex: 1;
      }
    }
  }
}

.required::after {
  content: ' *';
  color: $danger;
}
</style>
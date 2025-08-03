<template>
  <div class="smartlink-player">
    <!-- Cover et informations principales -->
    <div class="player-header">
      <div class="cover-container">
        <img 
          v-if="smartlink.coverImageUrl"
          :src="smartlink.coverImageUrl"
          :alt="`${smartlink.trackTitle} - ${smartlink.artist?.name}`"
          class="cover-image"
          @error="handleImageError"
        />
        <div v-else class="cover-placeholder">
          <div class="placeholder-icon">🎵</div>
        </div>
        
        <!-- Play button overlay si preview audio -->
        <button 
          v-if="smartlink.previewAudioUrl && !isPlaying"
          @click="togglePreview"
          class="play-overlay"
          aria-label="Écouter un extrait"
        >
          <span class="play-icon">▶</span>
        </button>
        
        <button 
          v-if="smartlink.previewAudioUrl && isPlaying"
          @click="togglePreview"
          class="play-overlay playing"
          aria-label="Pause"
        >
          <span class="pause-icon">⏸</span>
        </button>
      </div>
      
      <div class="track-info">
        <h1 class="track-title">{{ smartlink.trackTitle }}</h1>
        <h2 class="artist-name">{{ smartlink.artist?.name }}</h2>
        
        <!-- Sous-titre personnalisé -->
        <p v-if="displaySubtitle" class="subtitle">
          {{ displaySubtitle }}
        </p>
        
        <!-- Date de sortie -->
        <p v-if="smartlink.releaseDate" class="release-date">
          Sortie le {{ formatDate(smartlink.releaseDate) }}
        </p>
      </div>
    </div>
    
    <!-- Audio preview (hidden) -->
    <audio 
      v-if="smartlink.previewAudioUrl"
      ref="audioElement"
      :src="smartlink.previewAudioUrl"
      @ended="onPreviewEnded"
      @timeupdate="onTimeUpdate"
      preload="metadata"
    />
    
    <!-- Progress bar pour l'audio preview -->
    <div v-if="smartlink.previewAudioUrl && isPlaying" class="preview-progress">
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: `${progressPercent}%` }"
        ></div>
      </div>
      <div class="time-display">
        {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
      </div>
    </div>
    
    <!-- Liste des plateformes -->
    <div class="platforms-list">
      <h3 class="platforms-title">
        {{ displaySubtitle || 'Choisir sa plateforme' }}
      </h3>
      
      <div class="platforms-grid">
        <button
          v-for="link in platformLinks"
          :key="link.platform"
          @click="handlePlatformClick(link.platform, link.url)"
          class="platform-button"
          :class="`platform-${link.platform.toLowerCase()}`"
          :aria-label="`Écouter sur ${getPlatformDisplayName(link.platform)}`"
        >
          <div class="platform-icon">
            <img 
              :src="getPlatformIcon(link.platform)"
              :alt="getPlatformDisplayName(link.platform)"
              @error="handlePlatformIconError"
            />
          </div>
          <span class="platform-name">
            {{ getPlatformDisplayName(link.platform) }}
          </span>
        </button>
      </div>
    </div>
    
    <!-- Statistiques (si mode admin/preview) -->
    <div v-if="showStats" class="stats-display">
      <div class="stat-item">
        <span class="stat-value">{{ smartlink.viewCount || 0 }}</span>
        <span class="stat-label">vues</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ smartlink.platformClickCount || 0 }}</span>
        <span class="stat-label">clics</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ conversionRate }}%</span>
        <span class="stat-label">conversion</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// ===== PROPS =====
const props = defineProps({
  smartlink: {
    type: Object,
    required: true
  },
  showStats: {
    type: Boolean,
    default: false
  }
})

// ===== ÉMISSIONS =====
const emit = defineEmits(['platform-click'])

// ===== STATE =====
const audioElement = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const progressPercent = ref(0)

// ===== COMPUTED =====
const platformLinks = computed(() => {
  return props.smartlink.platformLinks || []
})

const displaySubtitle = computed(() => {
  if (props.smartlink.useDescriptionAsSubtitle && props.smartlink.description) {
    return props.smartlink.description
  }
  return props.smartlink.customSubtitle || 'Choisir sa plateforme'
})

const conversionRate = computed(() => {
  const views = props.smartlink.viewCount || 0
  const clicks = props.smartlink.platformClickCount || 0
  
  if (views === 0) return 0
  return ((clicks / views) * 100).toFixed(1)
})

// ===== MÉTHODES =====
const handlePlatformClick = (platform, url) => {
  emit('platform-click', platform, url)
}

const togglePreview = () => {
  if (!audioElement.value) return
  
  if (isPlaying.value) {
    audioElement.value.pause()
    isPlaying.value = false
  } else {
    audioElement.value.play()
    isPlaying.value = true
  }
}

const onPreviewEnded = () => {
  isPlaying.value = false
  currentTime.value = 0
  progressPercent.value = 0
}

const onTimeUpdate = () => {
  if (!audioElement.value) return
  
  currentTime.value = audioElement.value.currentTime
  duration.value = audioElement.value.duration || 0
  
  if (duration.value > 0) {
    progressPercent.value = (currentTime.value / duration.value) * 100
  }
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

const getPlatformDisplayName = (platform) => {
  const platformNames = {
    spotify: 'Spotify',
    apple: 'Apple Music',
    applemusic: 'Apple Music',
    youtube: 'YouTube Music',
    youtubemusic: 'YouTube Music',
    deezer: 'Deezer',
    soundcloud: 'SoundCloud',
    bandcamp: 'Bandcamp',
    tidal: 'TIDAL',
    amazon: 'Amazon Music',
    amazonmusic: 'Amazon Music',
    napster: 'Napster',
    pandora: 'Pandora',
    itunes: 'iTunes',
    google: 'Google Play',
    googleplay: 'Google Play'
  }
  
  return platformNames[platform.toLowerCase()] || platform
}

const getPlatformIcon = (platform) => {
  // En production, ces icônes seraient servies depuis un CDN ou dossier assets
  const icons = {
    spotify: '/assets/icons/platforms/spotify.svg',
    apple: '/assets/icons/platforms/apple-music.svg',
    applemusic: '/assets/icons/platforms/apple-music.svg',
    youtube: '/assets/icons/platforms/youtube-music.svg',
    youtubemusic: '/assets/icons/platforms/youtube-music.svg',
    deezer: '/assets/icons/platforms/deezer.svg',
    soundcloud: '/assets/icons/platforms/soundcloud.svg',
    bandcamp: '/assets/icons/platforms/bandcamp.svg',
    tidal: '/assets/icons/platforms/tidal.svg',
    amazon: '/assets/icons/platforms/amazon-music.svg',
    amazonmusic: '/assets/icons/platforms/amazon-music.svg'
  }
  
  return icons[platform.toLowerCase()] || '/assets/icons/platforms/default.svg'
}

const handleImageError = (event) => {
  console.log('Erreur chargement image cover:', event)
  // On pourrait afficher un placeholder ou une image par défaut
}

const handlePlatformIconError = (event) => {
  console.log('Erreur chargement icône plateforme:', event)
  // Selon les spécifications CLAUDE.md, on ne doit PAS créer de fallback
  // On masque simplement l'icône défaillante
  event.target.style.display = 'none'
}

// ===== LIFECYCLE =====
onMounted(() => {
  // Précharger l'audio si disponible
  if (props.smartlink.previewAudioUrl && audioElement.value) {
    audioElement.value.load()
  }
})

onUnmounted(() => {
  // Nettoyer l'audio si en cours
  if (audioElement.value && isPlaying.value) {
    audioElement.value.pause()
  }
})
</script>

<style lang="scss" scoped>
.smartlink-player {
  background: $white;
  border-radius: $smartlink-border-radius;
  box-shadow: $smartlink-shadow;
  overflow: hidden;
  transition: $transition-all;
  
  &:hover {
    box-shadow: $shadow-xl;
  }
}

.player-header {
  padding: $spacing-xl;
  text-align: center;
}

.cover-container {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto $spacing-lg;
  border-radius: $border-radius-xl;
  overflow: hidden;
  box-shadow: $shadow-lg;
  
  @include mobile-only {
    width: 160px;
    height: 160px;
  }
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: $transition-transform;
  
  .cover-container:hover & {
    transform: scale(1.05);
  }
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background: $gradient-primary;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .placeholder-icon {
    font-size: $font-size-5xl;
    color: $white;
  }
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: rgba($white, 0.95);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: $transition-all;
  box-shadow: $shadow-lg;
  
  &:hover {
    background: $white;
    transform: translate(-50%, -50%) scale(1.1);
  }
  
  &.playing {
    background: rgba($primary-color, 0.95);
    color: $white;
    
    &:hover {
      background: $primary-color;
    }
  }
  
  .play-icon,
  .pause-icon {
    font-size: $font-size-lg;
    margin-left: 2px; // Centrage optique pour le triangle
  }
  
  .pause-icon {
    margin-left: 0;
  }
}

.track-info {
  .track-title {
    font-family: $font-primary;
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: $secondary-color;
    margin-bottom: $spacing-sm;
    line-height: $line-height-tight;
    
    @include mobile-only {
      font-size: $font-size-xl;
    }
  }
  
  .artist-name {
    font-family: $font-primary;
    font-size: $font-size-lg;
    font-weight: $font-weight-medium;
    color: $primary-color;
    margin-bottom: $spacing-base;
    
    @include mobile-only {
      font-size: $font-size-base;
    }
  }
  
  .subtitle {
    font-size: $font-size-base;
    color: $gray;
    margin-bottom: $spacing-sm;
    font-style: italic;
  }
  
  .release-date {
    font-size: $font-size-sm;
    color: $gray;
    margin-bottom: 0;
  }
}

.preview-progress {
  padding: 0 $spacing-xl $spacing-lg;
  
  .progress-bar {
    width: 100%;
    height: 4px;
    background: #E2E8F0;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: $spacing-sm;
    
    .progress-fill {
      height: 100%;
      background: $primary-color;
      transition: width 0.1s ease;
    }
  }
  
  .time-display {
    text-align: center;
    font-size: $font-size-xs;
    color: $gray;
  }
}

.platforms-list {
  padding: 0 $spacing-xl $spacing-xl;
  
  .platforms-title {
    font-size: $font-size-base;
    font-weight: $font-weight-medium;
    color: $secondary-color;
    text-align: center;
    margin-bottom: $spacing-lg;
  }
}

.platforms-grid {
  display: grid;
  gap: $spacing-sm;
  grid-template-columns: 1fr;
}

.platform-button {
  display: flex;
  align-items: center;
  padding: $spacing-sm $spacing-base;
  background: $light-gray;
  border: 2px solid transparent;
  border-radius: $platform-button-border-radius;
  cursor: pointer;
  transition: $transition-all;
  text-decoration: none;
  color: $secondary-color;
  font-weight: $font-weight-medium;
  min-height: $platform-button-height;
  
  &:hover {
    background: $white;
    border-color: $primary-color;
    transform: translateY(-2px);
    box-shadow: $platform-button-shadow;
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:focus {
    outline: none;
    border-color: $primary-color;
    box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
  }
  
  .platform-icon {
    width: 24px;
    height: 24px;
    margin-right: $spacing-base;
    flex-shrink: 0;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
  
  .platform-name {
    flex: 1;
    text-align: left;
  }
  
  // Couleurs spécifiques aux plateformes
  &.platform-spotify:hover {
    border-color: $spotify-color;
  }
  
  &.platform-apple:hover,
  &.platform-applemusic:hover {
    border-color: $apple-music-color;
  }
  
  &.platform-youtube:hover,
  &.platform-youtubemusic:hover {
    border-color: $youtube-music-color;
  }
  
  &.platform-deezer:hover {
    border-color: $deezer-color;
  }
  
  &.platform-soundcloud:hover {
    border-color: $soundcloud-color;
  }
  
  &.platform-bandcamp:hover {
    border-color: $bandcamp-color;
  }
  
  &.platform-tidal:hover {
    border-color: $tidal-color;
  }
  
  &.platform-amazon:hover,
  &.platform-amazonmusic:hover {
    border-color: $amazon-music-color;
  }
}

.stats-display {
  display: flex;
  justify-content: space-around;
  padding: $spacing-base $spacing-xl;
  border-top: 1px solid #E2E8F0;
  background: $light-gray;
  
  .stat-item {
    text-align: center;
    
    .stat-value {
      display: block;
      font-size: $font-size-lg;
      font-weight: $font-weight-bold;
      color: $primary-color;
    }
    
    .stat-label {
      font-size: $font-size-xs;
      color: $gray;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }
}

// Responsive
@include mobile-only {
  .smartlink-player {
    margin: 0 -#{$spacing-base};
    border-radius: 0;
  }
  
  .player-header,
  .platforms-list {
    padding-left: $spacing-base;
    padding-right: $spacing-base;
  }
  
  .preview-progress {
    padding-left: $spacing-base;
    padding-right: $spacing-base;
  }
}
</style>
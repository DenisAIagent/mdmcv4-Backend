<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">
            SmartLinks MDMC
          </h1>
          <p class="hero-subtitle">
            Créez des liens intelligents pour vos sorties musicales. 
            Centralisez tous vos liens de streaming en un seul endroit.
          </p>
          
          <div class="hero-actions">
            <router-link to="/admin" class="btn btn-primary btn-lg">
              Accéder à l'Admin
            </router-link>
            <a href="https://www.mdmcmusicads.com/contact" class="btn btn-outline btn-lg">
              Nous contacter
            </a>
          </div>
        </div>
        
        <div class="hero-visual">
          <div class="smartlink-mockup">
            <div class="mockup-device">
              <div class="mockup-screen">
                <div class="mockup-header">
                  <div class="mockup-cover"></div>
                  <div class="mockup-info">
                    <div class="mockup-title"></div>
                    <div class="mockup-artist"></div>
                  </div>
                </div>
                <div class="mockup-platforms">
                  <div class="mockup-platform spotify"></div>
                  <div class="mockup-platform apple"></div>
                  <div class="mockup-platform youtube"></div>
                  <div class="mockup-platform deezer"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Features Section -->
    <section class="features-section">
      <div class="container">
        <div class="section-header">
          <h2>Pourquoi utiliser nos SmartLinks ?</h2>
          <p>Une solution complète pour optimiser vos campagnes musicales</p>
        </div>
        
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <h3>Conversion optimisée</h3>
            <p>
              Dirigez vos fans vers leur plateforme préférée avec un taux de conversion 
              supérieur aux liens traditionnels.
            </p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
              </svg>
            </div>
            <h3>Analytics détaillées</h3>
            <p>
              Suivez les performances de vos liens avec des statistiques complètes 
              et des insights sur votre audience.
            </p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
            <h3>SEO optimisé</h3>
            <p>
              Métadonnées Open Graph automatiques pour un partage parfait 
              sur tous les réseaux sociaux.
            </p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
            </div>
            <h3>Gestion simplifiée</h3>
            <p>
              Interface admin intuitive pour créer, modifier et gérer 
              tous vos SmartLinks en quelques clics.
            </p>
          </div>
        </div>
      </div>
    </section>
    
    <!-- CTA Section -->
    <section class="cta-section">
      <div class="container">
        <div class="cta-content">
          <h2>Prêt à optimiser vos campagnes musicales ?</h2>
          <p>
            Rejoignez les artistes et labels qui font confiance à MDMC 
            pour maximiser leur impact digital.
          </p>
          
          <div class="cta-actions">
            <router-link to="/admin" class="btn btn-primary btn-lg">
              Commencer maintenant
            </router-link>
            <a href="https://www.mdmcmusicads.com/demo" class="btn btn-outline btn-lg">
              Voir une démo
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useHead } from '@vueuse/head'

// ===== META =====
useHead({
  title: 'MDMC SmartLinks - Marketing Musical qui Convertit',
  meta: [
    { 
      name: 'description', 
      content: 'Créez des liens intelligents pour vos sorties musicales. Centralisez tous vos liens de streaming et maximisez vos conversions avec MDMC SmartLinks.' 
    },
    { 
      name: 'keywords', 
      content: 'smartlinks, musique, streaming, marketing musical, MDMC, artistes, labels, conversion, analytics' 
    },
    
    // Open Graph
    { property: 'og:title', content: 'MDMC SmartLinks - Marketing Musical qui Convertit' },
    { property: 'og:description', content: 'Créez des liens intelligents pour vos sorties musicales. Centralisez tous vos liens de streaming et maximisez vos conversions.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: 'https://www.mdmcmusicads.com/assets/images/og-smartlinks.jpg' },
    
    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'MDMC SmartLinks - Marketing Musical qui Convertit' },
    { name: 'twitter:description', content: 'Créez des liens intelligents pour vos sorties musicales.' }
  ]
})
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
}

// ===== HERO SECTION =====
.hero-section {
  background: $gradient-hero;
  padding: $spacing-4xl 0;
  min-height: 80vh;
  display: flex;
  align-items: center;
  
  @include mobile-only {
    padding: $spacing-3xl 0;
    min-height: 70vh;
  }
  
  .container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $spacing-4xl;
    align-items: center;
    
    @include mobile-only {
      grid-template-columns: 1fr;
      gap: $spacing-2xl;
      text-align: center;
    }
  }
}

.hero-content {
  .hero-title {
    font-size: clamp($font-size-3xl, 5vw, $font-size-5xl);
    font-weight: $font-weight-bold;
    color: $secondary-color;
    margin-bottom: $spacing-lg;
    line-height: $line-height-tight;
  }
  
  .hero-subtitle {
    font-size: $font-size-xl;
    color: $gray;
    margin-bottom: $spacing-2xl;
    line-height: $line-height-relaxed;
    
    @include mobile-only {
      font-size: $font-size-lg;
    }
  }
  
  .hero-actions {
    display: flex;
    gap: $spacing-lg;
    
    @include mobile-only {
      flex-direction: column;
      align-items: center;
    }
  }
}

.hero-visual {
  display: flex;
  justify-content: center;
  align-items: center;
}

.smartlink-mockup {
  .mockup-device {
    width: 300px;
    height: 500px;
    background: $white;
    border-radius: $border-radius-2xl;
    box-shadow: $shadow-2xl;
    padding: $spacing-lg;
    position: relative;
    
    @include mobile-only {
      width: 250px;
      height: 420px;
      padding: $spacing-base;
    }
    
    &::before {
      content: '';
      position: absolute;
      top: $spacing-base;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 4px;
      background: #E2E8F0;
      border-radius: 2px;
    }
  }
  
  .mockup-screen {
    width: 100%;
    height: 100%;
    margin-top: $spacing-lg;
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
  }
  
  .mockup-header {
    display: flex;
    gap: $spacing-base;
    align-items: center;
    
    .mockup-cover {
      width: 80px;
      height: 80px;
      background: $gradient-primary;
      border-radius: $border-radius-lg;
      flex-shrink: 0;
    }
    
    .mockup-info {
      flex: 1;
      
      .mockup-title {
        height: 16px;
        background: #E2E8F0;
        border-radius: 8px;
        margin-bottom: $spacing-sm;
      }
      
      .mockup-artist {
        height: 12px;
        background: rgba($primary-color, 0.3);
        border-radius: 6px;
        width: 70%;
      }
    }
  }
  
  .mockup-platforms {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    
    .mockup-platform {
      height: 48px;
      border-radius: $border-radius-lg;
      position: relative;
      
      &::before {
        content: '';
        position: absolute;
        left: $spacing-base;
        top: 50%;
        transform: translateY(-50%);
        width: 24px;
        height: 24px;
        border-radius: 4px;
        background: $white;
      }
      
      &::after {
        content: '';
        position: absolute;
        left: 60px;
        top: 50%;
        transform: translateY(-50%);
        height: 12px;
        border-radius: 6px;
        background: rgba($white, 0.8);
      }
      
      &.spotify {
        background: $spotify-color;
        &::after { width: 60px; }
      }
      
      &.apple {
        background: $apple-music-color;
        &::after { width: 80px; }
      }
      
      &.youtube {
        background: $youtube-music-color;
        &::after { width: 90px; }
      }
      
      &.deezer {
        background: $deezer-color;
        &::after { width: 50px; }
      }
    }
  }
}

// ===== FEATURES SECTION =====
.features-section {
  padding: $spacing-4xl 0;
  background: $white;
  
  @include mobile-only {
    padding: $spacing-3xl 0;
  }
}

.section-header {
  text-align: center;
  margin-bottom: $spacing-3xl;
  
  h2 {
    font-size: $font-size-3xl;
    font-weight: $font-weight-bold;
    color: $secondary-color;
    margin-bottom: $spacing-base;
    
    @include mobile-only {
      font-size: $font-size-2xl;
    }
  }
  
  p {
    font-size: $font-size-lg;
    color: $gray;
    margin: 0;
  }
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: $spacing-2xl;
  
  @include mobile-only {
    grid-template-columns: 1fr;
    gap: $spacing-xl;
  }
}

.feature-card {
  text-align: center;
  padding: $spacing-xl;
  border-radius: $border-radius-xl;
  background: $light-gray;
  transition: $transition-all;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: $shadow-lg;
    background: $white;
  }
  
  .feature-icon {
    width: 72px;
    height: 72px;
    background: $gradient-primary;
    color: $white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto $spacing-lg;
    
    svg {
      width: 32px;
      height: 32px;
      stroke-width: 1.5;
    }
  }
  
  h3 {
    font-size: $font-size-xl;
    font-weight: $font-weight-semibold;
    color: $secondary-color;
    margin-bottom: $spacing-base;
  }
  
  p {
    color: $gray;
    line-height: $line-height-relaxed;
    margin: 0;
  }
}

// ===== CTA SECTION =====
.cta-section {
  background: $secondary-color;
  color: $white;
  padding: $spacing-4xl 0;
  
  @include mobile-only {
    padding: $spacing-3xl 0;
  }
}

.cta-content {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
  
  h2 {
    font-size: $font-size-3xl;
    font-weight: $font-weight-bold;
    margin-bottom: $spacing-lg;
    
    @include mobile-only {
      font-size: $font-size-2xl;
    }
  }
  
  p {
    font-size: $font-size-lg;
    color: rgba($white, 0.9);
    margin-bottom: $spacing-2xl;
    line-height: $line-height-relaxed;
  }
  
  .cta-actions {
    display: flex;
    gap: $spacing-lg;
    justify-content: center;
    
    @include mobile-only {
      flex-direction: column;
      align-items: center;
    }
  }
}
</style>
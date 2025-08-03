<template>
  <footer class="app-footer">
    <div class="container">
      <div class="footer-content">
        <!-- Section principale -->
        <div class="footer-main">
          <div class="footer-brand">
            <img 
              src="/assets/images/logo-mdmc-white.svg" 
              alt="MDMC Music Ads" 
              class="footer-logo"
            />
            <p class="brand-tagline">
              Marketing musical qui convertit
            </p>
          </div>
          
          <div class="footer-links">
            <div class="links-column">
              <h4>Services</h4>
              <ul>
                <li><a href="https://www.mdmcmusicads.com/services/youtube-ads">YouTube Ads</a></li>
                <li><a href="https://www.mdmcmusicads.com/services/meta-ads">Meta Ads</a></li>
                <li><a href="https://www.mdmcmusicads.com/services/tiktok-ads">TikTok Promotion</a></li>
                <li><a href="https://www.mdmcmusicads.com/services/smartlinks">SmartLinks</a></li>
              </ul>
            </div>
            
            <div class="links-column">
              <h4>Ressources</h4>
              <ul>
                <li><a href="https://www.mdmcmusicads.com/blog">Blog</a></li>
                <li><a href="https://www.mdmcmusicads.com/guides">Guides</a></li>
                <li><a href="https://www.mdmcmusicads.com/case-studies">Études de cas</a></li>
                <li><a href="https://www.mdmcmusicads.com/analytics">Analytics</a></li>
              </ul>
            </div>
            
            <div class="links-column">
              <h4>Support</h4>
              <ul>
                <li><a href="https://www.mdmcmusicads.com/contact">Contact</a></li>
                <li><a href="https://www.mdmcmusicads.com/faq">FAQ</a></li>
                <li><a href="https://www.mdmcmusicads.com/help">Centre d'aide</a></li>
                <li><router-link to="/admin">Admin</router-link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <!-- Séparateur -->
        <div class="footer-separator"></div>
        
        <!-- Section légale -->
        <div class="footer-legal">
          <div class="legal-links">
            <a href="https://www.mdmcmusicads.com/legal/privacy">Confidentialité</a>
            <a href="https://www.mdmcmusicads.com/legal/terms">CGU</a>
            <a href="https://www.mdmcmusicads.com/legal/cookies">Cookies</a>
            <a href="https://www.mdmcmusicads.com/contact/media">Presse</a>
          </div>
          
          <div class="social-links">
            <a 
              href="https://twitter.com/MDMCMusicAds" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Suivez-nous sur Twitter"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </a>
            
            <a 
              href="https://www.linkedin.com/company/mdmc-music-ads" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Suivez-nous sur LinkedIn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            
            <a 
              href="https://www.instagram.com/mdmcmusicads" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Suivez-nous sur Instagram"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            
            <a 
              href="https://www.youtube.com/@MDMCMusicAds" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Suivez-nous sur YouTube"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
          
          <div class="copyright">
            <p>&copy; {{ currentYear }} MDMC Music Ads. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'

// ===== COMPUTED =====
const currentYear = computed(() => new Date().getFullYear())
</script>

<style lang="scss" scoped>
.app-footer {
  background: $secondary-color;
  color: rgba($white, 0.9);
  margin-top: auto;
  
  .container {
    padding: $spacing-3xl $spacing-lg $spacing-2xl;
    
    @include mobile-only {
      padding: $spacing-2xl $spacing-base $spacing-xl;
    }
  }
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
}

.footer-main {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: $spacing-3xl;
  margin-bottom: $spacing-2xl;
  
  @include mobile-only {
    grid-template-columns: 1fr;
    gap: $spacing-2xl;
    text-align: center;
  }
}

.footer-brand {
  .footer-logo {
    height: 48px;
    width: auto;
    margin-bottom: $spacing-base;
    
    @include mobile-only {
      height: 40px;
    }
  }
  
  .brand-tagline {
    font-size: $font-size-lg;
    font-weight: $font-weight-medium;
    color: $primary-color;
    margin: 0;
  }
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-xl;
  
  @include mobile-only {
    grid-template-columns: 1fr;
    gap: $spacing-lg;
  }
  
  .links-column {
    h4 {
      font-family: $font-primary;
      font-size: $font-size-base;
      font-weight: $font-weight-semibold;
      color: $white;
      margin-bottom: $spacing-base;
    }
    
    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      
      li {
        margin-bottom: $spacing-sm;
        
        a {
          color: rgba($white, 0.8);
          text-decoration: none;
          font-size: $font-size-sm;
          transition: $transition-colors;
          
          &:hover {
            color: $primary-color;
            text-decoration: underline;
          }
          
          &:focus {
            outline: 2px solid $primary-color;
            outline-offset: 2px;
            border-radius: $border-radius-sm;
          }
        }
      }
    }
  }
}

.footer-separator {
  height: 1px;
  background: rgba($white, 0.2);
  margin: $spacing-2xl 0;
}

.footer-legal {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: $spacing-xl;
  
  @include mobile-only {
    grid-template-columns: 1fr;
    gap: $spacing-base;
    text-align: center;
  }
  
  .legal-links {
    display: flex;
    gap: $spacing-lg;
    
    @include mobile-only {
      justify-content: center;
      flex-wrap: wrap;
      gap: $spacing-base;
    }
    
    a {
      color: rgba($white, 0.7);
      text-decoration: none;
      font-size: $font-size-xs;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: $transition-colors;
      
      &:hover {
        color: $white;
        text-decoration: underline;
      }
      
      &:focus {
        outline: 2px solid $primary-color;
        outline-offset: 2px;
        border-radius: $border-radius-sm;
      }
    }
  }
  
  .social-links {
    display: flex;
    gap: $spacing-base;
    justify-content: center;
    
    a {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: rgba($white, 0.1);
      color: rgba($white, 0.8);
      border-radius: 50%;
      transition: $transition-all;
      
      &:hover {
        background: $primary-color;
        color: $white;
        transform: translateY(-2px);
      }
      
      &:focus {
        outline: 2px solid $primary-color;
        outline-offset: 2px;
      }
      
      svg {
        width: 20px;
        height: 20px;
      }
    }
  }
  
  .copyright {
    text-align: right;
    
    @include mobile-only {
      text-align: center;
    }
    
    p {
      margin: 0;
      font-size: $font-size-xs;
      color: rgba($white, 0.6);
    }
  }
}
</style>
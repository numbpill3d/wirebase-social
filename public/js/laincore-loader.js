/**
 * Laincore Loading Screen
 * Creates an interstitial loading scene with Lain-inspired visuals
 */

class LaincoreLoader {
  constructor() {
    this.loadingElement = null;
    this.hallwayImage = '/images/lain-hallway.jpg'; // This should be a low-res hallway loop image
    this.messages = [
      'Connecting to wired',
      'Protocol synchronizing',
      'Layer boundaries dissolving',
      'Reality interface degrading',
      'Identity verification pending',
      'Signal locked',
      'Consciousness drift detected',
      'Memory fragments loading'
    ];
  }

  showLoading() {
    // Create loading screen element
    const loadingScreen = document.createElement('div');
    loadingScreen.className = 'laincore-loading-screen';
    
    // Create inner elements
    loadingScreen.innerHTML = `
      <div class="hallway-background"></div>
      <div class="scan-lines"></div>
      <div class="vignette"></div>
      <div class="loading-text"></div>
      <div class="loading-glitch"></div>
    `;
    
    // Set styles
    loadingScreen.style.position = 'fixed';
    loadingScreen.style.top = '0';
    loadingScreen.style.left = '0';
    loadingScreen.style.width = '100%';
    loadingScreen.style.height = '100%';
    loadingScreen.style.backgroundColor = '#000';
    loadingScreen.style.zIndex = '10000';
    loadingScreen.style.display = 'flex';
    loadingScreen.style.justifyContent = 'center';
    loadingScreen.style.alignItems = 'center';
    loadingScreen.style.transition = 'opacity 1s ease';
    
    // Setup hallway background
    const hallway = loadingScreen.querySelector('.hallway-background');
    hallway.style.position = 'absolute';
    hallway.style.top = '0';
    hallway.style.left = '0';
    hallway.style.width = '100%';
    hallway.style.height = '100%';
    hallway.style.backgroundImage = `url(${this.hallwayImage})`;
    hallway.style.backgroundSize = 'cover';
    hallway.style.backgroundPosition = 'center';
    hallway.style.opacity = '0.2';
    hallway.style.filter = 'blur(2px) grayscale(0.5)';
    
    // Setup scan lines
    const scanLines = loadingScreen.querySelector('.scan-lines');
    scanLines.style.position = 'absolute';
    scanLines.style.top = '0';
    scanLines.style.left = '0';
    scanLines.style.width = '100%';
    scanLines.style.height = '100%';
    scanLines.style.background = 'repeating-linear-gradient(0deg, rgba(0, 20, 0, 0.1), rgba(0, 20, 0, 0.1) 1px, transparent 1px, transparent 2px)';
    scanLines.style.zIndex = '1';
    scanLines.style.pointerEvents = 'none';
    scanLines.style.animation = 'scanMove 8s linear infinite';
    
    // Setup vignette
    const vignette = loadingScreen.querySelector('.vignette');
    vignette.style.position = 'absolute';
    vignette.style.top = '0';
    vignette.style.left = '0';
    vignette.style.width = '100%';
    vignette.style.height = '100%';
    vignette.style.background = 'radial-gradient(circle at center, transparent 40%, rgba(0, 0, 0, 0.4) 80%, rgba(0, 0, 0, 0.8) 100%)';
    vignette.style.zIndex = '2';
    vignette.style.pointerEvents = 'none';
    
    // Setup loading text
    const loadingText = loadingScreen.querySelector('.loading-text');
    loadingText.style.fontFamily = '"Syne Mono", monospace';
    loadingText.style.color = '#00ff00';
    loadingText.style.fontSize = '16px';
    loadingText.style.position = 'relative';
    loadingText.style.textTransform = 'lowercase';
    loadingText.style.letterSpacing = '2px';
    loadingText.style.zIndex = '3';
    loadingText.style.textShadow = '0 0 5px rgba(0, 255, 0, 0.5)';
    
    // Glitch element
    const glitch = loadingScreen.querySelector('.loading-glitch');
    glitch.style.position = 'absolute';
    glitch.style.top = '0';
    glitch.style.left = '0';
    glitch.style.width = '100%';
    glitch.style.height = '100%';
    glitch.style.backgroundSize = '100% 100%';
    glitch.style.backgroundPosition = 'center';
    glitch.style.opacity = '0';
    glitch.style.zIndex = '4';
    glitch.style.pointerEvents = 'none';
    
    // Add to body
    document.body.appendChild(loadingScreen);
    this.loadingElement = loadingScreen;
    
    // Start animation
    this.animateLoading();
    
    // Add keyframes for scan line animation if not already added
    if (!document.querySelector('#laincore-keyframes')) {
      const style = document.createElement('style');
      style.id = 'laincore-keyframes';
      style.textContent = `
        @keyframes scanMove {
          0% { transform: translateY(0); }
          100% { transform: translateY(20px); }
        }
        
        @keyframes textFlicker {
          0%, 100% { opacity: 1; }
          92% { opacity: 1; }
          92.5% { opacity: 0.2; }
          93% { opacity: 1; }
          93.5% { opacity: 0.2; }
          94% { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    return loadingScreen;
  }
  
  animateLoading() {
    if (!this.loadingElement) return;
    
    const loadingText = this.loadingElement.querySelector('.loading-text');
    const glitch = this.loadingElement.querySelector('.loading-glitch');
    
    // Cycle through messages
    let currentMessageIndex = 0;
    let charIndex = 0;
    let currentText = '';
    
    const typeNextChar = () => {
      if (!this.loadingElement || !document.body.contains(this.loadingElement)) return;
      
      if (charIndex < this.messages[currentMessageIndex].length) {
        currentText += this.messages[currentMessageIndex].charAt(charIndex);
        loadingText.textContent = currentText + '_';
        charIndex++;
        setTimeout(typeNextChar, 100 + Math.random() * 50);
      } else {
        // Message complete, wait and show next message
        setTimeout(() => {
          if (!this.loadingElement || !document.body.contains(this.loadingElement)) return;
          
          charIndex = 0;
          currentText = '';
          currentMessageIndex = (currentMessageIndex + 1) % this.messages.length;
          typeNextChar();
        }, 2000);
      }
    };
    
    // Start typing animation
    typeNextChar();
    
    // Add random glitch effects
    const randomGlitch = () => {
      if (!this.loadingElement || !document.body.contains(this.loadingElement)) return;
      
      // Random chance to show a glitch
      if (Math.random() < 0.2) {
        // Apply random glitch effect
        const glitchType = Math.floor(Math.random() * 3);
        
        switch (glitchType) {
          case 0: // Text distortion
            loadingText.style.letterSpacing = `${Math.random() * 4}px`;
            loadingText.style.filter = `blur(${Math.random() * 2}px)`;
            break;
            
          case 1: // Screen shake
            this.loadingElement.style.transform = `translateX(${Math.random() * 10 - 5}px) translateY(${Math.random() * 10 - 5}px)`;
            break;
            
          case 2: // Flash glitch overlay
            glitch.style.opacity = '0.3';
            glitch.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
            break;
        }
        
        // Reset after a short delay
        setTimeout(() => {
          if (!this.loadingElement || !document.body.contains(this.loadingElement)) return;
          
          loadingText.style.letterSpacing = '2px';
          loadingText.style.filter = 'none';
          this.loadingElement.style.transform = 'none';
          glitch.style.opacity = '0';
        }, 200);
      }
      
      // Schedule next glitch
      setTimeout(randomGlitch, 1000 + Math.random() * 3000);
    };
    
    // Start glitch animation
    randomGlitch();
  }
  
  hideLoading() {
    if (this.loadingElement) {
      // Fade out and remove
      this.loadingElement.style.opacity = '0';
      
      setTimeout(() => {
        if (this.loadingElement && document.body.contains(this.loadingElement)) {
          this.loadingElement.remove();
          this.loadingElement = null;
        }
      }, 1000);
    }
  }
}

// Create a global instance
window.laincoreLoader = new LaincoreLoader();

// Override showLoadingScreen function if it exists
if (typeof showLoadingScreen === 'function') {
  const originalShowLoadingScreen = showLoadingScreen;
  window.showLoadingScreen = function() {
    // Check if Laincore is active
    const isLaincoreActive = localStorage.getItem('laincore_active') === 'true';
    
    if (isLaincoreActive && window.laincoreLoader) {
      return window.laincoreLoader.showLoading();
    } else {
      return originalShowLoadingScreen();
    }
  };
}

// Override any hideLoadingScreen function
if (typeof hideLoadingScreen === 'function') {
  const originalHideLoadingScreen = hideLoadingScreen;
  window.hideLoadingScreen = function() {
    // Check if Laincore is active
    const isLaincoreActive = localStorage.getItem('laincore_active') === 'true';
    
    if (isLaincoreActive && window.laincoreLoader) {
      window.laincoreLoader.hideLoading();
    } else {
      originalHideLoadingScreen();
    }
  };
}
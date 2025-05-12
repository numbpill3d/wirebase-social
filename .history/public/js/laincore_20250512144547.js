/**
 * LAINCORE - Serial Experiments Lain-inspired UI
 * Adds reactive and surreal effects to wirebase.city
 */

class LaincoreTheme {
  constructor() {
    this.isActive = false;
    this.messageTexts = [
      "Do you remember logging in?",
      "The nodes are watching",
      "Protocol fragment lost.",
      "Connection layers degrading",
      "Identity compromised",
      "Wireframe detected in subnet",
      "You don't seem to exist here",
      "Memory leakage detected",
      "Are you really there?",
      "Packet loss: 23%",
      "Signal degradation imminent",
      "Consciousness thread error",
      "Present in all layers",
      "Have you forgotten?",
      "Multiple connections detected",
      "Your echo persists",
      "Layer boundaries failing",
      "Protocol violation: PSYCHE"
    ];
    this.audioSources = {
      ambient: '/sounds/laincore-ambient.mp3',
      glitch: '/sounds/laincore-glitch.mp3',
      beep: '/sounds/laincore-beep.mp3'
    };
    this.audioElements = {};
    this.cursorTrails = [];
    this.navSidebar = null;
    this.lastCursorPosition = { x: 0, y: 0 };
    this.isPlayingAudio = false;
    this.themeToggleBtn = null;
    this.audioToggleBtn = null;
    this.messageInterval = null;
    this.currentMessage = null;
    this.degradationInterval = null;
    
    // Check if theme is already active in localStorage
    this.checkThemeState();
  }

  initialize() {
    // Add body class to enable styles
    document.body.classList.add('laincore');
    
    // Create all UI elements
    this.createBackgroundEffects();
    this.createCustomCursor();
    this.createNavigationSidebar();
    this.createThemeToggle();
    this.createAudioToggle();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Start effects
    this.startRandomMessages();
    this.startSignalDegradation();
    
    // Start audio (muted initially if user hasn't interacted)
    if (document.hasFocus()) {
      this.initializeAudio();
    }
    
    // Replace button texts with more cryptic labels
    this.updateButtonLabels();
    
    // Set theme as active
    this.isActive = true;
    localStorage.setItem('laincore_active', 'true');
    
    console.log('🖥️ LAINCORE: system online');
  }

  deactivate() {
    // Remove body class
    document.body.classList.remove('laincore');
    
    // Remove all created elements
    this.removeCustomElements();
    
    // Stop intervals and audio
    this.stopIntervals();
    this.stopAudio();
    
    // Restore button texts
    this.restoreButtonLabels();
    
    // Set theme as inactive
    this.isActive = false;
    localStorage.setItem('laincore_active', 'false');
    
    console.log('🖥️ LAINCORE: system offline');
  }

  checkThemeState() {
    const isActive = localStorage.getItem('laincore_active') === 'true';
    if (isActive) {
      this.initialize();
    }
  }

  createBackgroundEffects() {
    const backgroundContainer = document.createElement('div');
    backgroundContainer.className = 'laincore-background';
    
    // City loop background
    const cityLoop = document.createElement('div');
    cityLoop.className = 'laincore-city-loop';
    
    // Scan lines
    const scanLines = document.createElement('div');
    scanLines.className = 'laincore-scan-lines';
    
    // Noise overlay
    const noise = document.createElement('div');
    noise.className = 'laincore-noise';
    
    // Vignette effect
    const vignette = document.createElement('div');
    vignette.className = 'laincore-vignette';
    
    // Append all elements
    backgroundContainer.appendChild(cityLoop);
    backgroundContainer.appendChild(noise);
    backgroundContainer.appendChild(scanLines);
    backgroundContainer.appendChild(vignette);
    
    document.body.appendChild(backgroundContainer);
  }

  createCustomCursor() {
    // Main cursor
    const cursor = document.createElement('div');
    cursor.className = 'laincore-cursor';
    document.body.appendChild(cursor);
    
    // Update cursor position on mouse move
    document.addEventListener('mousemove', (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
      
      this.lastCursorPosition = { x: e.clientX, y: e.clientY };
      
      // Create trail element on movement (less frequently to improve performance)
      if (Math.random() < 0.3) {
        this.createCursorTrail(e.clientX, e.clientY);
      }
      
      // Scale cursor on link hover
      const isOverLink = e.target.tagName === 'A' || e.target.tagName === 'BUTTON' ||
                         e.target.classList.contains('win98-button') ||
                         e.target.classList.contains('win98-window-control');
      
      cursor.style.width = isOverLink ? '30px' : '20px';
      cursor.style.height = isOverLink ? '30px' : '20px';
      cursor.style.borderColor = isOverLink ? 'var(--lain-muted-red)' : 'var(--lain-crt-green)';
      
      // Play glitch sound randomly on movement (reduced frequency)
      if (this.isPlayingAudio && Math.random() < 0.005) {
        this.playAudio('glitch', 0.1);
      }
    });
  }

  createCursorTrail(x, y) {
    const trail = document.createElement('div');
    trail.className = 'laincore-cursor-trail';
    trail.style.left = `${x}px`;
    trail.style.top = `${y}px`;
    
    // Random size and opacity
    const size = Math.random() * 5 + 5;
    const opacity = Math.random() * 0.3 + 0.1;
    
    trail.style.width = `${size}px`;
    trail.style.height = `${size}px`;
    trail.style.opacity = opacity.toString();
    
    document.body.appendChild(trail);
    this.cursorTrails.push(trail);
    
    // Animate and remove
    setTimeout(() => {
      trail.style.opacity = '0';
      trail.style.transform = 'scale(0.5)';
      trail.style.transition = 'all 0.5s ease';
      
      setTimeout(() => {
        trail.remove();
        this.cursorTrails = this.cursorTrails.filter(t => t !== trail);
      }, 500);
    }, 100);
    
    // Keep only a limited number of trails
    if (this.cursorTrails.length > 20) {
      const oldTrail = this.cursorTrails.shift();
      oldTrail.remove();
    }
  }

  createNavigationSidebar() {
    // Create sidebar container
    const sidebar = document.createElement('div');
    sidebar.className = 'laincore-nav-sidebar';
    
    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'laincore-nav-toggle';
    toggleBtn.textContent = '>_ ACCESS PANEL';
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('active');
      this.playAudio('beep', 0.3);
    });
    
    // Create sidebar content
    const content = document.createElement('div');
    content.className = 'laincore-nav-content';
    
    // Clone navigation buttons
    const navbarButtons = document.querySelectorAll('.win98-navbar .win98-button');
    navbarButtons.forEach(btn => {
      const clone = btn.cloneNode(true);
      content.appendChild(clone);
      
      // Replace text with cryptic version
      if (clone.textContent === 'Home') clone.textContent = 'initiate';
      if (clone.textContent === 'Profile') clone.textContent = 'identity';
      if (clone.textContent === 'Login') clone.textContent = 'connect';
      if (clone.textContent === 'Scrapyard') clone.textContent = 'fragments';
      if (clone.textContent === 'Discover') clone.textContent = 'echo';
      if (clone.textContent === 'Forum') clone.textContent = 'nexus';
      if (clone.textContent === 'Logout') clone.textContent = 'disconnect';
      if (clone.textContent === 'Register') clone.textContent = 'initialize';
    });
    
    // Add to sidebar
    sidebar.appendChild(content);
    
    // Add to body
    document.body.appendChild(sidebar);
    document.body.appendChild(toggleBtn);
    
    this.navSidebar = sidebar;
  }

  createThemeToggle() {
    const toggle = document.createElement('button');
    toggle.className = 'laincore-theme-toggle';
    toggle.textContent = 'DISCONNECT // RECONNECT';
    toggle.addEventListener('click', () => {
      if (this.isActive) {
        this.deactivate();
      } else {
        this.initialize();
      }
    });
    
    document.body.appendChild(toggle);
    this.themeToggleBtn = toggle;
  }

  createAudioToggle() {
    const toggle = document.createElement('button');
    toggle.className = 'laincore-audio-toggle';
    toggle.textContent = 'UNMUTE // MUTE';
    toggle.addEventListener('click', () => {
      if (this.isPlayingAudio) {
        this.stopAudio();
        toggle.textContent = 'UNMUTE // MUTE';
      } else {
        this.initializeAudio(true);
        toggle.textContent = 'MUTE // UNMUTE';
      }
    });
    
    document.body.appendChild(toggle);
    this.audioToggleBtn = toggle;
  }

  initializeAudio(forcePlay = false) {
    // Only initialize once
    if (Object.keys(this.audioElements).length === 0) {
      Object.keys(this.audioSources).forEach(key => {
        const audio = new Audio(this.audioSources[key]);
        audio.volume = 0.2;
        if (key === 'ambient') {
          audio.loop = true;
        }
        this.audioElements[key] = audio;
      });
    }
    
    if (forcePlay) {
      this.isPlayingAudio = true;
      this.audioElements.ambient.play().catch(e => {
        console.warn('LAINCORE: Audio autoplay prevented by browser:', e);
      });
      this.audioToggleBtn.textContent = 'MUTE // UNMUTE';
      localStorage.setItem('laincore_audio', 'enabled');
    } else {
      // Check if audio was previously enabled
      const audioEnabled = localStorage.getItem('laincore_audio') === 'enabled';
      if (audioEnabled) {
        this.isPlayingAudio = true;
        this.audioElements.ambient.play().catch(e => {
          console.warn('LAINCORE: Audio autoplay prevented by browser:', e);
        });
        this.audioToggleBtn.textContent = 'MUTE // UNMUTE';
      }
    }
  }

  playAudio(key, volume = 0.2) {
    if (!this.isPlayingAudio || !this.audioElements[key]) return;
    
    // Clone the audio to allow overlapping sounds
    const audioClone = this.audioElements[key].cloneNode();
    audioClone.volume = volume;
    audioClone.play().catch(e => {
      console.warn(`LAINCORE: Audio play prevented:`, e);
    });
    
    // Clean up when done
    audioClone.addEventListener('ended', () => {
      audioClone.remove();
    });
  }

  stopAudio() {
    Object.values(this.audioElements).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    this.isPlayingAudio = false;
    localStorage.setItem('laincore_audio', 'disabled');
  }

  showRandomMessage() {
    // Don't show multiple messages
    if (this.currentMessage) return;
    
    // Get random message
    const text = this.messageTexts[Math.floor(Math.random() * this.messageTexts.length)];
    
    // Create message element
    const message = document.createElement('div');
    message.className = 'laincore-message';
    
    // Position randomly on screen (with safe margins)
    const x = Math.random() * (window.innerWidth - 300) + 50;
    const y = Math.random() * (window.innerHeight - 150) + 50;
    
    message.style.left = `${x}px`;
    message.style.top = `${y}px`;
    
    // Add content
    message.innerHTML = `
      ${text}
      <span class="laincore-message-dismiss">[ close ]</span>
    `;
    
    // Add to body
    document.body.appendChild(message);
    this.currentMessage = message;
    
    // Show with delay
    setTimeout(() => {
      message.classList.add('show');
      this.playAudio('beep', 0.2);
    }, 100);
    
    // Add close handler
    const dismiss = message.querySelector('.laincore-message-dismiss');
    dismiss.addEventListener('click', () => {
      message.classList.remove('show');
      setTimeout(() => {
        message.remove();
        this.currentMessage = null;
      }, 500);
    });
    
    // Auto-dismiss after random time
    const displayTime = Math.random() * 10000 + 5000;
    setTimeout(() => {
      if (message && document.body.contains(message)) {
        message.classList.remove('show');
        setTimeout(() => {
          message.remove();
          this.currentMessage = null;
        }, 500);
      }
    }, displayTime);
  }

  startRandomMessages() {
    // Random interval between 15-45 seconds
    const interval = Math.random() * 30000 + 15000;
    
    this.messageInterval = setInterval(() => {
      this.showRandomMessage();
    }, interval);
  }

  startSignalDegradation() {
    // After inactivity (30-60 seconds), add degradation effects
    let inactivityTime = 0;
    const degradationThreshold = Math.random() * 30000 + 30000;
    
    this.degradationInterval = setInterval(() => {
      inactivityTime += 1000;
      
      if (inactivityTime > degradationThreshold) {
        this.applyDegradationEffect();
      }
    }, 1000);
    
    // Reset timer on user activity
    const resetActivity = () => {
      inactivityTime = 0;
    };
    
    document.addEventListener('mousemove', resetActivity);
    document.addEventListener('keydown', resetActivity);
    document.addEventListener('click', resetActivity);
    document.addEventListener('scroll', resetActivity);
  }

  applyDegradationEffect() {
    // Random degradation effects
    const effectType = Math.floor(Math.random() * 5);
    
    switch (effectType) {
      case 0: // Text distortion
        this.distortPageText();
        break;
      case 1: // Layout glitch
        this.glitchPageLayout();
        break;
      case 2: // Visual noise increase
        this.increaseVisualNoise();
        break;
      case 3: // Window flicker
        this.flickerWindows();
        break;
      case 4: // Show glitchy message
        this.showRandomMessage();
        break;
    }
    
    // Play glitch sound
    this.playAudio('glitch', 0.3);
  }

  distortPageText() {
    // Select random text elements
    const texts = Array.from(document.querySelectorAll('p, h1, h2, h3, a, .win98-window-title'))
      .filter(el => el.offsetParent !== null); // Only visible elements
    
    if (texts.length === 0) return;
    
    // Apply distortion to 1-3 random elements
    const count = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < count; i++) {
      const textEl = texts[Math.floor(Math.random() * texts.length)];
      const originalText = textEl.textContent;
      const originalStyle = textEl.style.cssText;
      
      // Glitch the text
      textEl.textContent = this.glitchText(originalText);
      textEl.style.letterSpacing = `${Math.random() * 2}px`;
      textEl.style.filter = `blur(${Math.random() * 1.5}px)`;
      
      // Restore after a short delay
      setTimeout(() => {
        textEl.textContent = originalText;
        textEl.style.cssText = originalStyle;
      }, 2000);
    }
  }

  glitchText(text) {
    // Characters to use for glitching
    const glitchChars = '01/_\\|[]{}()<>!@#$%^&*-+=?;:\'",.`~';
    
    // Glitch 15-30% of characters
    return text.split('').map(char => {
      if (Math.random() < 0.3) {
        return glitchChars[Math.floor(Math.random() * glitchChars.length)];
      }
      return char;
    }).join('');
  }

  glitchPageLayout() {
    // Get random windows
    const windows = Array.from(document.querySelectorAll('.win98-window'))
      .filter(el => el.offsetParent !== null); // Only visible elements
    
    if (windows.length === 0) return;
    
    // Select 1-2 random windows
    const count = Math.floor(Math.random() * 2) + 1;
    
    for (let i = 0; i < count; i++) {
      const windowEl = windows[Math.floor(Math.random() * windows.length)];
      const originalStyle = windowEl.style.cssText;
      
      // Apply random transformations
      windowEl.style.transform = `translateX(${Math.random() * 10 - 5}px) translateY(${Math.random() * 10 - 5}px) skew(${Math.random() * 5 - 2.5}deg)`;
      windowEl.style.opacity = `${0.8 + Math.random() * 0.2}`;
      windowEl.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
      
      // Restore after a moment
      setTimeout(() => {
        windowEl.style.cssText = originalStyle;
      }, 2000);
    }
  }

  increaseVisualNoise() {
    // Temporarily increase noise opacity
    const noise = document.querySelector('.laincore-noise');
    if (!noise) return;
    
    const originalOpacity = noise.style.opacity || '0.03';
    noise.style.opacity = '0.2';
    
    // Restore after a moment
    setTimeout(() => {
      noise.style.opacity = originalOpacity;
    }, 2000);
  }

  flickerWindows() {
    // Get all windows
    const windows = Array.from(document.querySelectorAll('.win98-window'))
      .filter(el => el.offsetParent !== null); // Only visible elements
    
    if (windows.length === 0) return;
    
    // Select a random window
    const windowEl = windows[Math.floor(Math.random() * windows.length)];
    const flickerCount = Math.floor(Math.random() * 5) + 3;
    
    let flickersSoFar = 0;
    
    const flicker = () => {
      windowEl.style.opacity = flickersSoFar % 2 === 0 ? '0.3' : '1';
      flickersSoFar++;
      
      if (flickersSoFar < flickerCount * 2) {
        setTimeout(flicker, 100);
      } else {
        windowEl.style.opacity = '1';
      }
    };
    
    flicker();
  }

  updateButtonLabels() {
    // Store original labels and replace with cryptic ones
    const buttons = document.querySelectorAll('.win98-button');
    
    buttons.forEach(btn => {
      // Store original text
      btn.dataset.originalText = btn.textContent;
      
      // Replace with cryptic version
      if (btn.textContent === 'Home') btn.textContent = 'initiate';
      if (btn.textContent === 'Profile') btn.textContent = 'identity';
      if (btn.textContent === 'Login') btn.textContent = 'connect';
      if (btn.textContent === 'Scrapyard') btn.textContent = 'fragments';
      if (btn.textContent === 'Discover') btn.textContent = 'echo';
      if (btn.textContent === 'Forum') btn.textContent = 'nexus';
      if (btn.textContent === 'Logout') btn.textContent = 'disconnect';
      if (btn.textContent === 'Register') btn.textContent = 'initialize';
      
      // Any other buttons get generic cryptic names
      if (!btn.dataset.originalText.match(/Home|Profile|Login|Scrapyard|Discover|Forum|Logout|Register/)) {
        const cryptics = ['sync', 'merge', 'transmit', 'verify', 'protocol', 'descend'];
        btn.textContent = cryptics[Math.floor(Math.random() * cryptics.length)];
      }
    });
  }

  restoreButtonLabels() {
    // Restore original button labels
    const buttons = document.querySelectorAll('.win98-button[data-original-text]');
    
    buttons.forEach(btn => {
      btn.textContent = btn.dataset.originalText;
    });
  }

  setupEventListeners() {
    // Interaction events for dynamic effects
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('win98-button') || 
          e.target.classList.contains('win98-window-control')) {
        this.playAudio('beep', 0.2);
      }
    });
    
    // Window resize - adjust cursor trails and message positions
    window.addEventListener('resize', () => {
      // Clear all cursor trails on resize
      this.cursorTrails.forEach(trail => trail.remove());
      this.cursorTrails = [];
      
      // Reposition message if present
      if (this.currentMessage) {
        const x = Math.random() * (window.innerWidth - 300) + 50;
        const y = Math.random() * (window.innerHeight - 150) + 50;
        
        this.currentMessage.style.left = `${x}px`;
        this.currentMessage.style.top = `${y}px`;
      }
    });
    
    // Handle user interaction for audio
    document.addEventListener('click', () => {
      if (!this.isPlayingAudio && localStorage.getItem('laincore_audio') === 'enabled') {
        this.initializeAudio(true);
      }
    }, { once: true });
    
    // Escape key to toggle Nav sidebar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.navSidebar) {
        this.navSidebar.classList.remove('active');
      }
    });
  }

  removeCustomElements() {
    // Remove all elements created by Laincore
    document.querySelectorAll('.laincore-background, .laincore-cursor, .laincore-cursor-trail, .laincore-nav-sidebar, .laincore-nav-toggle, .laincore-theme-toggle, .laincore-audio-toggle, .laincore-message').forEach(el => {
      el.remove();
    });
  }

  stopIntervals() {
    // Clear all intervals
    if (this.messageInterval) {
      clearInterval(this.messageInterval);
    }
    
    if (this.degradationInterval) {
      clearInterval(this.degradationInterval);
    }
  }
}

// Initialize Laincore when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.laincore = new LaincoreTheme();
  
  // Look for existing theme toggle in the page
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      if (window.laincore.isActive) {
        window.laincore.deactivate();
      } else {
        window.laincore.initialize();
      }
    });
  }
});
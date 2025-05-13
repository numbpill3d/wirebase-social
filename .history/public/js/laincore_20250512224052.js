/**
 * laincore.js - Serial Experiments Lain / Cyberschizo effects for wirebase.city
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all cyberschizo effects
  initGlitchText();
  initTerminalEffects();
  initScanlines();
  addRandomGlitches();
});

/**
 * Initialize glitch text effect on elements with .glitch-text class
 */
function initGlitchText() {
  const glitchElements = document.querySelectorAll('.glitch-text');
  
  glitchElements.forEach(element => {
    // Store the original text as a data attribute
    const text = element.innerText;
    element.setAttribute('data-text', text);
  });
}

/**
 * Initialize terminal typing effects
 */
function initTerminalEffects() {
  const terminalElements = document.querySelectorAll('.terminal-content pre');
  
  terminalElements.forEach(element => {
    const text = element.innerText;
    element.innerText = '';
    
    let i = 0;
    const typeSpeed = 30; // ms per character
    
    function typeWriter() {
      if (i < text.length) {
        element.innerText += text.charAt(i);
        i++;
        setTimeout(typeWriter, typeSpeed);
      } else {
        // Add blinking cursor at the end
        const cursorSpan = document.createElement('span');
        cursorSpan.className = 'terminal-cursor';
        cursorSpan.innerText = '█';
        element.appendChild(cursorSpan);
        
        // Blink the cursor
        setInterval(() => {
          cursorSpan.style.visibility = cursorSpan.style.visibility === 'hidden' ? 'visible' : 'hidden';
        }, 500);
      }
    }
    
    // Start typing with a small delay
    setTimeout(typeWriter, 500);
  });
}

/**
 * Initialize scanline effect
 */
function initScanlines() {
  // Check if scanlines container already exists
  if (!document.querySelector('.crt-scanlines')) {
    const scanlines = document.createElement('div');
    scanlines.className = 'crt-scanlines';
    document.body.appendChild(scanlines);
    
    const flicker = document.createElement('div');
    flicker.className = 'crt-flicker';
    document.body.appendChild(flicker);
  }
}

/**
 * Add random glitch effects throughout the page
 */
function addRandomGlitches() {
  // Occasionally glitch the page
  setInterval(() => {
    if (Math.random() < 0.1) { // 10% chance every interval
      createGlitchEffect();
    }
  }, 5000);
}

/**
 * Create a temporary glitch effect on the page
 */
function createGlitchEffect() {
  // Create a glitch overlay
  const glitch = document.createElement('div');
  glitch.className = 'glitch-overlay';
  glitch.style.position = 'fixed';
  glitch.style.top = '0';
  glitch.style.left = '0';
  glitch.style.width = '100%';
  glitch.style.height = '100%';
  glitch.style.pointerEvents = 'none';
  glitch.style.zIndex = '9999';
  glitch.style.mixBlendMode = 'difference';
  glitch.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
  
  // Add to body
  document.body.appendChild(glitch);
  
  // Random horizontal offset
  const offsetX = Math.random() * 10 - 5; // -5 to 5px
  document.body.style.transform = `translateX(${offsetX}px)`;
  
  // Remove after a short time
  setTimeout(() => {
    document.body.removeChild(glitch);
    document.body.style.transform = '';
  }, 150);
}

/**
 * Easter egg: Lain quotes in console
 */
(function() {
  const lainQuotes = [
    "Present day... Present time! HAHAHAHA",
    "In the wired, all are connected.",
    "You don't exist until you're online.",
    "If you aren't remembered, you never existed.",
    "The wired and the real world are one and the same.",
    "Close your eyes. Count to ten. You are now in the wired."
  ];
  
  console.log("%c" + lainQuotes[Math.floor(Math.random() * lainQuotes.length)], 
    "color: #00ff00; background: #0f0f0f; padding: 10px; font-family: monospace; font-size: 14px;");
})();
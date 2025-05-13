/**
 * laincore-loader.js - Loads the Lain/Cyberschizo theme effects
 */

(function() {
  // Define CSS variables for the cyberschizo theme
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --cyber-light: #d9d9d9;
      --cyber-dark: #0f0f0f;
      --cyber-purple: #460066;
      --cyber-gray: #c0c0c0;
      --cyber-red: #ff0000;
      --cyber-green: #00ff00;
      --cyber-glow: rgba(0, 255, 0, 0.3);
    }
  `;
  document.head.appendChild(style);
  
  // Load the main laincore.js script
  const script = document.createElement('script');
  script.src = '/js/laincore.js';
  script.async = true;
  document.head.appendChild(script);
  
  // Load pixel fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=VT323&display=swap';
  document.head.appendChild(fontLink);
  
  // Add a meta tag for the theme
  const meta = document.createElement('meta');
  meta.name = 'theme-color';
  meta.content = '#0f0f0f';
  document.head.appendChild(meta);
  
  // Log initialization
  console.log('%c[wirebase.city] Laincore initialized', 'color: #00ff00; background: #0f0f0f;');
})();
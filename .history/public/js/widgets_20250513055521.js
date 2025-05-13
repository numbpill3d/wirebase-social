/**
 * widgets.js - Dynamic widget functionality for wirebase.city
 * Handles loading states, data updates, and interactions for modular widgets
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all widgets with loading states
  initWidgets();
  
  // Setup event listeners for widget interactions
  setupWidgetInteractions();
});

/**
 * Initialize all widgets on the page
 */
function initWidgets() {
  // Initialize loading states for all widgets
  document.querySelectorAll('[data-loading]').forEach(element => {
    if (!loadingStates.has(element)) {
      loadingStates.set(element, new LoadingState(element));
    }
  });
  
  // Initialize specific widgets
  initStatsWidget();
  initTrafficWidget();
  initActivityWidget();
  initMoodWidget();
}

/**
 * Initialize the site statistics widget
 */
function initStatsWidget() {
  const statsWidget = document.querySelector('.site-stats-widget .cyber-window-content');
  if (!statsWidget) return;
  
  const loadingState = loadingStates.get(statsWidget);
  if (loadingState) {
    loadingState.start();
    
    // Simulate loading delay (in a real app, this would be an API call)
    setTimeout(() => {
      // Add animation to the stat values
      document.querySelectorAll('.stat-value').forEach(statValue => {
        animateNumber(statValue, parseInt(statValue.textContent, 10));
      });
      
      loadingState.stop();
    }, 800);
  }
}

/**
 * Initialize the traffic visualization widget
 */
function initTrafficWidget() {
  const trafficWidget = document.querySelector('.traffic-widget .cyber-window-content');
  if (!trafficWidget) return;
  
  const loadingState = loadingStates.get(trafficWidget);
  if (loadingState) {
    loadingState.start();
    
    // Simulate loading delay (in a real app, this would be an API call)
    setTimeout(() => {
      // Add animation to the traffic bars
      document.querySelectorAll('.traffic-bar').forEach(bar => {
        const height = bar.style.height;
        bar.style.height = '0';
        setTimeout(() => {
          bar.style.height = height;
        }, 100);
      });
      
      loadingState.stop();
    }, 1200);
  }
}

/**
 * Initialize the user activity widget
 */
function initActivityWidget() {
  const activityWidget = document.querySelector('.user-activity-widget .cyber-window-content');
  if (!activityWidget) return;
  
  const loadingState = loadingStates.get(activityWidget);
  if (loadingState) {
    loadingState.start();
    
    // Simulate loading delay (in a real app, this would be an API call)
    setTimeout(() => {
      // Add animation to the activity values
      document.querySelectorAll('.activity-value').forEach(value => {
        animateNumber(value, parseInt(value.textContent, 10));
      });
      
      // Add fade-in animation to activity items
      document.querySelectorAll('.activity-item').forEach((item, index) => {
        item.style.opacity = '0';
        setTimeout(() => {
          item.style.transition = 'opacity 0.3s ease';
          item.style.opacity = '1';
        }, 100 * index);
      });
      
      loadingState.stop();
    }, 1000);
  }
}

/**
 * Initialize the mood indicator widget
 */
function initMoodWidget() {
  const moodWidget = document.querySelector('.mood-widget .cyber-window-content');
  if (!moodWidget) return;
  
  const loadingState = loadingStates.get(moodWidget);
  if (loadingState) {
    loadingState.start();
    
    // Simulate loading delay (in a real app, this would be an API call)
    setTimeout(() => {
      // Add animation to the intensity bar
      const intensityFill = document.querySelector('.intensity-fill');
      if (intensityFill) {
        const width = intensityFill.style.width;
        intensityFill.style.width = '0';
        setTimeout(() => {
          intensityFill.style.transition = 'width 1s ease';
          intensityFill.style.width = width;
        }, 100);
      }
      
      loadingState.stop();
    }, 1500);
  }
}

/**
 * Setup event listeners for widget interactions
 */
function setupWidgetInteractions() {
  // Minimize/maximize widget functionality
  document.querySelectorAll('.cyber-window-control.minimize, .cyber-window-control.maximize').forEach(control => {
    control.addEventListener('click', (e) => {
      const window = e.target.closest('.cyber-window');
      if (window) {
        window.classList.toggle('minimized');
      }
    });
  });
  
  // Close widget functionality
  document.querySelectorAll('.cyber-window-control.close').forEach(control => {
    control.addEventListener('click', (e) => {
      const window = e.target.closest('.cyber-window');
      if (window) {
        window.classList.add('closed');
        // Add animation for closing
        window.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        window.style.opacity = '0';
        window.style.transform = 'scale(0.9)';
        setTimeout(() => {
          window.style.display = 'none';
        }, 300);
      }
    });
  });
}

/**
 * Animate a number from 0 to target value
 * @param {HTMLElement} element - The element to update
 * @param {number} target - The target number
 * @param {number} duration - Animation duration in ms
 */
function animateNumber(element, target, duration = 1000) {
  if (!element) return;
  
  let start = 0;
  const increment = target / (duration / 16); // 60fps
  
  function updateNumber() {
    start += increment;
    if (start >= target) {
      element.textContent = target;
      return;
    }
    
    element.textContent = Math.floor(start);
    requestAnimationFrame(updateNumber);
  }
  
  updateNumber();
}

/**
 * Add a helper function to format time ago
 * This would normally be handled by a Handlebars helper
 */
function timeAgo(date) {
  if (!date) return 'unknown time';
  
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) return interval + ' years ago';
  if (interval === 1) return '1 year ago';
  
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) return interval + ' months ago';
  if (interval === 1) return '1 month ago';
  
  interval = Math.floor(seconds / 86400);
  if (interval > 1) return interval + ' days ago';
  if (interval === 1) return '1 day ago';
  
  interval = Math.floor(seconds / 3600);
  if (interval > 1) return interval + ' hours ago';
  if (interval === 1) return '1 hour ago';
  
  interval = Math.floor(seconds / 60);
  if (interval > 1) return interval + ' minutes ago';
  if (interval === 1) return '1 minute ago';
  
  if (seconds < 10) return 'just now';
  return Math.floor(seconds) + ' seconds ago';
}
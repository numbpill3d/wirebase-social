/**
 * Setup the notification system for the market.
 * Creates a toast container used by showNotification.
 */
function initializeNotifications() {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '1000';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';
    document.body.appendChild(container);
  }
}
/**
 * Vivid Market JavaScript
 * Client-side functionality for the Vivid Market feature
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize market components
  initializeMarketTheme();
  initializeWishlistButtons();
  initializeMarketFilters();
  initializeItemPreviews();
  initializeNotifications();
  initializeModalHandlers();
  initializePurchaseFlow();
  initializeItemHtmlViewer();
});

/**
 * Initialize market theme selector
 */
function initializeMarketTheme() {
  const themeSelector = document.querySelector('.theme-select');
  if (!themeSelector) return;

  // Set initial theme from localStorage or default to 'purple'
  const savedTheme = localStorage.getItem('vivid-market-theme') || 'purple';
  const marketContainer = document.querySelector('.vivid-market');

  // Apply saved theme
  marketContainer.classList.add(`theme-${savedTheme}`);
  themeSelector.value = savedTheme;

  // Create theme indicator if it doesn't exist
  let themeIndicator = document.querySelector('.theme-indicator');
  if (!themeIndicator) {
    themeIndicator = document.createElement('div');
    themeIndicator.className = 'theme-indicator';
    const themeContainer = themeSelector.closest('.market-theme-selector');
    if (themeContainer) {
      themeContainer.appendChild(themeIndicator);
    }
  }

  // Set initial indicator color
  updateThemeIndicator(savedTheme);

  // Handle theme changes
  themeSelector.addEventListener('change', function() {
    // Remove all theme classes
    marketContainer.classList.remove('theme-purple', 'theme-blue', 'theme-red', 'theme-green', 'theme-grayscale');

    // Add selected theme class
    marketContainer.classList.add(`theme-${this.value}`);

    // Update theme indicator
    updateThemeIndicator(this.value);

    // Save to localStorage
    localStorage.setItem('vivid-market-theme', this.value);

    // Show notification
    showNotification(`Theme changed to ${this.options[this.selectedIndex].text}`, 'info');
  });

  // Function to update theme indicator
  function updateThemeIndicator(theme) {
    const colors = {
      'purple': '#8a2be2',
      'blue': '#1e90ff',
      'red': '#dc143c',
      'green': '#2e8b57',
      'grayscale': '#888'
    };

    themeIndicator.style.backgroundColor = colors[theme] || colors.purple;
  }
}

/**
 * Initialize wishlist functionality
 */
function initializeWishlistButtons() {
  const wishlistButtons = document.querySelectorAll('.wishlist-button');
  if (!wishlistButtons.length) return;

  wishlistButtons.forEach(button => {
    button.addEventListener('click', async function(e) {
      e.preventDefault();

      // Check if user is logged in
      if (!isUserLoggedIn()) {
        showNotification('Please log in to add items to your wishlist', 'error');
        return;
      }

      const itemId = this.dataset.itemId;
      const isInWishlist = this.classList.contains('in-wishlist');

      try {
        let response;

        if (isInWishlist) {
          // Remove from wishlist
          response = await fetch(`/api/market/wishlist/remove/${itemId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });
        } else {
          // Add to wishlist
          response = await fetch(`/api/market/wishlist/add/${itemId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });
        }

        if (response.ok) {
          // Toggle wishlist state
          this.classList.toggle('in-wishlist');

          // Show notification
          const message = isInWishlist
            ? 'Item removed from wishlist'
            : 'Item added to wishlist';
          showNotification(message, 'success');
        } else {
          const data = await response.json();
          showNotification(data.message || 'Error updating wishlist', 'error');
        }
      } catch (error) {
        console.error('Wishlist error:', error);
        showNotification('Error updating wishlist', 'error');
      }
    });
  });
}

/**
 * Initialize market filters
 */
function initializeMarketFilters() {
  const filterForm = document.getElementById('market-filter-form');
  if (!filterForm) return;

  filterForm.addEventListener('submit', function(e) {
    e.preventDefault();

    // Get filter values
    const category = document.getElementById('filter-category').value;
    const sortBy = document.getElementById('filter-sort').value;
    const priceMin = document.getElementById('filter-price-min').value;
    const priceMax = document.getElementById('filter-price-max').value;

    // Build query string
    let queryParams = new URLSearchParams(window.location.search);

    if (category) queryParams.set('category', category);
    else queryParams.delete('category');

    if (sortBy) queryParams.set('sort', sortBy);
    else queryParams.delete('sort');

    if (priceMin) queryParams.set('min_price', priceMin);
    else queryParams.delete('min_price');

    if (priceMax) queryParams.set('max_price', priceMax);
    else queryParams.delete('max_price');

    // Reset to page 1 when filtering
    queryParams.set('page', '1');

    // Navigate to filtered URL
    window.location.href = `${window.location.pathname}?${queryParams.toString()}`;
  });

  // Handle reset filters button
  const resetButton = document.getElementById('reset-filters');
  if (resetButton) {
    resetButton.addEventListener('click', function() {
      window.location.href = window.location.pathname;
    });
  }
}

/**
 * Initialize item preview functionality
 */
function initializeItemPreviews() {
  const itemPreviews = document.querySelectorAll('.item-preview');
  if (!itemPreviews.length) return;

  itemPreviews.forEach(preview => {
    preview.addEventListener('click', function(e) {
      // Only handle clicks on the preview area, not on buttons inside it
      if (e.target.closest('.wishlist-button')) return;

      const itemId = this.closest('.market-item').dataset.itemId;
      if (itemId) {
        window.location.href = `/market/item/${itemId}`;
      }
    });
  });
}

/**
 * Show notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info)
 */
function showNotification(message, type = 'info') {
  // Ensure notification system is initialized
  let container = document.querySelector('.toast-container');
  if (!container) {
    initializeNotifications();
    container = document.querySelector('.toast-container');
  }

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  container.appendChild(notification);

  // Show notification
  requestAnimationFrame(() => {
    notification.classList.add('show');
  });

  // Hide and remove notification after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    const removeFn = () => notification.remove();
    notification.addEventListener('transitionend', removeFn, { once: true });
    setTimeout(removeFn, 300); // fallback if transition event doesn't fire
  }, 3000);
}

/**
 * Initialize modal handlers
 */
function initializeModalHandlers() {
  // Open modal buttons
  const modalOpenButtons = document.querySelectorAll('[data-modal-target]');
  modalOpenButtons.forEach(button => {
    button.addEventListener('click', function() {
      const modalId = this.dataset.modalTarget;
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.style.display = 'block';
      }
    });
  });

  // Close modal buttons
  const modalCloseButtons = document.querySelectorAll('.close-modal');
  modalCloseButtons.forEach(button => {
    button.addEventListener('click', function() {
      const modal = this.closest('.modal');
      if (modal) {
        modal.style.display = 'none';
      }
    });
  });

  // Close modal when clicking outside
  window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
  });
}

/**
 * Initialize purchase flow
 */
function initializePurchaseFlow() {
  const purchaseButtons = document.querySelectorAll('.purchase-button');
  if (!purchaseButtons.length) return;

  purchaseButtons.forEach(button => {
    button.addEventListener('click', async function(e) {
      e.preventDefault();

      // Check if user is logged in
      if (!isUserLoggedIn()) {
        showNotification('Please log in to purchase items', 'error');
        return;
      }

      const itemId = this.dataset.itemId;
      const price = parseInt(this.dataset.price, 10);

      // Show confirmation modal
      const confirmModal = document.getElementById('purchase-confirm-modal');
      if (confirmModal) {
        // Update modal content with item details
        const itemNameEl = confirmModal.querySelector('.confirm-item-name');
        const itemPriceEl = confirmModal.querySelector('.confirm-item-price');

        if (itemNameEl) itemNameEl.textContent = this.dataset.itemName || 'this item';
        if (itemPriceEl) itemPriceEl.textContent = price || '0';

        // Set item ID on confirm button
        const confirmButton = confirmModal.querySelector('.confirm-purchase-button');
        if (confirmButton) {
          confirmButton.dataset.itemId = itemId;
          confirmButton.dataset.price = price;
        }

        confirmModal.style.display = 'block';
      }
    });
  });

  // Handle purchase confirmation
  const confirmPurchaseButton = document.querySelector('.confirm-purchase-button');
  if (confirmPurchaseButton) {
    confirmPurchaseButton.addEventListener('click', async function() {
      const itemId = this.dataset.itemId;
      const modal = this.closest('.modal');

      try {
        // Show loading state
        this.disabled = true;
        this.innerHTML = '<span class="loading-spinner-small"></span> Processing...';

        // Process purchase
        const response = await fetch(`/api/market/purchase/${itemId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (response.ok) {
          // Close modal
          if (modal) modal.style.display = 'none';

          // Show success notification
          showNotification('Purchase successful! Check your inventory.', 'success');

          // Redirect to purchase confirmation page
          setTimeout(() => {
            window.location.href = `/market/purchase/confirmation/${data.purchaseId}`;
          }, 1500);
        } else {
          // Show error message
          showNotification(data.message || 'Error processing purchase', 'error');

          // Reset button
          this.disabled = false;
          this.textContent = 'Confirm Purchase';
        }
      } catch (error) {
        console.error('Purchase error:', error);
        showNotification('Error processing purchase', 'error');

        // Reset button
        this.disabled = false;
        this.textContent = 'Confirm Purchase';
      }
    });
  }
}

/**
 * Check if user is logged in
 * @returns {boolean} - Whether user is logged in
 */
function isUserLoggedIn() {
  return document.body.classList.contains('user-logged-in');
}

/**
 * Initialize item HTML viewer buttons
 */
function initializeItemHtmlViewer() {
  const htmlButtons = document.querySelectorAll('.view-html-button');
  if (!htmlButtons.length) return;

  htmlButtons.forEach(button => {
    button.addEventListener('click', async function(e) {
      e.preventDefault();

      const {itemId} = this.dataset;
      const modalId = this.dataset.modalTarget;
      if (!itemId) return;

      try {
        const response = await fetch(`/api/market/items/${itemId}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || 'Error loading item');
        }

        const htmlContent = data.item.content || '<p>No HTML available.</p>';

        if (modalId) {
          const modal = document.getElementById(modalId);
          if (modal) {
            const container = modal.querySelector('.item-html-container');
            if (container) container.textContent = htmlContent;
            modal.style.display = 'block';
          }
        } else {
          let container = this.closest('.market-item');
          if (container) {
            let htmlEl = container.querySelector('.item-html-container');
            if (!htmlEl) {
              htmlEl = document.createElement('div');
              htmlEl.className = 'item-html-container';
              container.appendChild(htmlEl);
            }
            htmlEl.textContent = htmlContent;
          }
        }
      } catch (error) {
        console.error('Error loading item HTML:', error);
        showNotification('Error loading item HTML', 'error');
      }
    });
  });
}

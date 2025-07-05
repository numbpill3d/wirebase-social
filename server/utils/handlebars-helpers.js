/**
 * Custom Handlebars helpers for Wirebase
 */
// Import DOMPurify for HTML sanitization
let DOMPurify;
// Flag to ensure fallback warning only logs once
let fallbackWarningShown = false;
try {
  // DOMPurify requires a DOM environment, so we need to use jsdom in Node.js
  const createDOMPurify = require('dompurify');
  const { JSDOM } = require('jsdom');
  const window = new JSDOM('').window;
  DOMPurify = createDOMPurify(window);
  console.log('DOMPurify initialized with JSDOM');
} catch (err) {
  const warningMessage = 'DOMPurify module not found, using fallback implementation: ' + err.message;
  // Simple fallback implementation
  DOMPurify = {
    sanitize: function(content, options) {
      if (!fallbackWarningShown) {
        console.warn(warningMessage);
        fallbackWarningShown = true;
      }
      // Basic sanitization - in a real app, use a proper HTML sanitizer
      return content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  };
}

module.exports = {
  // Format date in Windows 98 style or relative time
  formatDate: function(date, format) {
    if (!date) return 'unknown date';

    const d = new Date(date);

    // If format is 'relative', use relative time
    if (format === 'relative') {
      const now = new Date();
      const diffMs = now - d;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) return 'just now';
      if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
      if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
      if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;

      // Fall back to standard date format for older dates
    }

    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();

    return `${month}/${day}/${year}`;
  },

  // Check if two values are equal
  eq: function(a, b) {
    return a === b;
  },

  // Check if user is the owner of content
  isOwner: function(contentUserId, currentUserId) {
    // For Supabase we're using UUIDs, direct comparison is fine
    return contentUserId && currentUserId && contentUserId === currentUserId;
  },

  // Truncate text to a specific length
  truncate: function(text, length) {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  },

  // Create pagination links
  paginate: function(currentPage, totalPages, options) {
    let result = '';

    // Previous button
    if (currentPage > 1) {
      result += `<a href="?page=${currentPage - 1}" class="win98-button prev-button">◄ Previous</a>`;
    } else {
      result += `<span class="win98-button disabled">◄ Previous</span>`;
    }

    // Page numbers
    result += `<span class="page-info">Page ${currentPage} of ${totalPages}</span>`;

    // Next button
    if (currentPage < totalPages) {
      result += `<a href="?page=${currentPage + 1}" class="win98-button next-button">Next ►</a>`;
    } else {
      result += `<span class="win98-button disabled">Next ►</span>`;
    }

    return result;
  },

  // Format user joined date in retro style
  memberSince: function(date) {
    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  },

  // Safe HTML rendering for user content (limited tags allowed)
  safeHTML: function(content) {
    if (!content) return '';

    // Basic sanitization - in a real app, use a proper HTML sanitizer
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  // Allow selected HTML tags (for user customization)
  allowedHTML: function(content) {
    if (!content) return '';

    try {
      // Use DOMPurify to sanitize HTML
      const sanitized = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'ul', 'ol', 'li',
                       'strong', 'em', 'a', 'img', 'div', 'span', 'blockquote', 'code', 'pre'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'style'],
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
      });
      // Return sanitized HTML as a string that won't be escaped by Handlebars
      // Note: In Express-Handlebars, we don't need to use Handlebars.SafeString
      // We can just return the sanitized string and use triple braces in the template: {{{allowedHTML content}}}
      return sanitized;
    } catch (err) {
      console.error('HTML sanitization error:', err);
      return '';
    }
  },

  // Format karma/loot tokens with medieval icon
  formatLoot: function(amount) {
    return `<span class="loot-token">${amount} ⚜️</span>`;
  },

  // Calculate time passed since date in medieval style
  timeSince: function(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
      return interval + ' moon' + (interval === 1 ? '' : 's') + ' ago';
    }

    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
      return interval + ' fortnight' + (interval === 1 ? '' : 's') + ' ago';
    }

    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
      return interval + ' day' + (interval === 1 ? '' : 's') + ' ago';
    }

    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
      return interval + ' hour' + (interval === 1 ? '' : 's') + ' ago';
    }

    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
      return interval + ' minute' + (interval === 1 ? '' : 's') + ' ago';
    }

    return 'just now';
  },

  // Calculate time passed since date in cyberpunk style
  timeAgo: function(date) {
    if (!date) return 'timestamp unknown';

    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
      return interval + ' cycle' + (interval === 1 ? '' : 's') + ' ago';
    }

    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
      return interval + ' segment' + (interval === 1 ? '' : 's') + ' ago';
    }

    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
      return interval + ' rotation' + (interval === 1 ? '' : 's') + ' ago';
    }

    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
      return interval + ' unit' + (interval === 1 ? '' : 's') + ' ago';
    }

    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
      return interval + ' pulse' + (interval === 1 ? '' : 's') + ' ago';
    }

    if (seconds < 10) return 'real-time';
    return Math.floor(seconds) + ' micro-cycles ago';
  },

  // Add two numbers - used for pagination
  add: function(a, b) {
    return parseInt(a) + parseInt(b);
  },

  // Subtract two numbers - used for pagination
  subtract: function(a, b) {
    return parseInt(a) - parseInt(b);
  },

  // Calculate total WIR earned from transactions
  calculateEarned: function(transactions) {
    if (!transactions || !transactions.length) return 0;

    return transactions.reduce((total, transaction) => {
      // Only count positive transactions (incoming)
      if (transaction.amount > 0) {
        return total + transaction.amount;
      }
      return total;
    }, 0);
  },

  // Calculate total WIR spent from transactions
  calculateSpent: function(transactions) {
    if (!transactions || !transactions.length) return 0;

    return transactions.reduce((total, transaction) => {
      // Only count negative transactions (outgoing)
      if (transaction.amount < 0) {
        return total + Math.abs(transaction.amount);
      }
      return total;
    }, 0);
  }
};

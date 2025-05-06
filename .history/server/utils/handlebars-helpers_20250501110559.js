/**
 * Custom Handlebars helpers for Wirebase
 */

module.exports = {
  // Format date in Windows 98 style
  formatDate: function(date, format) {
    const d = new Date(date);
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
      return new Handlebars.SafeString(sanitized);
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
  }
};

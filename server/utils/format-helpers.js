/**
 * Format helper functions for Wirebase
 * Provides utility functions for formatting data
 */

/**
 * Format a date to a readable string
 * @param {Date|string} date - The date to format
 * @param {string} format - Optional format string (not used in basic implementation)
 * @returns {string} Formatted date string
 */
const formatDate = (date, format) => {
  const d = new Date(date);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();

  return `${month}/${day}/${year}`;
};

/**
 * Truncate text to a specific length
 * @param {string} text - The text to truncate
 * @param {number} length - Maximum length before truncation
 * @returns {string} Truncated text with ellipsis if needed
 */
const truncateText = (text, length) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency symbol (default: '$')
 * @returns {string} Formatted currency string
 */
const formatCurrency = (amount, currency = '$') => {
  return `${currency}${parseFloat(amount).toFixed(2)}`;
};

/**
 * Format a number with commas for thousands
 * @param {number} number - The number to format
 * @returns {string} Formatted number with commas
 */
const formatNumber = (number) => {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Format a file size in bytes to a human-readable string
 * @param {number} bytes - The file size in bytes
 * @returns {string} Formatted file size (e.g., "1.5 MB")
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format a time period in seconds to a human-readable string
 * @param {number} seconds - The time period in seconds
 * @returns {string} Formatted time string
 */
const formatTimePeriod = (seconds) => {
  if (seconds < 60) {
    return `${Math.floor(seconds)} second${seconds !== 1 ? 's' : ''}`;
  }
  
  const minutes = seconds / 60;
  if (minutes < 60) {
    const mins = Math.floor(minutes);
    return `${mins} minute${mins !== 1 ? 's' : ''}`;
  }
  
  const hours = minutes / 60;
  if (hours < 24) {
    const hrs = Math.floor(hours);
    return `${hrs} hour${hrs !== 1 ? 's' : ''}`;
  }
  
  const days = hours / 24;
  const d = Math.floor(days);
  return `${d} day${d !== 1 ? 's' : ''}`;
};

module.exports = {
  formatDate,
  truncateText,
  formatCurrency,
  formatNumber,
  formatFileSize,
  formatTimePeriod
};

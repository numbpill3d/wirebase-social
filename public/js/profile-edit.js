// Profile edit utilities for live preview and theme selection

document.addEventListener('DOMContentLoaded', () => {
  const htmlEditor = document.getElementById('profileHtml');
  const cssEditor = document.getElementById('profileCss');
  const preview = document.getElementById('livePreview');

  function updatePreview() {
    if (!preview) return;

    // Sanitize HTML input to prevent XSS
    const sanitizedHTML = htmlEditor ? sanitizeHTML(htmlEditor.value) : preview.innerHTML;
    preview.innerHTML = sanitizedHTML;

    // Apply CSS if provided (also sanitize CSS)
    const styleTag = preview.querySelector('style[data-preview]') || document.createElement('style');
    styleTag.dataset.preview = 'true';
    styleTag.textContent = cssEditor ? sanitizeCSS(cssEditor.value) : '';
    if (!preview.contains(styleTag)) {
      preview.appendChild(styleTag);
    }
  }

  // Basic HTML sanitization function
  function sanitizeHTML(html) {
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
  }

  // Basic CSS sanitization function
  function sanitizeCSS(css) {
    // Remove potentially dangerous CSS properties
    return css.replace(/javascript:|expression:|vbscript:|on\w+\s*:/gi, '');
  }

  if (htmlEditor) {
    htmlEditor.addEventListener('input', updatePreview);
  }
  if (cssEditor) {
    cssEditor.addEventListener('input', updatePreview);
  }
  updatePreview();

  const themeSelect = document.getElementById('themeSelect');
  const themePreview = document.querySelector('.theme-preview .preview-area');
  if (themeSelect && themePreview) {
    const applyTheme = (t) => {
      themePreview.className = 'preview-area theme-' + t;
    };
    applyTheme(themeSelect.value);
    themeSelect.addEventListener('change', () => applyTheme(themeSelect.value));
  }
});

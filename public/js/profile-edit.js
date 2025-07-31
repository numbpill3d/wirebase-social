// Profile edit utilities for live preview and theme selection

document.addEventListener('DOMContentLoaded', () => {
  const htmlEditor = document.getElementById('profileHtml');
  const cssEditor = document.getElementById('profileCss');
  const preview = document.getElementById('livePreview');

  function updatePreview() {
    if (!preview) return;
    preview.innerHTML = htmlEditor ? htmlEditor.value : preview.innerHTML;

    // Apply CSS if provided
    const styleTag = preview.querySelector('style[data-preview]') || document.createElement('style');
    styleTag.dataset.preview = 'true';
    styleTag.textContent = cssEditor ? cssEditor.value : '';
    if (!preview.contains(styleTag)) {
      preview.appendChild(styleTag);
    }
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

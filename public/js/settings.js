document.addEventListener('DOMContentLoaded', function() {
  const glyphOptions = document.querySelectorAll('.glyph-option');
  const glyphInput = document.getElementById('customGlyph');

  glyphOptions.forEach(option => {
    option.addEventListener('click', function() {
      const glyph = this.getAttribute('data-glyph');
      if (glyphInput) {
        glyphInput.value = glyph;
      }
    });
  });
});

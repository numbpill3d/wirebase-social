window.addEventListener('DOMContentLoaded', () => {
  const scanBtn = document.querySelector('.search-panel .cyber-button');
  const input = document.querySelector('.search-panel .cyber-input');
  const items = document.querySelectorAll('.category-item');

  if (scanBtn && input) {
    const doSearch = () => {
      const q = input.value.toLowerCase();
      items.forEach(item => {
        item.style.display = item.textContent.toLowerCase().includes(q) ? 'block' : 'none';
      });
    };
    scanBtn.addEventListener('click', doSearch);
    input.addEventListener('keyup', e => { if (e.key === 'Enter') doSearch(); });
  }
});

// Simple handlers for the feed page
window.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.cyber-tab');
  const items = document.querySelectorAll('.feed-item');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.dataset.filter;
      items.forEach(item => {
        if (!filter || filter === 'all') {
          item.style.display = '';
        } else {
          item.style.display = item.dataset.category === filter ? '' : 'none';
        }
      });
    });
  });

  const loadMore = document.querySelector('.stream-controls button:nth-child(1)');
  const stream = document.querySelector('.stream-feed');
  if (loadMore && stream) {
    loadMore.addEventListener('click', () => {
      const clone = items[items.length - 1].cloneNode(true);
      clone.querySelector('.feed-timestamp').textContent = new Date().toISOString();
      stream.appendChild(clone);
    });
  }

  const autoBtn = document.querySelector('.stream-controls button:nth-child(2)');
  let autoInterval;
  if (autoBtn && stream) {
    autoBtn.addEventListener('click', () => {
      if (autoInterval) {
        clearInterval(autoInterval);
        autoInterval = null;
        autoBtn.textContent = 'Auto-Refresh';
      } else {
        autoBtn.textContent = 'Stop Auto';
        autoInterval = setInterval(() => {
          const clone = items[0].cloneNode(true);
          clone.querySelector('.feed-timestamp').textContent = new Date().toISOString();
          stream.prepend(clone);
        }, 5000);
      }
    });
  }

  const filterBtn = document.querySelector('.stream-controls button:nth-child(3)');
  const feedOptions = document.querySelector('.feed-options');
  if (filterBtn && feedOptions) {
    filterBtn.addEventListener('click', () => {
      feedOptions.style.display = feedOptions.style.display === 'none' ? '' : 'none';
    });
  }
});

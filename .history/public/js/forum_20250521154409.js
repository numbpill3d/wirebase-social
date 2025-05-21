/**
 * forum.js - Enhanced Forum Functionality for wirebase.city
 * Cyberschizo aesthetic with improved UI and navigation
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize glitch effect on headers
  initGlitchEffect();

  // Initialize WYSIWYG editor
  initWysiwygEditor();

  // Initialize character counters
  initCharacterCounters();

  // Initialize category filter
  initCategoryFilter();

  // Initialize formatting help toggle
  initFormattingHelp();

  // Initialize mobile sidebar toggle
  initMobileSidebar();

  // Add terminal cursor blinking effect
  initTerminalCursor();

  // Add CRT effects
  initCRTEffects();
});

/**
 * Initialize glitch effect on headers
 */
function initGlitchEffect() {
  const headers = document.querySelectorAll('.glitch-text');
  headers.forEach(header => {
    const text = header.textContent;
    header.setAttribute('data-text', text);
  });
}

/**
 * Initialize WYSIWYG editor
 */
function initWysiwygEditor() {
  const buttons = document.querySelectorAll('.wysiwyg-button');
  const editors = document.querySelectorAll('.wysiwyg-content');

  if (buttons.length > 0 && editors.length > 0) {
    buttons.forEach(button => {
      button.addEventListener('click', function() {
        const command = this.getAttribute('data-command');
        const editor = this.closest('.wysiwyg-editor').querySelector('.wysiwyg-content');
        const hiddenInput = this.closest('form').querySelector('textarea[name="content"]');

        // Focus the editor
        editor.focus();

        let url; // Declare url outside the switch
        let selection; // Declare selection outside the switch

        switch(command) {
          case 'bold':
            document.execCommand('bold', false, null);
            break;
          case 'italic':
            document.execCommand('italic', false, null);
            break;
          case 'link':
            url = prompt('Enter the URL:'); // Assign value inside case
            if (url) {
              document.execCommand('createLink', false, url);
            }
            break;
          case 'code':
            selection = window.getSelection(); // Assign value inside case
            if (selection.toString().length > 0) {
              const range = selection.getRangeAt(0);
              const codeElement = document.createElement('code');
              codeElement.textContent = selection.toString();
              range.deleteContents();
              range.insertNode(codeElement);
            } else {
              document.execCommand('insertHTML', false, '<code>code here</code>');
            }
            break;
          case 'quote':
            document.execCommand('insertHTML', false, '<blockquote>quote here</blockquote>');
            break;
          case 'list-ul':
            document.execCommand('insertUnorderedList', false, null);
            break;
          case 'list-ol':
            document.execCommand('insertOrderedList', false, null);
            break;
        }

        // Update hidden input with HTML content
        if (hiddenInput) {
          hiddenInput.value = editor.innerHTML;

          // Trigger input event for character counter
          editor.dispatchEvent(new Event('input'));
        }
      });
    });

    // Update hidden input on content change
    editors.forEach(editor => {
      const form = editor.closest('form');
      if (form) {
        const hiddenInput = form.querySelector('textarea[name="content"]');

        if (hiddenInput) {
          editor.addEventListener('input', function() {
            hiddenInput.value = editor.innerHTML;
          });

          // Set initial value
          hiddenInput.value = editor.innerHTML;
        }
      }
    });
  }
}

/**
 * Initialize character counters
 */
function initCharacterCounters() {
  // Title counter
  const titleInput = document.getElementById('title');
  const titleCounter = document.getElementById('title-counter');

  if (titleInput && titleCounter) {
    titleInput.addEventListener('input', function() {
      const count = this.value.length;
      const max = parseInt(this.getAttribute('maxlength')) || 100;
      titleCounter.textContent = `${count}/${max} characters`;

      updateCounterClass(titleCounter, count, max);
    });

    // Initialize counter
    titleInput.dispatchEvent(new Event('input'));
  }

  // Content counter
  const contentEditor = document.querySelector('.wysiwyg-content');
  const contentCounter = document.getElementById('content-counter');

  if (contentEditor && contentCounter) {
    contentEditor.addEventListener('input', function() {
      const count = this.textContent.length;
      const max = 5000; // Maximum content length
      contentCounter.textContent = `${count}/${max} characters`;

      updateCounterClass(contentCounter, count, max);
    });

    // Initialize counter
    contentEditor.dispatchEvent(new Event('input'));
  }
}

/**
 * Update counter class based on character count
 */
function updateCounterClass(counter, count, max) {
  if (count > max * 0.8 && count <= max * 0.95) {
    counter.className = 'character-counter warning';
  } else if (count > max * 0.95) {
    counter.className = 'character-counter danger';
  } else {
    counter.className = 'character-counter';
  }
}

/**
 * Initialize category filter
 */
function initCategoryFilter() {
  const filterButtons = document.querySelectorAll('.category-filter-button');
  const threadItems = document.querySelectorAll('.thread-item');

  if (filterButtons.length > 0 && threadItems.length > 0) {
    filterButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Remove active class from all buttons
        filterButtons.forEach(btn => btn.classList.remove('active'));

        // Add active class to clicked button
        this.classList.add('active');

        const category = this.getAttribute('data-category');

        // Filter threads
        threadItems.forEach(item => {
          const threadCategory = item.querySelector('.thread-category')?.textContent.toLowerCase();

          if (category === 'all' || !threadCategory || threadCategory === category) {
            item.style.display = 'flex';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  }
}

/**
 * Initialize formatting help toggle
 */
function initFormattingHelp() {
  const formattingToggle = document.querySelector('.formatting-help-toggle');
  const formattingHelp = document.querySelector('.formatting-help');

  if (formattingToggle && formattingHelp) {
    formattingToggle.addEventListener('click', function() {
      formattingHelp.style.display = formattingHelp.style.display === 'block' ? 'none' : 'block';
    });
  }
}

/**
 * Initialize mobile sidebar toggle
 */
function initMobileSidebar() {
  const sidebar = document.querySelector('.forum-sidebar');

  if (sidebar) {
    // Add mobile toggle button
    const toggleButton = document.createElement('button');
    toggleButton.className = 'mobile-sidebar-toggle';
    toggleButton.innerHTML = '<i class="fas fa-bars"></i>';
    document.querySelector('.forum-container').appendChild(toggleButton);

    toggleButton.addEventListener('click', function() {
      sidebar.classList.toggle('mobile-open');
    });

    // Close sidebar when clicking outside
    document.addEventListener('click', function(e) {
      if (sidebar.classList.contains('mobile-open') &&
          !sidebar.contains(e.target) &&
          e.target !== toggleButton) {
        sidebar.classList.remove('mobile-open');
      }
    });
  }
}

/**
 * Initialize terminal cursor effect
 */
function initTerminalCursor() {
  const cursors = document.querySelectorAll('.terminal-cursor');

  if (cursors.length > 0) {
    // The CSS for terminal cursor is already defined in forum.css
    // This function now just ensures all terminal cursors have the correct class
    cursors.forEach(cursor => {
      if (!cursor.classList.contains('terminal-cursor')) {
        cursor.classList.add('terminal-cursor');
      }
    });
  }
}

/**
 * Initialize CRT effects
 */
function initCRTEffects() {
  const container = document.querySelector('.forum-container');

  if (container) {
    // Add scanlines
    const scanlines = document.createElement('div');
    scanlines.className = 'crt-scanlines';
    container.appendChild(scanlines);

    // Add flicker
    const flicker = document.createElement('div');
    flicker.className = 'crt-flicker';
    container.appendChild(flicker);

    // Add random glitch effect
    setInterval(() => {
      const headers = document.querySelectorAll('h1, h2, h3');
      const randomHeader = headers[Math.floor(Math.random() * headers.length)];

      if (randomHeader) {
        randomHeader.classList.add('glitch-active');
        setTimeout(() => {
          randomHeader.classList.remove('glitch-active');
        }, 200);
      }
    }, 5000);
  }
}

/**
 * Add random glitch to elements
 */
function addRandomGlitch() {
  const elements = document.querySelectorAll('.cyber-window-header, .cyber-button, .thread-title a');
  const randomIndex = Math.floor(Math.random() * elements.length);
  const element = elements[randomIndex];

  if (element) {
    element.classList.add('glitch-active');
    setTimeout(() => {
      element.classList.remove('glitch-active');
    }, 200);
  }

  // Schedule next glitch
  setTimeout(addRandomGlitch, Math.random() * 10000 + 5000);
}

// Start random glitches
setTimeout(addRandomGlitch, 5000);
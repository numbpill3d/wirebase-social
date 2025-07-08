/**
 * Wirebase - Streetpass Widget Component
 * A customizable widget that shows recent visitors and allows leaving emotes
 */

class StreetpassWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.visitors = [];
    this.username = this.getAttribute('username') || 'unknown';
    this.profileId = this.getAttribute('profile-id') || '';
    this.maxVisitors = parseInt(this.getAttribute('max-visitors') || '5');
    this.theme = this.getAttribute('theme') || 'cyber';
  }

  connectedCallback() {
    this.loadVisitors()
      .then(() => {
        this.render();
        this.attachEventListeners();
      })
      .catch(error => {
        console.error('Error loading streetpass data:', error);
        this.visitors = [];
        this.renderError();
      });
  }

  async loadVisitors() {
    if (!this.profileId) {
      console.error('No profile ID provided to Streetpass widget');
      this.visitors = [];
      return;
    }
    // Fetch visitors from API
    const url = `/api/streetpass/visitors/${this.profileId}?limit=${this.maxVisitors}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to load visitors: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success && Array.isArray(data.visitors)) {
      // Transform API data to widget format
      this.visitors = data.visitors.map(visitor => {
        if (!visitor.visitor) {
          throw new Error('Invalid visitor data structure');
        }
        return {
          timestamp: visitor.visitedAt
            ? new Date(visitor.visitedAt).getTime()
            : Date.now(),
          username: visitor.visitor.username,
          displayName: visitor.visitor.displayName,
          glyph: visitor.visitor.customGlyph,
          emote: visitor.emote || '👋',
          visitId: visitor.id
        };
      });
    } else {
      // Invalid data format
      throw new Error('API returned invalid data format');
    }
  }

  render() {
    const styles = this.getStyles();
    const visitorsList = this.renderVisitorsList();
    const emoteSelector = this.renderEmoteSelector();

    this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            <div class="streetpass-widget theme-${this.theme}">
                <div class="cyber-window">
                    <div class="cyber-window-header">
                        <span class="cyber-window-title">connection.log</span>
                        <div class="cyber-window-controls">
                            <span class="cyber-window-control minimize">_</span>
                            <span class="cyber-window-control close">×</span>
                        </div>
                    </div>
                    <div class="cyber-window-content">
                        <div class="widget-header">
                            <div class="title-container">
                                <img
                                  src="/images/streetpass-icon.svg"
                                  alt="Connection Log"
                                  class="widget-icon"
                                >
                                <h3>Network Connections</h3>
                            </div>
                            <div class="visitor-count">
                                Nodes: <span class="count">${this.visitors.length}</span>
                            </div>
                        </div>

                        <div class="visitors-container">
                            ${visitorsList}
                        </div>

                        ${emoteSelector}
                    </div>
                </div>
            </div>
        `;
  }

  renderVisitorsList() {
    if (this.visitors.length === 0) {
      return '<div class="no-visitors">No connections detected.</div>';
    }

    return `
            <ul class="visitors-list">
                ${this.visitors.map(visitor => `
                    <li class="visitor-item">
                        <div class="visitor-info">
                            <span class="visitor-glyph">${visitor.glyph}</span>
                            <span class="visitor-name">${visitor.username}</span>
                            <span class="visitor-time">${this.formatTime(visitor.timestamp)}</span>
                        </div>
                            <div
                              class="visitor-emote"
                              title="${visitor.username} left ${visitor.emote}"
                            >
                            ${visitor.emote}
                        </div>
                    </li>
                `).join('')}
            </ul>
        `;
  }

  renderEmoteSelector() {
    // Only show emote selector if this is not the user's own profile
    const currentUser = localStorage.getItem('wirebase_username');

    if (currentUser && currentUser !== this.username) {
      return `
                <div class="emote-section">
                    <h4>Transmit signal:</h4>
                    <div class="emote-selector">
                        <button class="emote-option" data-emote="👁️">👁️</button>
                        <button class="emote-option" data-emote="💾">💾</button>
                        <button class="emote-option" data-emote="🔌">🔌</button>
                        <button class="emote-option" data-emote="📡">📡</button>
                        <button class="emote-option" data-emote="🖥️">🖥️</button>
                        <button class="emote-option" data-emote="🕸️">🕸️</button>
                        <button class="emote-option" data-emote="📶">📶</button>
                        <button class="emote-option" data-emote="🔋">🔋</button>
                    </div>
                </div>
            `;
    }

    return '';
  }

  renderError() {
    this.shadowRoot.innerHTML = `
            <div class="streetpass-widget error">
                <div class="cyber-window">
                    <div class="cyber-window-header">
                        <span class="cyber-window-title">system.error</span>
                        <div class="cyber-window-controls">
                            <span class="cyber-window-control close">×</span>
                        </div>
                    </div>
                    <div class="cyber-window-content">
                        <p>Connection data corrupted.</p>
                        <button class="cyber-button retry-button">Reconnect</button>
                    </div>
                </div>
            </div>
        `;

    this.shadowRoot.querySelector('.retry-button').addEventListener('click', () => {
      this.loadVisitors()
        .then(() => {
          this.render();
          this.attachEventListeners();
        })
        .catch(err => {
          console.error('Error loading streetpass data:', err);
          this.visitors = [];
          this.renderError();
        });
    });
  }

  attachEventListeners() {
    // Window controls
    const minimizeBtn = this.shadowRoot.querySelector('.minimize');
    const closeBtn = this.shadowRoot.querySelector('.close');

    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', () => {
        const content = this.shadowRoot.querySelector('.cyber-window-content');
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.style.display = 'none';
      });
    }

    // Emote buttons
    const emoteButtons = this.shadowRoot.querySelectorAll('.emote-option');
    emoteButtons.forEach(button => {
      button.addEventListener('click', () => {
        const emote = button.dataset.emote;
        this.leaveEmote(emote);
      });
    });
  }

  async leaveEmote(emote) {
    try {
      if (!this.profileId) {
        this.showErrorNotification('Cannot leave emote: No profile ID provided');
        return;
      }

      // Show loading state
      this.showEmoteConfirmation('⏳');

      // Send to server
      const response = await fetch('/api/streetpass/visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profileId: this.profileId,
          emote: emote
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to record visit');
      }

      const result = await response.json();

      if (result.success) {
        // Reload visitors to get updated list
        await this.loadVisitors();

        // Re-render
        this.render();
        this.attachEventListeners();

        // Show confirmation
        this.showEmoteConfirmation(emote);
      } else {
        throw new Error(result.message || 'Failed to record visit');
      }
    } catch (error) {
      console.error('Error saving streetpass data:', error);
      this.showErrorNotification('Failed to save your emote. Please try again.');
    }
  }

  showErrorNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.textContent = message;

    this.shadowRoot.querySelector('.streetpass-widget').appendChild(notification);

    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 500);
    }, 3000);
  }

  showEmoteConfirmation(emote) {
    const confirmation = document.createElement('div');
    confirmation.className = 'emote-confirmation';
    confirmation.textContent = emote;

    this.shadowRoot.querySelector('.streetpass-widget').appendChild(confirmation);

    // Animate and remove
    setTimeout(() => {
      confirmation.classList.add('fade-out');
      setTimeout(() => confirmation.remove(), 500);
    }, 1000);
  }

  formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;

    // Less than a minute
    if (diff < 60000) {
      return 'just now';
    }

    // Less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }

    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }

    // Less than a week
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }

    // Format as date
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  }

  getStyles() {
    return `
            :host {
                display: block;
                font-family: 'PixelOperator', 'VT323', 'Courier New', monospace;
            }

            .streetpass-widget {
                margin-bottom: 20px;
                width: 100%;
            }

            /* Windows 98 Styling */
            .cyber-window {
                background-color: #0f0f0f;
                border: 1px solid #460066;
                box-shadow: 0 0 10px rgba(70, 0, 102, 0.5);
            }

            .cyber-window-header {
                background-color: #460066;
                color: #d9d9d9;
                padding: 5px 10px;
                font-weight: bold;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-family: 'PixelOperator', 'VT323', monospace;
                text-transform: lowercase;
            }

            .cyber-window-controls {
                display: flex;
                gap: 2px;
            }

            .cyber-window-control {
                width: 16px;
                height: 14px;
                background-color: #0f0f0f;
                border: 1px solid #460066;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 10px;
                line-height: 1;
                cursor: pointer;
                color: #d9d9d9;
            }

            .cyber-window-content {
                padding: 10px;
                color: #d9d9d9;
            }

            .widget-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
                border-bottom: 1px solid #808080;
                padding-bottom: 5px;
            }

            .title-container {
                display: flex;
                align-items: center;
                gap: 5px;
            }

            .widget-icon {
                width: 20px;
                height: 20px;
            }

            .widget-header h3 {
                margin: 0;
                font-size: 14px;
                color: #00ff00;
                font-weight: bold;
                font-family: 'PixelOperator', 'VT323', monospace;
            }

            .visitor-count {
                font-size: 12px;
                color: #444;
            }

            .visitors-container {
                border: 1px inset #808080;
                background-color: white;
                padding: 5px;
                margin-bottom: 10px;
                max-height: 200px;
                overflow-y: auto;
            }

            .visitors-list {
                list-style-type: none;
                padding: 0;
                margin: 0;
            }

            .visitor-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 5px;
                border-bottom: 1px solid #e0e0e0;
            }

            .visitor-item:last-child {
                border-bottom: none;
            }

            .visitor-info {
                display: flex;
                align-items: center;
                gap: 5px;
            }

            .visitor-glyph {
                font-size: 16px;
            }

            .visitor-name {
                font-weight: bold;
                font-size: 12px;
            }

            .visitor-time {
                font-size: 10px;
                color: #666;
                margin-left: 5px;
            }

            .visitor-emote {
                font-size: 18px;
            }

            .no-visitors {
                padding: 10px;
                text-align: center;
                color: #666;
                font-style: italic;
            }

            .emote-section h4 {
                margin: 0 0 5px 0;
                font-size: 12px;
                font-weight: bold;
                color: #00ff00;
                font-family: 'PixelOperator', 'VT323', monospace;
            }

            .emote-selector {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 5px;
            }

            .emote-option {
                background-color: #0f0f0f;
                border: 1px solid #460066;
                padding: 5px;
                font-size: 16px;
                cursor: pointer;
                display: flex;
                justify-content: center;
                align-items: center;
            }

            .emote-option:active {
                border-color: #00ff00;
                box-shadow: 0 0 5px rgba(0, 255, 0, 0.3);
            }

            .emote-confirmation {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 64px;
                animation: float-up 1.5s ease-out;
                opacity: 1;
            }

            .emote-confirmation.fade-out,
            .error-notification.fade-out {
                opacity: 0;
                transition: opacity 0.5s;
            }

            .error-notification {
                position: absolute;
                bottom: 10px;
                left: 10px;
                right: 10px;
                background-color: #ff5252;
                color: white;
                padding: 8px;
                border-radius: 3px;
                font-size: 12px;
                text-align: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                z-index: 100;
                opacity: 1;
                animation: fade-in 0.3s ease-in;
            }

            @keyframes fade-in {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            @keyframes float-up {
                0% { transform: translate(-50%, -50%); opacity: 0; }
                10% { opacity: 1; }
                100% { transform: translate(-50%, -120%); opacity: 0; }
            }

            /* Theme: Cyber */
            .theme-cyber .cyber-window {
                background-color: #0f0f0f;
                border-color: #460066;
            }

            .theme-cyber .cyber-window-header {
                background-color: #460066;
            }

            .theme-cyber .cyber-window-content {
                color: #d9d9d9;
            }

            .theme-cyber .widget-header h3,
            .theme-cyber .emote-section h4 {
                color: #00ff00;
                text-shadow: 0 0 5px rgba(0, 255, 0, 0.3);
            }

            .theme-cyber .visitor-count {
                color: #c0c0c0;
            }

            .theme-cyber .visitors-container {
                background-color: #0f0f0f;
                border-color: #460066;
            }

            .theme-cyber .visitor-item {
                border-bottom-color: #460066;
            }

            .theme-cyber .visitor-name {
                color: #00ff00;
            }

            .theme-cyber .visitor-time {
                color: #c0c0c0;
            }

            .theme-cyber .no-visitors {
                color: #c0c0c0;
            }

            .theme-cyber .emote-option {
                background-color: #0f0f0f;
                border-color: #460066;
            }

            .theme-cyber .emote-option:active {
                border-color: #00ff00;
                box-shadow: 0 0 5px rgba(0, 255, 0, 0.3);
            }

            /* Add scanline effect for cyber theme */
            .theme-cyber .cyber-window::after {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    to bottom,
                    transparent 50%,
                    rgba(0, 0, 0, 0.1) 51%
                );
                background-size: 100% 4px;
                pointer-events: none;
                animation: scanline 10s linear infinite;
                z-index: 2;
                opacity: 0.3;
            }

            @keyframes scanline {
                0% { transform: translateY(0); }
                100% { transform: translateY(20px); }
            }
        `;
  }
}

// Register the custom element
customElements.define('streetpass-widget', StreetpassWidget);

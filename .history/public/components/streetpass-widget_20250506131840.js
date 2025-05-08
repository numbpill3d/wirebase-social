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
        this.theme = this.getAttribute('theme') || 'dungeon';
    }

    connectedCallback() {
        this.loadVisitors()
            .then(() => {
                this.render();
                this.attachEventListeners();
            })
            .catch(error => {
                console.error('Error loading streetpass data:', error);
                this.renderError();
            });
    }

    async loadVisitors() {
        try {
            // In a real app, this would fetch from an API
            // For demo, we'll use dummy data or local storage
            const storedData = localStorage.getItem(`streetpass_${this.username}`);
            
            if (storedData) {
                this.visitors = JSON.parse(storedData);
            } else {
                // Fallback demo data
                this.visitors = [
                    { username: 'DungeonMaster', glyph: '🧙', timestamp: Date.now() - 3600000, emote: '👋' },
                    { username: 'PixelQueen', glyph: '👑', timestamp: Date.now() - 86400000, emote: '👍' },
                    { username: 'RetroWarrior', glyph: '⚔️', timestamp: Date.now() - 172800000, emote: '🔥' }
                ];
                
                // Store demo data
                localStorage.setItem(`streetpass_${this.username}`, JSON.stringify(this.visitors));
            }

            // Sort by most recent
            this.visitors.sort((a, b) => b.timestamp - a.timestamp);
            
            // Limit to max visitors
            this.visitors = this.visitors.slice(0, this.maxVisitors);
        } catch (error) {
            console.error('Error parsing streetpass data:', error);
            this.visitors = [];
        }
    }

    render() {
        const styles = this.getStyles();
        const visitorsList = this.renderVisitorsList();
        const emoteSelector = this.renderEmoteSelector();
        
        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            <div class="streetpass-widget theme-${this.theme}">
                <div class="win98-window">
                    <div class="win98-window-header">
                        <span class="win98-window-title">Streetpass</span>
                        <div class="win98-window-controls">
                            <span class="win98-window-control minimize">_</span>
                            <span class="win98-window-control close">×</span>
                        </div>
                    </div>
                    <div class="win98-window-content">
                        <div class="widget-header">
                            <div class="title-container">
                                <img src="/images/streetpass-icon.svg" alt="Streetpass" class="widget-icon">
                                <h3>Recent Visitors</h3>
                            </div>
                            <div class="visitor-count">
                                Total: <span class="count">${this.visitors.length}</span>
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
            return '<div class="no-visitors">No visitors yet.</div>';
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
                        <div class="visitor-emote" title="${visitor.username} left ${visitor.emote}">
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
                    <h4>Leave an impression:</h4>
                    <div class="emote-selector">
                        <button class="emote-option" data-emote="👋">👋</button>
                        <button class="emote-option" data-emote="👍">👍</button>
                        <button class="emote-option" data-emote="🔥">🔥</button>
                        <button class="emote-option" data-emote="🧙">🧙</button>
                        <button class="emote-option" data-emote="⚔️">⚔️</button>
                        <button class="emote-option" data-emote="🛡️">🛡️</button>
                        <button class="emote-option" data-emote="💎">💎</button>
                        <button class="emote-option" data-emote="⚜️">⚜️</button>
                    </div>
                </div>
            `;
        }
        
        return '';
    }

    renderError() {
        this.shadowRoot.innerHTML = `
            <div class="streetpass-widget error">
                <div class="win98-window">
                    <div class="win98-window-header">
                        <span class="win98-window-title">Error</span>
                        <div class="win98-window-controls">
                            <span class="win98-window-control close">×</span>
                        </div>
                    </div>
                    <div class="win98-window-content">
                        <p>Could not load Streetpass data.</p>
                        <button class="win98-button retry-button">Retry</button>
                    </div>
                </div>
            </div>
        `;
        
        this.shadowRoot.querySelector('.retry-button').addEventListener('click', () => {
            this.loadVisitors().then(() => this.render());
        });
    }

    attachEventListeners() {
        // Window controls
        const minimizeBtn = this.shadowRoot.querySelector('.minimize');
        const closeBtn = this.shadowRoot.querySelector('.close');
        
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                const content = this.shadowRoot.querySelector('.win98-window-content');
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

    leaveEmote(emote) {
        // Get current user
        const currentUser = localStorage.getItem('wirebase_username') || 'Guest';
        const currentGlyph = localStorage.getItem('wirebase_glyph') || '👤';
        
        // Check if user has already visited
        const existingVisitorIndex = this.visitors.findIndex(
            v => v.username === currentUser
        );
        
        if (existingVisitorIndex !== -1) {
            // Update existing visit
            this.visitors[existingVisitorIndex].emote = emote;
            this.visitors[existingVisitorIndex].timestamp = Date.now();
        } else {
            // Add new visit
            this.visitors.unshift({
                username: currentUser,
                glyph: currentGlyph,
                timestamp: Date.now(),
                emote: emote,
                profileId: this.profileId // Include profile ID
            });
            
            // Maintain max length
            if (this.visitors.length > this.maxVisitors) {
                this.visitors.pop();
            }
        }
        
        try {
            // In a real app, send to server
            // For demo, store in localStorage
            localStorage.setItem(`streetpass_${this.username}`, JSON.stringify(this.visitors));
            
            // Re-render
            this.render();
            this.attachEventListeners();
            
            // Show confirmation
            this.showEmoteConfirmation(emote);
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
                font-family: 'MS Sans Serif', 'Tahoma', sans-serif;
            }
            
            .streetpass-widget {
                margin-bottom: 20px;
                width: 100%;
            }
            
            /* Windows 98 Styling */
            .win98-window {
                background-color: #c0c0c0;
                border: 2px solid;
                border-color: #ffffff #808080 #808080 #ffffff;
                box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
            }
            
            .win98-window-header {
                background-color: #000080;
                color: white;
                padding: 3px 5px;
                font-weight: bold;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .win98-window-controls {
                display: flex;
                gap: 2px;
            }
            
            .win98-window-control {
                width: 16px;
                height: 14px;
                background-color: #c0c0c0;
                border: 1px solid;
                border-color: #ffffff #808080 #808080 #ffffff;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 10px;
                line-height: 1;
                cursor: pointer;
                color: black;
            }
            
            .win98-window-content {
                padding: 10px;
                color: black;
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
                color: black;
                font-weight: bold;
                font-family: 'MS Sans Serif', 'Tahoma', sans-serif;
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
                color: black;
                font-family: 'MS Sans Serif', 'Tahoma', sans-serif;
            }
            
            .emote-selector {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 5px;
            }
            
            .emote-option {
                background-color: #c0c0c0;
                border: 2px solid;
                border-color: #ffffff #808080 #808080 #ffffff;
                padding: 5px;
                font-size: 16px;
                cursor: pointer;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            
            .emote-option:active {
                border-color: #808080 #ffffff #ffffff #808080;
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
            
            /* Theme: Dungeon */
            .theme-dungeon .win98-window {
                background-color: #2a1a41;
                border-color: #5d3e8e #1a102a #1a102a #5d3e8e;
            }
            
            .theme-dungeon .win98-window-header {
                background-color: #4a2888;
            }
            
            .theme-dungeon .win98-window-content {
                color: #ffd700;
            }
            
            .theme-dungeon .widget-header h3,
            .theme-dungeon .emote-section h4 {
                color: #ffd700;
            }
            
            .theme-dungeon .visitor-count {
                color: #9075bb;
            }
            
            .theme-dungeon .visitors-container {
                background-color: #1a102a;
                border-color: #1a102a #5d3e8e #5d3e8e #1a102a;
            }
            
            .theme-dungeon .visitor-item {
                border-bottom-color: #3a2255;
            }
            
            .theme-dungeon .visitor-name {
                color: #fff;
            }
            
            .theme-dungeon .visitor-time {
                color: #9075bb;
            }
            
            .theme-dungeon .no-visitors {
                color: #9075bb;
            }
            
            .theme-dungeon .emote-option {
                background-color: #3a2255;
                border-color: #5d3e8e #1a102a #1a102a #5d3e8e;
            }
            
            .theme-dungeon .emote-option:active {
                border-color: #1a102a #5d3e8e #5d3e8e #1a102a;
            }
        `;
    }
}

// Register the custom element
customElements.define('streetpass-widget', StreetpassWidget);
/**
 * Wirebase - Main JavaScript
 * Handles interactivity for the Windows 98 + Medieval Dungeon Fantasy UI
 */

document.addEventListener('DOMContentLoaded', function() {
    // Handle Windows 98 window controls
    setupWindowControls();
    
    // Add interactivity to buttons
    setupButtons();
    
    // Setup terminal mode functionality
    setupTerminalMode();
    
    // Setup pixel image rendering
    setupPixelRendering();
    
    // Add medieval torch flickering effect
    setupTorchEffects();
});

/**
 * Setup Windows 98 window control behaviors
 */
function setupWindowControls() {
    const windowControls = document.querySelectorAll('.win98-window-control');
    
    windowControls.forEach(control => {
        control.addEventListener('click', function() {
            const windowElement = this.closest('.win98-window');
            const controlText = this.textContent.trim();
            
            // Handle window control actions
            if (controlText === '×') {
                // Close window (minimize for demo purposes)
                windowElement.style.height = '20px';
                windowElement.querySelector('.win98-window-content').style.display = 'none';
                
                // Add restore button
                const minimizeControl = this.previousElementSibling;
                minimizeControl.textContent = '□';
                minimizeControl.classList.add('restore-control');
            } else if (controlText === '□' && this.classList.contains('restore-control')) {
                // Restore window
                windowElement.style.height = '';
                windowElement.querySelector('.win98-window-content').style.display = '';
                
                // Remove restore button
                this.textContent = '□';
                this.classList.remove('restore-control');
            } else if (controlText === '_') {
                // Minimize window (toggle visibility for demo)
                const content = windowElement.querySelector('.win98-window-content');
                content.style.display = content.style.display === 'none' ? '' : 'none';
            }
        });
    });
}

/**
 * Setup Windows 98 button behaviors
 */
function setupButtons() {
    const buttons = document.querySelectorAll('.win98-button');
    
    buttons.forEach(button => {
        // Add press effect
        button.addEventListener('mousedown', function() {
            this.style.borderColor = 'var(--win98-border-darker) var(--win98-border-light) var(--win98-border-light) var(--win98-border-darker)';
            this.style.padding = '7px 11px 5px 13px';
        });
        
        button.addEventListener('mouseup', function() {
            this.style.borderColor = 'var(--win98-border-light) var(--win98-border-darker) var(--win98-border-darker) var(--win98-border-light)';
            this.style.padding = '6px 12px';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.borderColor = 'var(--win98-border-light) var(--win98-border-darker) var(--win98-border-darker) var(--win98-border-light)';
            this.style.padding = '6px 12px';
        });
        
        // Add click effect with retro sound
        button.addEventListener('click', function() {
            // Play click sound (commented out for now)
            // playSound('click');
            
            // Handle button actions
            if (this.textContent === 'Join Now') {
                alert('Welcome to Wirebase! Join our medieval dungeon fantasy social platform.');
            }
        });
    });
}

/**
 * Setup terminal mode functionality
 */
function setupTerminalMode() {
    const terminal = document.querySelector('.terminal-content pre');
    if (!terminal) return;
    
    // Blinking cursor
    setInterval(() => {
        const cursor = terminal.querySelector('.cursor');
        if (cursor) {
            cursor.style.visibility = cursor.style.visibility === 'hidden' ? 'visible' : 'hidden';
        }
    }, 500);
    
    // Simple terminal input for demo
    document.addEventListener('keydown', function(e) {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
            return;
        }
        
        // Only process if terminal is visible
        const terminalMode = document.querySelector('.terminal-mode');
        if (terminalMode && window.getComputedStyle(terminalMode).display !== 'none') {
            if (e.key === 'Enter') {
                const commandText = terminal.textContent.trim().split('\n').pop();
                if (commandText.includes('edit profile.html')) {
                    terminal.innerHTML += '\nOpening profile.html for editing...\n\n&lt;div class="profile-custom-area"&gt;\n  &lt;h4&gt;Welcome to my Dungeon!&lt;/h4&gt;\n  &lt;p&gt;Edit this HTML to customize your profile.&lt;/p&gt;\n&lt;/div&gt;\n\n> <span class="cursor">_</span>';
                } else {
                    terminal.innerHTML += '\nCommand not recognized\n> <span class="cursor">_</span>';
                }
            } else if (e.key === 'Backspace') {
                const lines = terminal.textContent.trim().split('\n');
                let lastLine = lines[lines.length - 1];
                
                if (lastLine.length > 2) { // Don't delete the prompt
                    lastLine = lastLine.substring(0, lastLine.length - 1);
                    lines[lines.length - 1] = lastLine;
                    terminal.innerHTML = lines.join('\n') + '<span class="cursor">_</span>';
                }
            } else if (e.key.length === 1) { // Single character
                const cursorSpan = terminal.querySelector('.cursor');
                if (cursorSpan) {
                    const newChar = document.createTextNode(e.key);
                    cursorSpan.parentNode.insertBefore(newChar, cursorSpan);
                }
            }
        }
    });
}

/**
 * Setup proper pixel image rendering
 */
function setupPixelRendering() {
    const pixelImages = document.querySelectorAll('.pixel-image');
    
    pixelImages.forEach(img => {
        img.style.imageRendering = 'pixelated';
    });
}

/**
 * Setup medieval torch flickering effect
 */
function setupTorchEffects() {
    const torches = document.querySelectorAll('.torch');
    
    torches.forEach(torch => {
        // Create the flame element
        const flame = document.createElement('div');
        flame.classList.add('flame');
        torch.appendChild(flame);
        
        // Random flicker
        setInterval(() => {
            const flicker = Math.random() * 0.2 + 0.9;
            flame.style.transform = `scale(${flicker})`;
            flame.style.opacity = Math.random() * 0.2 + 0.8;
            
            // Random color shift between orange and gold
            const hue = Math.floor(Math.random() * 20) + 30; // Range from 30 to 50 (orange to gold)
            flame.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;
        }, 100);
    });
}

/**
 * Play a sound effect
 */
function playSound(soundName) {
    // Create sound effects when needed
    const sounds = {
        click: 'sounds/click.mp3',
        error: 'sounds/error.mp3',
        startup: 'sounds/startup.mp3'
    };
    
    if (sounds[soundName]) {
        const audio = new Audio(sounds[soundName]);
        audio.play().catch(e => console.log('Sound playback prevented:', e));
    }
}

/**
 * Create Streetpass visitor functionality
 */
function setupStreetpass() {
    const widget = document.querySelector('.streetpass-widget');
    if (!widget) return;
    
    // In a real app, this would make an API call to record the visit
    // For demo, just show a notification
    setTimeout(() => {
        const notification = document.createElement('div');
        notification.classList.add('win98-notification');
        notification.innerHTML = `
            <div class="win98-window">
                <div class="win98-window-header">
                    <span class="win98-window-title">Streetpass</span>
                    <div class="win98-window-controls">
                        <span class="win98-window-control close-notification">×</span>
                    </div>
                </div>
                <div class="win98-window-content">
                    <p>You visited Sir_PixelLot's profile.</p>
                    <p>Leave an emote impression:</p>
                    <div class="emote-selection">
                        <span class="emote-option">👋</span>
                        <span class="emote-option">👍</span>
                        <span class="emote-option">🧙</span>
                        <span class="emote-option">🗡️</span>
                        <span class="emote-option">🛡️</span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Handle close button
        notification.querySelector('.close-notification').addEventListener('click', () => {
            document.body.removeChild(notification);
        });
        
        // Handle emote selection
        const emotes = notification.querySelectorAll('.emote-option');
        emotes.forEach(emote => {
            emote.addEventListener('click', () => {
                // In a real app, this would submit the emote to the server
                alert(`You left a ${emote.textContent} impression!`);
                document.body.removeChild(notification);
            });
        });
    }, 5000);
}

// Run streetpass after a delay
setTimeout(setupStreetpass, 3000);

// Add CSS-based scanlines overlay for retro effect
function addRetroCRTEffect() {
    const overlay = document.createElement('div');
    overlay.classList.add('crt-overlay');
    document.body.appendChild(overlay);
}

// Call this function to enable the CRT effect
// Commented out by default as it can be distracting
// addRetroCRTEffect();
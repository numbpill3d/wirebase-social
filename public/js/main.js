/**
 * Wirebase - Main JavaScript
 * Enhances the medieval dungeon + Windows 98 experience with interactive elements
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Windows 98 UI elements
    setupWindows98Elements();
    
    // Setup medieval fantasy effects
    setupMedievalEffects();
    
    // Initialize terminal mode
    setupTerminalMode();
    
    // Streetpass system
    setupStreetpass();
    
    // Add CRT screen effect
    setupCRTEffect();
    
    // Show loading screen on initial load
    if (!sessionStorage.getItem('initialLoadComplete')) {
        showLoadingScreen();
        sessionStorage.setItem('initialLoadComplete', 'true');
    }
    
    // Detect browser to offer appropriate UI skin
    detectBrowserForSkin();
});

/**
 * Setup Windows 98 interface elements
 */
function setupWindows98Elements() {
    // Setup window controls
    const windowControls = document.querySelectorAll('.win98-window-control');
    
    windowControls.forEach(control => {
        control.addEventListener('mousedown', function(e) {
            playSound('click');
            
            const windowElement = this.closest('.win98-window');
            const controlText = this.textContent.trim();
            
            // Handle window control actions
            if (controlText === '×' || this.classList.contains('close')) {
                // Minimize for demo purposes
                if (windowElement.classList.contains('demo-window')) {
                    windowElement.style.height = '22px';
                    windowElement.querySelector('.win98-window-content').style.display = 'none';
                    // Toggle minimize control to restore
                    const minimizeControl = Array.from(windowElement.querySelectorAll('.win98-window-control')).find(c => c.textContent.trim() === '_');
                    if (minimizeControl) {
                        minimizeControl.setAttribute('data-state', 'restore');
                    }
                } else if (this.classList.contains('close-flash')) {
                    // Remove flash message
                    const flashMessage = this.closest('.flash-message');
                    if (flashMessage) {
                        fadeOutElement(flashMessage, function() {
                            flashMessage.remove();
                        });
                    }
                } else {
                    // Fade out and remove for non-demo windows
                    fadeOutElement(windowElement);
                }
            } else if (controlText === '_' || this.classList.contains('minimize')) {
                // Toggle content display
                const content = windowElement.querySelector('.win98-window-content');
                if (content) {
                    content.style.display = content.style.display === 'none' ? '' : 'none';
                }
            } else if (controlText === '□' || this.classList.contains('maximize')) {
                // Toggle maximize class
                windowElement.classList.toggle('maximized');
                if (windowElement.classList.contains('maximized')) {
                    windowElement.setAttribute('data-original-width', windowElement.style.width || '');
                    windowElement.setAttribute('data-original-height', windowElement.style.height || '');
                    windowElement.style.width = '100%';
                    windowElement.style.height = 'calc(100vh - 100px)';
                } else {
                    windowElement.style.width = windowElement.getAttribute('data-original-width') || '';
                    windowElement.style.height = windowElement.getAttribute('data-original-height') || '';
                }
            }
        });
    });
    
    // Setup Windows 98 buttons
    const win98Buttons = document.querySelectorAll('.win98-button');
    
    win98Buttons.forEach(button => {
        button.addEventListener('mousedown', function() {
            this.classList.add('active');
            playSound('click');
        });
        
        button.addEventListener('mouseup', function() {
            this.classList.remove('active');
        });
        
        button.addEventListener('mouseleave', function() {
            this.classList.remove('active');
        });
    });
    
    // Make windows draggable
    const draggableWindows = document.querySelectorAll('.win98-window.draggable');
    
    draggableWindows.forEach(window => {
        const header = window.querySelector('.win98-window-header');
        if (header) {
            makeDraggable(window, header);
        }
    });
    
    // Add pixelation to appropriate images
    const pixelImages = document.querySelectorAll('.pixel-image, .pixel-art, img.pixel');
    pixelImages.forEach(img => {
        img.style.imageRendering = 'pixelated';
    });
    
    // Setup flash messages auto-dismiss
    const flashMessages = document.querySelectorAll('.flash-message');
    flashMessages.forEach(message => {
        setTimeout(() => {
            fadeOutElement(message, () => message.remove());
        }, 5000);
        
        const closeBtn = message.querySelector('.close-flash');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                fadeOutElement(message, () => message.remove());
            });
        }
    });
}

/**
 * Make an element draggable by its handle
 */
function makeDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    handle.style.cursor = 'url("/images/cursors/move.cur"), move';
    
    handle.onmousedown = dragMouseDown;
    
    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // Get the mouse cursor position at startup
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        // Add active state
        element.classList.add('dragging');
        
        // Set z-index to bring window to front
        element.style.zIndex = getHighestZIndex() + 1;
        
        // Stop mouse tracking when released
        document.onmouseup = closeDragElement;
        // Call function on mouse move
        document.onmousemove = elementDrag;
    }
    
    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        
        // Calculate the new cursor position
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        // Set the element's new position
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }
    
    function closeDragElement() {
        // Remove active state
        element.classList.remove('dragging');
        
        // Stop moving when mouse button is released
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

/**
 * Get highest z-index of windows for layering
 */
function getHighestZIndex() {
    let elements = document.querySelectorAll('.win98-window');
    let highest = 0;
    
    elements.forEach(el => {
        const zIndex = parseInt(window.getComputedStyle(el).zIndex) || 0;
        if (zIndex > highest) {
            highest = zIndex;
        }
    });
    
    return highest;
}

/**
 * Setup medieval fantasy effects throughout the UI
 */
function setupMedievalEffects() {
    // Animate torches
    const torches = document.querySelectorAll('.torch');
    torches.forEach(torch => {
        // Dynamic flicker properties
        const flameIntensity = Math.random() * 0.2 + 0.8;
        const flickerSpeed = Math.random() * 1000 + 2000;
        
        // Set custom properties
        torch.style.setProperty('--flame-intensity', flameIntensity);
        torch.style.setProperty('--flicker-speed', `${flickerSpeed}ms`);
    });
    
    // Add floating effect to important elements
    const floatingElements = document.querySelectorAll('.float, .category-icon, .hero h1');
    floatingElements.forEach(el => {
        const delay = Math.random() * 2;
        el.style.animation = `floating 3s ease-in-out ${delay}s infinite`;
    });
    
    // Add dynamic shadows to headers
    const headers = document.querySelectorAll('h1, h2, h3');
    headers.forEach(header => {
        header.addEventListener('mouseover', function() {
            this.style.textShadow = `2px 2px 4px rgba(0, 0, 0, 0.7), 0 0 15px rgba(255, 215, 0, 0.5)`;
        });
        
        header.addEventListener('mouseout', function() {
            this.style.textShadow = '';
        });
    });
    
    // Create dust particles in the background
    createDustParticles();
    
    // Add page transition effects
    document.querySelectorAll('a:not([data-no-transition])').forEach(link => {
        if (link.href && link.href.indexOf(window.location.hostname) !== -1) {
            link.addEventListener('click', function(e) {
                const target = e.currentTarget.getAttribute('target');
                if (!target || target !== '_blank') {
                    e.preventDefault();
                    playSound('click');
                    
                    const transition = document.createElement('div');
                    transition.className = 'page-transition';
                    document.body.appendChild(transition);
                    
                    setTimeout(() => {
                        window.location.href = this.href;
                    }, 300);
                }
            });
        }
    });
}

/**
 * Create floating dust particles in the background
 */
function createDustParticles() {
    const container = document.createElement('div');
    container.className = 'dust-container';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.overflow = 'hidden';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '-1';
    
    document.body.appendChild(container);
    
    for (let i = 0; i < 50; i++) {
        createDustParticle(container);
    }
}

/**
 * Create an individual dust particle
 */
function createDustParticle(container) {
    const particle = document.createElement('div');
    
    // Random properties
    const size = Math.random() * 3 + 1;
    const posX = Math.random() * 100;
    const posY = Math.random() * 100;
    const opacity = Math.random() * 0.3 + 0.1;
    const duration = Math.random() * 60 + 30;
    const delay = Math.random() * 10;
    
    // Style the particle
    particle.style.position = 'absolute';
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.borderRadius = '50%';
    particle.style.backgroundColor = '#ffd700';
    particle.style.left = `${posX}%`;
    particle.style.top = `${posY}%`;
    particle.style.opacity = opacity;
    particle.style.boxShadow = '0 0 3px rgba(255, 215, 0, 0.5)';
    particle.style.animation = `float-dust ${duration}s linear ${delay}s infinite`;
    
    container.appendChild(particle);
    
    // Add keyframe animation if not already added
    if (!document.querySelector('#dust-animation')) {
        const style = document.createElement('style');
        style.id = 'dust-animation';
        style.textContent = `
            @keyframes float-dust {
                0% {
                    transform: translate(0, 0);
                }
                25% {
                    transform: translate(${Math.random() * 20 - 10}px, ${Math.random() * 20 - 10}px);
                }
                50% {
                    transform: translate(${Math.random() * 30 - 15}px, ${Math.random() * 30 - 15}px);
                }
                75% {
                    transform: translate(${Math.random() * 20 - 10}px, ${Math.random() * 20 - 10}px);
                }
                100% {
                    transform: translate(0, 0);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Setup terminal mode functionality
 */
function setupTerminalMode() {
    // Check if terminal container exists
    const terminal = document.querySelector('.terminal-content');
    if (!terminal) return;
    
    const input = document.querySelector('.terminal-input');
    if (!input) return;
    
    // Focus the input field
    setTimeout(() => {
        if (input) input.focus();
    }, 500);
    
    // Blinking cursor effect
    const cursorSpan = document.querySelector('.cursor');
    if (cursorSpan) {
        setInterval(() => {
            cursorSpan.style.visibility = cursorSpan.style.visibility === 'hidden' ? 'visible' : 'hidden';
        }, 500);
    }
    
    // React to input events
    if (input) {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const command = this.value.trim();
                processTerminalCommand(command, terminal);
                this.value = '';
            }
        });
    }
    
    // Check for demo terminal on homepage
    const demoTerminal = document.querySelector('.terminal-preview .terminal-content');
    if (demoTerminal) {
        const typewriterLines = [
            "edit profile.html",
            "Opening file for editing...",
            "",
            "<div class='medieval-header'>",
            "  <h1>Welcome to my Dungeon</h1>",
            "  <p>This realm is mine to control</p>",
            "</div>",
            "",
            ":wq",
            "File saved! Updating preview..."
        ];
        
        let lineIndex = 0;
        let charIndex = 0;
        let currentLine = '';
        let typing = false;
        
        function typeNextCharacter() {
            if (lineIndex >= typewriterLines.length) {
                return;
            }
            
            if (!typing) {
                currentLine = "";
                typing = true;
            }
            
            if (charIndex < typewriterLines[lineIndex].length) {
                currentLine += typewriterLines[lineIndex].charAt(charIndex);
                demoTerminal.innerHTML = currentLine + '<span class="cursor">_</span>';
                charIndex++;
                setTimeout(typeNextCharacter, Math.random() * 50 + 50);
            } else {
                demoTerminal.innerHTML = currentLine + '<br>' + '<span class="cursor">_</span>';
                typing = false;
                charIndex = 0;
                lineIndex++;
                
                if (lineIndex < typewriterLines.length) {
                    setTimeout(typeNextCharacter, Math.random() * 300 + 800);
                }
            }
        }
        
        // Start typing effect after a delay
        setTimeout(typeNextCharacter, 2000);
    }
}

/**
 * Process a command entered in the terminal
 */
function processTerminalCommand(command, terminal) {
    // Add command to output history
    addTerminalOutput(`<span class="terminal-prompt">[user@wirebase]&gt; </span>${command}`);
    
    // Process commands
    if (command === 'help') {
        addTerminalOutput('Available commands:');
        addTerminalOutput('  help - Display this help message');
        addTerminalOutput('  edit [html|css] - Edit your profile HTML/CSS');
        addTerminalOutput('  view [html|css] - View your current HTML/CSS code');
        addTerminalOutput('  clear - Clear the terminal');
        addTerminalOutput('  ls - List available files');
        addTerminalOutput('  whoami - Display your user info');
        addTerminalOutput('  exit - Exit terminal mode');
    } else if (command === 'clear') {
        terminal.innerHTML = '';
    } else if (command.startsWith('edit ')) {
        const type = command.split(' ')[1];
        if (type === 'html' || type === 'css') {
            addTerminalOutput(`Editing ${type.toUpperCase()}. Type your code, then :wq to save.`);
            addTerminalOutput(`--- ${type.toUpperCase()} EDIT MODE ---`);
            
            // In a real app, this would activate edit mode
            terminal.dataset.editMode = type;
        } else {
            addTerminalOutput(`Unknown file type. Use 'edit html' or 'edit css'.`);
        }
    } else if (command === 'ls') {
        addTerminalOutput('profile.html');
        addTerminalOutput('style.css');
        addTerminalOutput('visitors.log');
    } else if (command === 'whoami') {
        const username = document.querySelector('.user-name')?.textContent || 'Guest';
        addTerminalOutput(`You are logged in as: ${username}`);
    } else if (command === 'exit') {
        addTerminalOutput('Exiting terminal mode...');
        setTimeout(() => {
            window.location.href = '/profile';
        }, 1000);
    } else if (command === ':wq' || command === ':save') {
        const editMode = terminal.dataset.editMode;
        if (editMode) {
            addTerminalOutput(`Saving ${editMode.toUpperCase()} changes...`);
            addTerminalOutput('Changes saved successfully!');
            terminal.dataset.editMode = '';
        } else {
            addTerminalOutput('Not in edit mode. Use "edit html" or "edit css" first.');
        }
    } else {
        addTerminalOutput(`Command not recognized: ${command}`);
        addTerminalOutput('Type "help" for available commands.');
    }
    
    // Scroll to bottom
    terminal.scrollTop = terminal.scrollHeight;
}

/**
 * Add a line of output to the terminal
 */
function addTerminalOutput(text) {
    const terminal = document.querySelector('.terminal-content');
    if (!terminal) return;
    
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.innerHTML = text;
    
    terminal.appendChild(line);
    
    // Scroll to bottom
    terminal.scrollTop = terminal.scrollHeight;
}

/**
 * Setup the Streetpass visitor tracking system
 */
function setupStreetpass() {
    // Find Streetpass widgets
    const widgets = document.querySelectorAll('streetpass-widget, .streetpass-widget');
    
    if (widgets.length === 0) return;
    
    // In a real app, we'd record the visit to the profile via API call
    // For demo purposes, we'll show a notification after a delay
    const isNewVisit = Math.random() > 0.3; // 70% chance of being a "new" visit
    
    if (isNewVisit && Math.random() > 0.5) { // 50% chance to show notification
        setTimeout(showStreetpassNotification, 10000);
    }
}

/**
 * Show a Streetpass notification when visiting a profile
 */
function showStreetpassNotification() {
    // Check if we're on a profile page
    const profilePage = document.querySelector('.profile-container, .profile-view, .profile-preview');
    if (!profilePage) return;
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'win98-window streetpass-notification';
    notification.innerHTML = `
        <div class="win98-window-header">
            <span class="win98-window-title">Streetpass</span>
            <div class="win98-window-controls">
                <span class="win98-window-control close">×</span>
            </div>
        </div>
        <div class="win98-window-content">
            <p>Your visit has been recorded!</p>
            <p>Leave an impression:</p>
            <div class="emote-selection">
                <button class="emote-option">👋</button>
                <button class="emote-option">👍</button>
                <button class="emote-option">🔥</button>
                <button class="emote-option">🧙</button>
                <button class="emote-option">⚔️</button>
                <button class="emote-option">🛡️</button>
            </div>
        </div>
    `;
    
    // Style the notification
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.width = '250px';
    notification.style.zIndex = '9999';
    notification.style.animation = 'slide-in 0.3s ease';
    
    document.body.appendChild(notification);
    
    // Add event listeners
    notification.querySelector('.close').addEventListener('click', () => {
        fadeOutElement(notification, () => notification.remove());
    });
    
    // Add emote selection
    const emoteButtons = notification.querySelectorAll('.emote-option');
    emoteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const emote = button.textContent;
            recordEmote(emote);
            playSound('click');
            fadeOutElement(notification, () => notification.remove());
            
            // Show confirmation
            showEmoteConfirmation(emote);
        });
    });
    
    // Auto-dismiss after 15 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            fadeOutElement(notification, () => notification.remove());
        }
    }, 15000);
}

/**
 * Record an emote for the Streetpass system
 */
function recordEmote(emote) {
    // In a real app, this would send the data to the server
    console.log(`Recorded emote: ${emote}`);
    
    // Show notification that emote was recorded
    const toast = document.createElement('div');
    toast.className = 'emote-toast';
    toast.innerHTML = `
        <div class="emote-icon">${emote}</div>
        <div class="emote-message">Impression recorded!</div>
    `;
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

/**
 * Show emote confirmation animation
 */
function showEmoteConfirmation(emote) {
    const confirmation = document.createElement('div');
    confirmation.className = 'emote-confirmation';
    confirmation.textContent = emote;
    
    document.body.appendChild(confirmation);
    
    // Animate and remove
    setTimeout(() => {
        confirmation.classList.add('fade-out');
        setTimeout(() => confirmation.remove(), 500);
    }, 1500);
}

/**
 * Setup CRT screen effect for retro look
 */
function setupCRTEffect() {
    // Check if CRT effect is enabled in settings
    const crtEnabled = localStorage.getItem('crtEffect') !== 'disabled';
    
    if (crtEnabled) {
        addCRTEffect();
    }
    
    // Add toggle in user settings
    const settingsForm = document.querySelector('.settings-form');
    if (settingsForm) {
        const crtToggle = document.createElement('div');
        crtToggle.className = 'settings-option';
        crtToggle.innerHTML = `
            <label for="crt-effect">
                <input type="checkbox" id="crt-effect" class="win98-checkbox" ${crtEnabled ? 'checked' : ''}>
                Enable CRT screen effect
            </label>
        `;
        
        settingsForm.appendChild(crtToggle);
        
        // Add event listener
        const checkbox = crtToggle.querySelector('#crt-effect');
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                localStorage.setItem('crtEffect', 'enabled');
                addCRTEffect();
            } else {
                localStorage.setItem('crtEffect', 'disabled');
                removeCRTEffect();
            }
        });
    }
}

/**
 * Add CRT screen effect to the page
 */
function addCRTEffect() {
    if (document.querySelector('.crt-effect')) return;
    
    const crtEffect = document.createElement('div');
    crtEffect.className = 'crt-effect';
    
    document.body.appendChild(crtEffect);
}

/**
 * Remove CRT screen effect from the page
 */
function removeCRTEffect() {
    const crtEffect = document.querySelector('.crt-effect');
    if (crtEffect) {
        crtEffect.remove();
    }
}

/**
 * Show a Windows 98-style loading screen
 */
function showLoadingScreen() {
    const loadingScreen = document.createElement('div');
    loadingScreen.className = 'loading-screen';
    loadingScreen.innerHTML = `
        <div class="loading-window">
            <div class="loading-header">
                Wirebase Loading...
            </div>
            <div class="loading-content">
                <p>Loading medieval dungeon experience...</p>
                <div class="loading-bar-container">
                    <div class="loading-bar"></div>
                </div>
                <p class="loading-status">Please wait...</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(loadingScreen);
    
    // Update loading messages
    const statusMessages = [
        'Forging medieval components...',
        'Brewing digital potions...',
        'Summoning pixel creatures...',
        'Activating Windows 98 crystals...',
        'Casting UI spells...',
        'Awakening ancient code...',
        'Initializing dungeon servers...',
        'Preparing your experience...'
    ];
    
    const statusElement = loadingScreen.querySelector('.loading-status');
    let messageIndex = 0;
    
    const messageInterval = setInterval(() => {
        statusElement.textContent = statusMessages[messageIndex];
        messageIndex = (messageIndex + 1) % statusMessages.length;
    }, 1500);
    
    // Remove loading screen after delay
    setTimeout(() => {
        clearInterval(messageInterval);
        loadingScreen.style.opacity = '0';
        setTimeout(() => loadingScreen.remove(), 1000);
    }, 6000);
}

/**
 * Detect browser and offer appropriate UI skin
 */
function detectBrowserForSkin() {
    // Get browser name and offer appropriate skin
    const browser = getBrowserName();
    
    // Skip if UI skin already chosen
    if (localStorage.getItem('browserSkin')) return;
    
    // Check if UI skin selector element exists
    const skinSelector = document.querySelector('.browser-skin-selector');
    if (skinSelector) return;
    
    // Show browser skin selector after a delay
    setTimeout(() => {
        // Create browser skin selector
        const skinSelector = document.createElement('div');
        skinSelector.className = 'win98-window browser-skin-selector';
        skinSelector.innerHTML = `
            <div class="win98-window-header">
                <span class="win98-window-title">Select Browser Skin</span>
                <div class="win98-window-controls">
                    <span class="win98-window-control close">×</span>
                </div>
            </div>
            <div class="win98-window-content">
                <p>Choose a retro browser skin:</p>
                <div class="skin-options">
                    <button data-skin="netscape" class="win98-button skin-option">
                        <img src="/images/netscape-icon.png" alt="Netscape" class="pixel-image">
                        <span>Netscape Navigator</span>
                    </button>
                    <button data-skin="ie5" class="win98-button skin-option">
                        <img src="/images/ie-icon.png" alt="IE5" class="pixel-image">
                        <span>Internet Explorer 5</span>
                    </button>
                    <button data-skin="lynx" class="win98-button skin-option">
                        <img src="/images/lynx-icon.png" alt="Lynx" class="pixel-image">
                        <span>Lynx Text Browser</span>
                    </button>
                </div>
                <button class="win98-button skip-button">Skip/Default</button>
            </div>
        `;
        
        // Style the selector
        skinSelector.style.position = 'fixed';
        skinSelector.style.top = '50%';
        skinSelector.style.left = '50%';
        skinSelector.style.transform = 'translate(-50%, -50%)';
        skinSelector.style.zIndex = '9999';
        skinSelector.style.width = '350px';
        
        document.body.appendChild(skinSelector);
        
        // Add event listeners
        skinSelector.querySelector('.close').addEventListener('click', () => {
            fadeOutElement(skinSelector, () => skinSelector.remove());
        });
        
        skinSelector.querySelector('.skip-button').addEventListener('click', () => {
            localStorage.setItem('browserSkin', 'default');
            fadeOutElement(skinSelector, () => skinSelector.remove());
        });
        
        // Skin options
        const skinOptions = skinSelector.querySelectorAll('.skin-option');
        skinOptions.forEach(option => {
            option.addEventListener('click', () => {
                const skin = option.getAttribute('data-skin');
                applySkin(skin);
                localStorage.setItem('browserSkin', skin);
                fadeOutElement(skinSelector, () => skinSelector.remove());
            });
        });
    }, 20000); // Show after 20 seconds
}

/**
 * Apply browser skin to the UI
 */
function applySkin(skin) {
    // Remove existing skin
    document.querySelectorAll('.browser-skin-frame, .browser-skin-overlay').forEach(el => el.remove());
    
    switch (skin) {
        case 'netscape':
            applyNetscapeSkin();
            break;
        case 'ie5':
            applyIESkin();
            break;
        case 'lynx':
            applyLynxSkin();
            break;
        default:
            // Default skin (no changes)
            break;
    }
}

/**
 * Apply Netscape Navigator skin
 */
function applyNetscapeSkin() {
    // Add Netscape frame
    const frame = document.createElement('div');
    frame.className = 'browser-skin-frame netscape-frame';
    
    // Add frame HTML
    frame.innerHTML = `
        <div class="browser-title-bar">
            <div class="browser-title">Netscape Navigator - Wirebase</div>
            <div class="browser-controls">
                <button class="browser-control">_</button>
                <button class="browser-control">□</button>
                <button class="browser-control">×</button>
            </div>
        </div>
        <div class="browser-toolbar">
            <button class="browser-button">Back</button>
            <button class="browser-button">Forward</button>
            <button class="browser-button">Reload</button>
            <button class="browser-button">Home</button>
            <div class="browser-address-bar">https://wirebase.com/</div>
        </div>
    `;
    
    // Insert at top of body
    document.body.insertBefore(frame, document.body.firstChild);
    
    // Add Netscape style overlay
    const style = document.createElement('style');
    style.className = 'browser-skin-overlay';
    style.textContent = `
        body {
            background-color: #c0c0c0 !important;
            padding-top: 60px !important;
        }
        
        .browser-skin-frame {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            z-index: 9998;
        }
        
        .browser-title-bar {
            background-color: #000080;
            color: white;
            display: flex;
            justify-content: space-between;
            padding: 3px 5px;
        }
        
        .browser-toolbar {
            background-color: #c0c0c0;
            padding: 5px;
            display: flex;
            align-items: center;
        }
        
        .browser-button {
            margin-right: 5px;
            background-color: #c0c0c0;
            border: 2px solid;
            border-color: #ffffff #808080 #808080 #ffffff;
            padding: 2px 5px;
            font-size: 12px;
        }
        
        .browser-address-bar {
            flex-grow: 1;
            background-color: white;
            border: 2px solid;
            border-color: #808080 #ffffff #ffffff #808080;
            padding: 2px 5px;
            margin-left: 10px;
        }
    `;
    
    document.head.appendChild(style);
}

/**
 * Apply Internet Explorer 5 skin
 */
function applyIESkin() {
    // Similar to Netscape but with IE styling
    const frame = document.createElement('div');
    frame.className = 'browser-skin-frame ie-frame';
    
    // Add frame HTML - similar to Netscape but with IE styling
    frame.innerHTML = `
        <div class="browser-title-bar">
            <img src="/images/ie-icon-small.png" class="browser-icon pixel-image">
            <div class="browser-title">Microsoft Internet Explorer - Wirebase</div>
            <div class="browser-controls">
                <button class="browser-control">_</button>
                <button class="browser-control">□</button>
                <button class="browser-control">×</button>
            </div>
        </div>
        <div class="browser-toolbar">
            <button class="browser-button">Back</button>
            <button class="browser-button">Forward</button>
            <button class="browser-button">Stop</button>
            <button class="browser-button">Refresh</button>
            <button class="browser-button">Home</button>
            <div class="browser-address-bar">https://wirebase.com/</div>
            <button class="browser-button">Go</button>
        </div>
    `;
    
    // Insert at top of body
    document.body.insertBefore(frame, document.body.firstChild);
    
    // Add IE style overlay
    const style = document.createElement('style');
    style.className = 'browser-skin-overlay';
    style.textContent = `
        body {
            background-color: #c0c0c0 !important;
            padding-top: 60px !important;
        }
        
        .browser-skin-frame {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            z-index: 9998;
        }
        
        .browser-title-bar {
            background: linear-gradient(to right, #1084d0, #5a73b8) !important;
            color: white;
            display: flex;
            justify-content: space-between;
            padding: 3px 5px;
            align-items: center;
        }
        
        .browser-icon {
            width: 16px;
            height: 16px;
            margin-right: 5px;
        }
        
        .browser-toolbar {
            background-color: #c0c0c0;
            padding: 5px;
            display: flex;
            align-items: center;
        }
        
        .browser-button {
            margin-right: 5px;
            background-color: #c0c0c0;
            border: 2px solid;
            border-color: #ffffff #808080 #808080 #ffffff;
            padding: 2px 5px;
            font-size: 12px;
        }
        
        .browser-address-bar {
            flex-grow: 1;
            background-color: white;
            border: 2px solid;
            border-color: #808080 #ffffff #ffffff #808080;
            padding: 2px 5px;
            margin: 0 5px;
        }
    `;
    
    document.head.appendChild(style);
}

/**
 * Apply Lynx text browser skin
 */
function applyLynxSkin() {
    // Apply text-only browser appearance
    const style = document.createElement('style');
    style.className = 'browser-skin-overlay';
    style.textContent = `
        body {
            background-color: #000000 !important;
            color: #00ff00 !important;
            font-family: 'VT323', monospace !important;
            line-height: 1.3 !important;
        }
        
        * {
            background-color: #000000 !important;
            color: #00ff00 !important;
            font-family: 'VT323', monospace !important;
            border-color: #00ff00 !important;
            text-shadow: none !important;
            box-shadow: none !important;
        }
        
        img, video, iframe {
            display: none !important;
        }
        
        a {
            color: #ffff00 !important;
            text-decoration: underline !important;
        }
        
        h1, h2, h3, h4, h5, h6 {
            text-transform: uppercase !important;
        }
        
        .win98-window {
            border: 1px solid #00ff00 !important;
        }
        
        .win98-window-header {
            background-color: #005500 !important;
        }
        
        .win98-button {
            border: 1px solid #00ff00 !important;
        }
    `;
    
    document.head.appendChild(style);
    
    // Add termimal header
    const frame = document.createElement('div');
    frame.className = 'browser-skin-frame lynx-frame';
    frame.innerHTML = `
        <div class="lynx-header">
            <div class="lynx-title">Lynx Line Mode Browser - Wirebase</div>
            <div class="lynx-url">URL: https://wirebase.com/</div>
        </div>
        <div class="lynx-toolbar">
            <span>Commands: Use arrow keys to move, Enter to follow links, q to quit</span>
        </div>
    `;
    
    // Style the frame
    const frameStyle = document.createElement('style');
    frameStyle.className = 'browser-skin-overlay';
    frameStyle.textContent = `
        .lynx-header {
            background-color: #000000 !important;
            color: #00ff00 !important;
            padding: 5px !important;
            border-bottom: 1px solid #00ff00 !important;
        }
        
        .lynx-toolbar {
            background-color: #000000 !important;
            color: #00ff00 !important;
            padding: 5px !important;
            border-bottom: 1px solid #00ff00 !important;
            font-size: 14px !important;
        }
        
        .lynx-frame {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            z-index: 9998 !important;
        }
        
        body {
            padding-top: 60px !important;
        }
    `;
    
    document.head.appendChild(frameStyle);
    document.body.insertBefore(frame, document.body.firstChild);
}

/**
 * Get browser name
 */
function getBrowserName() {
    const userAgent = navigator.userAgent;
    let browserName;
    
    if (userAgent.match(/chrome|chromium|crios/i)) {
        browserName = "Chrome";
    } else if (userAgent.match(/firefox|fxios/i)) {
        browserName = "Firefox";
    } else if (userAgent.match(/safari/i)) {
        browserName = "Safari";
    } else if (userAgent.match(/opr\//i)) {
        browserName = "Opera";
    } else if (userAgent.match(/edg/i)) {
        browserName = "Edge";
    } else {
        browserName = "Unknown";
    }
    
    return browserName;
}

/**
 * Add custom cursors based on theme
 */
function setupCustomCursors() {
    const theme = document.body.classList.contains('theme-dungeon') ? 'dungeon' : 'windows';
    
    if (theme === 'dungeon') {
        document.body.style.cursor = `url('/images/cursors/dungeon-normal.cur'), auto`;
        
        // Add style for cursors
        const cursorStyle = document.createElement('style');
        cursorStyle.textContent = `
            a, button, .win98-button, .clickable { 
                cursor: url('/images/cursors/dungeon-pointer.cur'), pointer !important; 
            }
            input[type="text"], textarea { 
                cursor: url('/images/cursors/dungeon-text.cur'), text !important; 
            }
        `;
        document.head.appendChild(cursorStyle);
    }
}

/**
 * Play a sound effect
 */
function playSound(sound) {
    // Check if sound is enabled in settings
    const soundEnabled = localStorage.getItem('soundEffects') !== 'disabled';
    if (!soundEnabled) return;
    
    // Sound effect URLs
    const sounds = {
        click: '/sounds/click.mp3',
        error: '/sounds/error.mp3',
        notify: '/sounds/notify.mp3',
        startup: '/sounds/startup.mp3'
    };
    
    // Play the sound if it exists
    if (sounds[sound]) {
        const audio = new Audio(sounds[sound]);
        audio.volume = 0.5; // 50% volume
        audio.play().catch(e => console.log('Sound playback prevented:', e));
    }
}

/**
 * Fade out an element and optionally remove it
 */
function fadeOutElement(element, callback) {
    element.style.transition = 'opacity 0.3s ease-out';
    element.style.opacity = '0';
    
    setTimeout(() => {
        if (callback) callback();
    }, 300);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setupWindows98Elements();
    setupMedievalEffects();
    setupCustomCursors();
    
    // Play startup sound if first time
    if (!sessionStorage.getItem('startupSoundPlayed')) {
        setTimeout(() => {
            playSound('startup');
            sessionStorage.setItem('startupSoundPlayed', 'true');
        }, 1000);
    }
});
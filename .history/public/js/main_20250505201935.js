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

    // Add corner torches for ambient lighting
    addCornerTorches();

    // Setup visitor tracking system
    setupVisitorTraces();

    // Show loading screen on initial load
    if (!sessionStorage.getItem('initialLoadComplete')) {
        showLoadingScreen();
        sessionStorage.setItem('initialLoadComplete', 'true');
    }

    // Apply CRT bootup effect to windows
    setupCRTBootEffect();
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
                // Handle close button
                if (windowElement.classList.contains('demo-window')) {
                    // For demo windows, just minimize
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
                    // For regular windows, toggle content visibility
                    const content = windowElement.querySelector('.win98-window-content');
                    if (content) {
                        content.style.display = content.style.display === 'none' ? 'block' : 'none';
                    }
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

                // Get the parent container to maximize within
                const container = windowElement.closest('.container') || document.body;

                if (windowElement.classList.contains('maximized')) {
                    // Save original dimensions
                    windowElement.setAttribute('data-original-width', windowElement.style.width || '');
                    windowElement.setAttribute('data-original-height', windowElement.style.height || '');
                    windowElement.setAttribute('data-original-position', windowElement.style.position || '');
                    windowElement.setAttribute('data-original-top', windowElement.style.top || '');
                    windowElement.setAttribute('data-original-left', windowElement.style.left || '');
                    windowElement.setAttribute('data-original-z-index', windowElement.style.zIndex || '');

                    // Set maximized dimensions and position
                    windowElement.style.width = '100%';
                    windowElement.style.height = 'calc(100vh - 100px)';
                    windowElement.style.position = 'fixed';
                    windowElement.style.top = '50px';
                    windowElement.style.left = '0';
                    windowElement.style.zIndex = '9999';
                } else {
                    // Restore original dimensions and position
                    windowElement.style.width = windowElement.getAttribute('data-original-width') || '';
                    windowElement.style.height = windowElement.getAttribute('data-original-height') || '';
                    windowElement.style.position = windowElement.getAttribute('data-original-position') || '';
                    windowElement.style.top = windowElement.getAttribute('data-original-top') || '';
                    windowElement.style.left = windowElement.getAttribute('data-original-left') || '';
                    windowElement.style.zIndex = windowElement.getAttribute('data-original-z-index') || '';
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
 *
 * Note: Browser frame functionality has been removed as requested by user
 * since the real browser already provides this functionality
 */
function detectBrowserForSkin() {
    // Function disabled - browser skin functionality removed
    return;
}

// Browser skin-related functions have been removed
// The real browser already provides navigation elements and window controls

/**
 * Add custom cursors based on theme
 * Note: Using standard cursors instead of custom image cursors for better compatibility
 */
function setupCustomCursors() {
    // Use standard cursors for better compatibility
    const cursorStyle = document.createElement('style');
    cursorStyle.textContent = `
        body { cursor: default; }
        a, button, .win98-button, .clickable, .win98-window-control {
            cursor: pointer !important;
        }
        input[type="text"], textarea {
            cursor: text !important;
        }
    `;
    document.head.appendChild(cursorStyle);
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

/**
 * Setup CRT boot effect for windows
 */
function setupCRTBootEffect() {
    // Apply the CRT boot animation to windows when they appear
    const windows = document.querySelectorAll('.win98-window');
    windows.forEach(window => {
        // Add the bootup class that has the animation
        window.classList.add('crt-boot');

        // Add glitching glyph borders to some windows randomly
        if (Math.random() > 0.7) {
            window.classList.add('glyph-border');
        }
    });

    // Apply bootup effects to any new windows that might be created
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(node => {
                    if (node.classList && node.classList.contains('win98-window')) {
                        // Wait a tiny bit so the element is fully in the DOM
                        setTimeout(() => {
                            node.classList.add('crt-boot');
                            if (Math.random() > 0.7) {
                                node.classList.add('glyph-border');
                            }
                        }, 10);
                    }
                });
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

/**
 * Add corner torches for ambient lighting
 */
function addCornerTorches() {
    // Create ambient corner torch effects
    const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

    corners.forEach(corner => {
        const torch = document.createElement('div');
        torch.className = `corner-torch ${corner}`;
        document.body.appendChild(torch);
    });
}

/**
 * Setup visitor traces - phantom footprints system
 */
function setupVisitorTraces() {
    // Create visitor traces container
    const tracesContainer = document.createElement('div');
    tracesContainer.className = 'visitor-traces';
    document.body.appendChild(tracesContainer);

    // Sample visitor data (in a real app, this would come from a database)
    const visitors = [
        { name: 'wanderer-302', glyph: '✧', time: '3 mins ago' },
        { name: 'pixel-knight', glyph: '⚔️', time: '15 mins ago' },
        { name: 'crypt-lurker', glyph: '👁️', time: '42 mins ago' },
        { name: 'ancient-wizard', glyph: '🧙', time: '2 hours ago' },
        { name: 'hex-runner', glyph: '⚡', time: '5 hours ago' }
    ];

    // Show initial traces
    visitors.forEach((visitor, index) => {
        setTimeout(() => {
            addVisitorTrace(visitor, tracesContainer);
        }, index * 2000); // Stagger the appearance
    });

    // Every so often, add a new random visitor
    setInterval(() => {
        if (Math.random() > 0.7) { // 30% chance to add a new visitor
            const randomVisitor = getRandomVisitor();
            addVisitorTrace(randomVisitor, tracesContainer);

            // Limit number of traces shown
            const traces = tracesContainer.querySelectorAll('.visitor-trace');
            if (traces.length > 8) {
                traces[0].remove();
            }
        }
    }, 30000); // Check every 30 seconds
}

/**
 * Add a single visitor trace to the container
 */
function addVisitorTrace(visitor, container) {
    const trace = document.createElement('div');
    trace.className = 'visitor-trace';
    trace.innerHTML = `
        <span class="trace-glyph">${visitor.glyph}</span>
        <span class="trace-name">${visitor.name}</span>
        <span class="trace-time">${visitor.time}</span>
    `;

    container.appendChild(trace);

    // After a while, remove old traces
    setTimeout(() => {
        if (container.contains(trace)) {
            trace.style.opacity = '0';
            setTimeout(() => trace.remove(), 1000);
        }
    }, 60000 + Math.random() * 60000); // Random time between 1-2 minutes
}

/**
 * Generate a random visitor
 */
function getRandomVisitor() {
    const names = ['shadow-walker', 'bit-weaver', 'digital-oracle', 'rune-scribe', 'mist-wanderer', 'echo-hunter'];
    const glyphs = ['✧', '⚔️', '🧙', '👁️', '⚡', '🔮', '🛡️', '🪄'];
    const times = ['just now', '1 min ago', '3 mins ago', '5 mins ago'];

    return {
        name: names[Math.floor(Math.random() * names.length)],
        glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
        time: times[Math.floor(Math.random() * times.length)]
    };
}

// Play startup sound if first time (moved from duplicate event listener)
if (!sessionStorage.getItem('startupSoundPlayed')) {
    setTimeout(() => {
        playSound('startup');
        sessionStorage.setItem('startupSoundPlayed', 'true');
    }, 1000);
}

// Add scroll-triggered animations
const observerOptions = {
  threshold: 0.2,
  rootMargin: '0px 0px -50px 0px'
};

const scrollObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('fade-in-visible');
      scrollObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(el => {
  scrollObserver.observe(el);
});

// Parallax scroll effect for background elements
document.addEventListener('scroll', () => {
  const parallaxElements = document.querySelectorAll('.parallax');
  parallaxElements.forEach(el => {
    const speed = el.dataset.speed || 0.5;
    const yPos = -(window.pageYOffset * speed);
    el.style.transform = `translateY(${yPos}px)`;
  });
});

// Improve keyboard navigation
document.addEventListener('DOMContentLoaded', () => {
  // Add focus indicators
  const focusableElements = document.querySelectorAll(
    'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  focusableElements.forEach(element => {
    element.addEventListener('focus', () => {
      element.classList.add('focus-visible');
    });

    element.addEventListener('blur', () => {
      element.classList.remove('focus-visible');
    });
  });

  // Add keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // ESC key closes modals
    if (e.key === 'Escape') {
      const modals = document.querySelectorAll('.modal[aria-modal="true"]');
      modals.forEach(modal => {
        closeModal(modal);
      });
    }

    // Add more keyboard shortcuts here
  });
});

// Trap focus in modals
function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  element.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      } else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  });
}

// Performance optimizations
document.addEventListener('DOMContentLoaded', function() {
    // Lazy load images
    const lazyImages = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });

    lazyImages.forEach(img => imageObserver.observe(img));

    // Add debounced scroll handler for performance
    const scrollHandler = () => {
        // Handle scroll events in a performance-friendly way
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Add subtle parallax effect to background elements
        document.querySelectorAll('.parallax').forEach(el => {
            const speed = el.dataset.speed || 0.5;
            const yPos = -(scrollTop * speed);
            el.style.transform = `translateY(${yPos}px)`;
        });
    };

    // Throttle scroll events for better performance
    let lastScrollTime = 0;
    window.addEventListener('scroll', () => {
        const now = Date.now();
        if (now - lastScrollTime > 50) { // 50ms throttle
            lastScrollTime = now;
            scrollHandler();
        }
    });

    // Initialize features with performance in mind
    const initializeFeatures = () => {
        setupWindows98Elements();
        setupMedievalEffects();

        // Defer non-critical features
        requestIdleCallback(() => {
            setupTerminalMode();
            setupStreetpass();
        });

        // Load CRT effect only if enabled
        if (window.CRT_EFFECT_ENABLED) {
            import('./crt-effect.js').then(module => module.setupCRTEffect());
        }
    };

    initializeFeatures();
});

// Properly clean up event listeners
class EventManager {
  constructor() {
    this.listeners = new Map();
  }

  addListener(element, event, callback) {
    if (!element) return;

    element.addEventListener(event, callback);

    if (!this.listeners.has(element)) {
      this.listeners.set(element, []);
    }

    this.listeners.get(element).push({ event, callback });
  }

  removeAllListeners() {
    this.listeners.forEach((listeners, element) => {
      listeners.forEach(({ event, callback }) => {
        element.removeEventListener(event, callback);
      });
    });

    this.listeners.clear();
  }
}

// Use in components
const eventManager = new EventManager();

// Clean up when component is destroyed
function destroyComponent() {
  eventManager.removeAllListeners();
}

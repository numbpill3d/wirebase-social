/**
 * wirebase.city - Main JavaScript
 * Enhances the Serial Experiments Lain / cyberschizo experience with interactive elements
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Cyber UI elements
    setupCyberElements();

    // Setup cyberschizo effects
    setupCyberEffects();

    // Initialize terminal interface
    setupTerminalInterface();

    // Connection tracking system
    setupConnectionTracking();

    // Add CRT screen effect
    setupCRTEffect();

    // Add digital noise for ambient effect
    addDigitalNoise();

    // Setup node connection tracking system
    setupConnectionTraces();

    // Show loading screen on initial load
    if (!sessionStorage.getItem('initialLoadComplete')) {
        showLoadingScreen();
        sessionStorage.setItem('initialLoadComplete', 'true');
    }

    // Apply CRT bootup effect to windows
    setupCRTBootEffect();

    // Setup theme toggle
    setupThemeToggle();
});

/**
 * Setup Cyber interface elements
 */
function setupCyberElements() {
    // Setup window controls
    const windowControls = document.querySelectorAll('.cyber-window-control');

    windowControls.forEach(control => {
        control.addEventListener('mousedown', function() {
            playSound('click');

            const windowElement = this.closest('.cyber-window');
            const controlText = this.textContent.trim();

            // Handle window control actions
            if (controlText === '×' || this.classList.contains('close')) {
                // Handle close button
                if (windowElement.classList.contains('demo-window')) {
                    // For demo windows, just minimize
                    windowElement.style.height = '22px';
                    windowElement.querySelector('.cyber-window-content').style.display = 'none';
                    // Toggle minimize control to restore
                    const minimizeControl = Array.from(windowElement.querySelectorAll('.cyber-window-control')).find(c => c.textContent.trim() === '_');
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
                    const content = windowElement.querySelector('.cyber-window-content');
                    if (content) {
                        content.style.display = content.style.display === 'none' ? 'block' : 'none';
                    }
                }
            } else if (controlText === '_' || this.classList.contains('minimize')) {
                // Toggle content display
                const content = windowElement.querySelector('.cyber-window-content');
                if (content) {
                    content.style.display = content.style.display === 'none' ? '' : 'none';
                }
            } else if (controlText === '□' || this.classList.contains('maximize')) {
                // Toggle maximize class
                windowElement.classList.toggle('maximized');

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

    // Setup Cyber buttons
    const cyberButtons = document.querySelectorAll('.cyber-button');

    cyberButtons.forEach(button => {
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

        button.addEventListener('mouseover', function() {
            this.classList.add('glitch');
            setTimeout(() => this.classList.remove('glitch'), 100);
        });
    });

    // Make windows draggable
    const draggableWindows = document.querySelectorAll('.cyber-window.draggable');

    draggableWindows.forEach(window => {
        const header = window.querySelector('.cyber-window-header');
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

    const dragMouseDown = (e) => {
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
    };

    const elementDrag = (e) => {
        e.preventDefault();

        // Calculate the new cursor position
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        // Set the element's new position
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    };

    const closeDragElement = () => {
        // Remove active state
        element.classList.remove('dragging');

        // Stop moving when mouse button is released
        document.onmouseup = null;
        document.onmousemove = null;
    };
}

/**
 * Get highest z-index of windows for layering
 */
function getHighestZIndex() {
    let elements = document.querySelectorAll('.cyber-window');
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
 * Setup cyberschizo effects throughout the UI
 */
function setupCyberEffects() {
    // Animate glitch effects
    const glitchElements = document.querySelectorAll('.glitch-effect');
    glitchElements.forEach(element => {
        // Dynamic glitch properties
        const glitchIntensity = Math.random() * 0.2 + 0.8;
        const glitchSpeed = Math.random() * 1000 + 2000;

        // Set custom properties
        element.style.setProperty('--glitch-intensity', glitchIntensity);
        element.style.setProperty('--glitch-speed', `${glitchSpeed}ms`);
    });

    // Add floating effect to important elements
    const floatingElements = document.querySelectorAll('.float, .category-icon, .hero h1');
    floatingElements.forEach(el => {
        const delay = Math.random() * 2;
        el.style.animation = `floating 3s ease-in-out ${delay}s infinite`;
    });

    // Add dynamic glow to headers
    const headers = document.querySelectorAll('h1, h2, h3');
    headers.forEach(header => {
        header.addEventListener('mouseover', function() {
            this.style.textShadow = `0 0 5px rgba(0, 255, 0, 0.5), 0 0 10px rgba(0, 255, 0, 0.3)`;
        });

        header.addEventListener('mouseout', function() {
            this.style.textShadow = '';
        });
    });

    // Create digital particles in the background
    createDigitalParticles();

    // Temporarily disable custom page transitions to fix navigation issues
    document.querySelectorAll('a:not([data-no-transition])').forEach(link => {
        if (link.href && link.href.indexOf(window.location.hostname) !== -1) {
            console.log('Adding standard navigation to link:', link.href);
            link.addEventListener('click', function() {
                // Don't prevent default - let the browser handle navigation normally
                console.log('Navigation link clicked, using default browser navigation:', this.href);
                try {
                    playSound('click');
                } catch (soundErr) {
                    console.error('Error playing sound:', soundErr);
                }
                // No preventDefault() means normal navigation will occur
            });
        }
    });
}

/**
 * Create floating digital particles in the background
 */
function createDigitalParticles() {
    const container = document.createElement('div');
    container.className = 'digital-particles-container';
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
        createDigitalParticle(container);
    }
}

/**
 * Create an individual digital particle
 */
function createDigitalParticle(container) {
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
    particle.style.backgroundColor = '#00ff00';
    particle.style.left = `${posX}%`;
    particle.style.top = `${posY}%`;
    particle.style.opacity = opacity;
    particle.style.boxShadow = '0 0 3px rgba(0, 255, 0, 0.5)';
    particle.style.animation = `float-digital ${duration}s linear ${delay}s infinite`;

    container.appendChild(particle);

    // Add keyframe animation if not already added
    if (!document.querySelector('#digital-animation')) {
        const style = document.createElement('style');
        style.id = 'digital-animation';
        style.textContent = `
            @keyframes float-digital {
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
 * Setup terminal interface functionality
 */
function setupTerminalInterface() {
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
            "<div class='cyber-header'>",
            "  <h1>Welcome to my cognitive partition</h1>",
            "  <p>This digital shell is mine to control</p>",
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
    addTerminalOutput(`<span class="terminal-prompt">[node_4231@wirebase]&gt; </span>${command}`);

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
        addTerminalOutput('connections.log');
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
 * Setup the connection tracking system
 * This handles visitor tracking for profiles
 */
function setupConnectionTracking() {
    // Find Streetpass widgets
    const widgets = document.querySelectorAll('streetpass-widget, .streetpass-widget');

    if (widgets.length === 0) return;

    // In a real app, we'd record the visit to the profile via API call
    // For demo purposes, we'll show a notification after a delay
    const isNewVisit = Math.random() > 0.3; // 70% chance of being a "new" visit

    if (isNewVisit && Math.random() > 0.5) { // 50% chance to show notification
        setTimeout(showConnectionNotification, 10000);
    }
}

/**
 * Show a connection notification when visiting a profile
 */
function showConnectionNotification() {
    // Check if we're on a profile page
    const profilePage = document.querySelector('.profile-container, .profile-view, .profile-preview');
    if (!profilePage) return;

    // Create notification
    const notification = document.createElement('div');
    notification.className = 'cyber-window connection-notification';
    notification.innerHTML = `
        <div class="cyber-window-header">
            <span class="cyber-window-title">connection.log</span>
            <div class="cyber-window-controls">
                <span class="cyber-window-control close">×</span>
            </div>
        </div>
        <div class="cyber-window-content">
            <p>Your connection has been recorded!</p>
            <p>Transmit signal:</p>
            <div class="emote-selection">
                <button class="emote-option">👁️</button>
                <button class="emote-option">💾</button>
                <button class="emote-option">🔌</button>
                <button class="emote-option">📡</button>
                <button class="emote-option">🖥️</button>
                <button class="emote-option">🕸️</button>
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
        <div class="emote-message">Signal transmitted!</div>
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
                <input type="checkbox" id="crt-effect" class="cyber-checkbox" ${crtEnabled ? 'checked' : ''}>
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
                <div class="loading-title">wirebase.city initializing...</div>
                <div class="cyber-window-controls">
                    <span class="cyber-window-control disabled">_</span>
                    <span class="cyber-window-control disabled">□</span>
                    <span class="cyber-window-control disabled">×</span>
                </div>
            </div>
            <div class="loading-content">
                <div class="loading-icon-container">
                    <img src="/images/wirebase-logo.svg" alt="" class="loading-logo pixel-image" />
                </div>
                <p>Loading cyberschizo experience...</p>
                <div class="loading-bar-container">
                    <div class="loading-bar"></div>
                </div>
                <p class="loading-status">Please wait...</p>
                <div class="loading-ambient-container">
                    <div class="ambient-glitch left"></div>
                    <div class="ambient-glitch right"></div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(loadingScreen);

    // Add animated glitch effect
    const animateGlitches = () => {
        document.querySelectorAll('.ambient-glitch').forEach(glitch => {
            const intensity = 0.8 + (Math.random() * 0.4);
            const hueRotate = Math.random() * 20 - 10;
            glitch.style.filter = `brightness(${intensity}) hue-rotate(${hueRotate}deg)`;
        });

        // Randomize the timing for natural flicker
        setTimeout(animateGlitches, 100 + Math.random() * 200);
    };

    animateGlitches();

    // Add pulsing effect to logo
    const loadingLogo = loadingScreen.querySelector('.loading-logo');
    let pulseDirection = 1;
    let pulseValue = 1;

    const animateLogo = () => {
        pulseValue += 0.01 * pulseDirection;

        if (pulseValue >= 1.1) pulseDirection = -1;
        if (pulseValue <= 0.9) pulseDirection = 1;

        loadingLogo.style.transform = `scale(${pulseValue})`;

        if (document.body.contains(loadingLogo)) {
            requestAnimationFrame(animateLogo);
        }
    };

    requestAnimationFrame(animateLogo);

    // Update loading messages with typewriter effect
    const statusMessages = [
        'Initializing neural interface...',
        'Connecting to the wired...',
        'Synchronizing protocols...',
        'Activating digital nodes...',
        'Compiling system components...',
        'Establishing network links...',
        'Initializing cyberschizo protocols...',
        'Preparing your experience...'
    ];

    const statusElement = loadingScreen.querySelector('.loading-status');
    let messageIndex = 0;
    let charIndex = 0;
    let currentMessage = '';

    const typeWriter = () => {
        if (charIndex < statusMessages[messageIndex].length) {
            currentMessage += statusMessages[messageIndex].charAt(charIndex);
            statusElement.textContent = currentMessage;
            charIndex++;
            setTimeout(typeWriter, 50);
        } else {
            setTimeout(() => {
                charIndex = 0;
                currentMessage = '';
                messageIndex = (messageIndex + 1) % statusMessages.length;
                typeWriter();
            }, 1000);
        }
    };

    typeWriter();

    // Remove loading screen after delay with smooth transition
    setTimeout(() => {
        // Add closing animation class
        loadingScreen.classList.add('closing');

        setTimeout(() => {
            // Fade out after the CRT animation
            loadingScreen.style.opacity = '0';

            setTimeout(() => {
                loadingScreen.remove();

                // Add initialization complete notification
                showSystemNotification('System Initialized', 'Welcome to wirebase.city!');
            }, 1000);
        }, 1000);
    }, 6000);
}

/**
 * Show a Windows 98 style system notification
 */
function showSystemNotification(title, message) {
    const notification = document.createElement('div');
    notification.className = 'cyber-window system-notification';
    notification.innerHTML = `
        <div class="cyber-window-header">
            <span class="cyber-window-title">${title}</span>
            <div class="cyber-window-controls">
                <span class="cyber-window-control close">×</span>
            </div>
        </div>
        <div class="cyber-window-content">
            <div class="notification-content">
                <img src="/images/information.png" alt="" class="notification-icon">
                <p>${message}</p>
            </div>
        </div>
    `;

    // Style the notification
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.width = '280px';
    notification.style.zIndex = '9999';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
    notification.style.transform = 'translateY(100px)';
    notification.style.opacity = '0';
    notification.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease-out';

    document.body.appendChild(notification);

    // Add click handler to close button
    notification.querySelector('.close').addEventListener('click', () => {
        hideNotification();
    });

    // Show notification with animation
    setTimeout(() => {
        notification.style.transform = 'translateY(0)';
        notification.style.opacity = '1';
        playSound('notify');
    }, 100);

    // Auto-dismiss after 5 seconds
    setTimeout(hideNotification, 5000);

    function hideNotification() {
        notification.style.transform = 'translateY(100px)';
        notification.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.remove();
            }
        }, 400);
    }
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
    console.log('playSound called with:', sound);

    // Check if sound is enabled in settings
    const soundEnabled = localStorage.getItem('soundEffects') !== 'disabled';
    if (!soundEnabled) {
        console.log('Sound effects are disabled in settings, returning early');
        return;
    }

    // Sound effect URLs
    const sounds = {
        click: '/sounds/click.mp3',
        error: '/sounds/error.mp3',
        notify: '/sounds/notify.mp3',
        startup: '/sounds/startup.mp3'
    };

    // Play the sound if it exists
    if (sounds[sound]) {
        console.log('Sound exists in library, creating Audio object for:', sounds[sound]);
        try {
            const audio = new Audio(sounds[sound]);
            audio.volume = 0.5; // 50% volume
            console.log('Audio object created, attempting to play...');

            audio.play().catch(e => {
                console.log('Sound playback prevented:', e);
                // Don't show errors for autoplay restrictions - these are expected
                if (!e.message.includes('user didn\'t interact')) {
                    console.error('Showing error toast for sound issue:', e.message);
                    showErrorToast('Sound playback issue: ' + e.message);
                }
            });
        } catch (err) {
            console.error('Error creating Audio object:', err);
        }
    } else {
        console.warn('Sound not found in library:', sound);
    }
}

/**
 * Show an error toast notification to the user
 */
function showErrorToast(message) {
    // Check if a toast container exists
    let toastContainer = document.querySelector('.toast-container');

    // Create container if it doesn't exist
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        toastContainer.style.position = 'fixed';
        toastContainer.style.bottom = '20px';
        toastContainer.style.right = '20px';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }

    // Create toast
    const toast = document.createElement('div');
    toast.className = 'error-toast cyber-window';
    toast.innerHTML = `
        <div class="cyber-window-header">
            <span class="cyber-window-title">system.error</span>
            <div class="cyber-window-controls">
                <span class="cyber-window-control close-toast">×</span>
            </div>
        </div>
        <div class="cyber-window-content">
            ${message}
        </div>
    `;

    // Style the toast
    toast.style.marginBottom = '10px';
    toast.style.minWidth = '250px';
    toast.style.maxWidth = '350px';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = 'opacity 0.3s, transform 0.3s';

    toastContainer.appendChild(toast);

    // Add click handler to close button
    toast.querySelector('.close-toast').addEventListener('click', () => {
        fadeOutElement(toast, () => toast.remove());
    });

    // Animate in
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
        if (document.body.contains(toast)) {
            fadeOutElement(toast, () => toast.remove());
        }
    }, 6000);
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
    const windows = document.querySelectorAll('.cyber-window');
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
                    if (node.classList && node.classList.contains('cyber-window')) {
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
 * Add digital noise for ambient effect
 */
function addDigitalNoise() {
    // Check if effects are already present
    if (!document.querySelector('.digital-noise')) {
        // Create ambient digital noise effect with reduced opacity
        const noise = document.createElement('div');
        noise.className = 'digital-noise';
        noise.style.opacity = '0.03'; // Reduce opacity for less distraction
        document.body.appendChild(noise);
    }

    // Add scanlines if not already present
    if (!document.querySelector('.crt-scanlines')) {
        const scanlines = document.createElement('div');
        scanlines.className = 'crt-scanlines';
        document.body.appendChild(scanlines);
    }

    // Add flicker effect if not already present
    if (!document.querySelector('.crt-flicker')) {
        const flicker = document.createElement('div');
        flicker.className = 'crt-flicker';
        document.body.appendChild(flicker);
    }
}

/**
 * Setup connection traces - phantom connection system
 */
function setupConnectionTraces() {
    // Create connection traces container
    const tracesContainer = document.createElement('div');
    tracesContainer.className = 'connection-traces';
    document.body.appendChild(tracesContainer);

    // Sample connection data (in a real app, this would come from a database)
    const connections = [
        { name: 'node_302', glyph: '👁️', time: '3 mins ago' },
        { name: 'data_node', glyph: '💾', time: '15 mins ago' },
        { name: 'system_admin', glyph: '🔌', time: '42 mins ago' },
        { name: 'protocol_7', glyph: '📡', time: '2 hours ago' },
        { name: 'network_observer', glyph: '🖥️', time: '5 hours ago' }
    ];

    // Show initial traces
    connections.forEach((connection, index) => {
        setTimeout(() => {
            addConnectionTrace(connection, tracesContainer);
        }, index * 2000); // Stagger the appearance
    });

    // Every so often, add a new random visitor
    setInterval(() => {
        if (Math.random() > 0.7) { // 30% chance to add a new visitor
            const randomConnection = getRandomConnection();
            addConnectionTrace(randomConnection, tracesContainer);

            // Limit number of traces shown
            const traces = tracesContainer.querySelectorAll('.connection-trace');
            if (traces.length > 8) {
                traces[0].remove();
            }
        }
    }, 30000); // Check every 30 seconds
}

/**
 * Add a single connection trace to the container
 */
function addConnectionTrace(connection, container) {
    const trace = document.createElement('div');
    trace.className = 'connection-trace';
    trace.innerHTML = `
        <span class="trace-glyph">${connection.glyph}</span>
        <span class="trace-name">${connection.name}</span>
        <span class="trace-time">${connection.time}</span>
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
 * Generate a random connection
 */
function getRandomConnection() {
    const names = ['node_' + Math.floor(Math.random() * 1000), 'data_node', 'system_admin', 'protocol_' + Math.floor(Math.random() * 10), 'network_observer', 'wired_entity'];
    const glyphs = ['👁️', '💾', '🔌', '📡', '🖥️', '🕸️', '📶', '🔋'];
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

/**
 * Setup theme toggle functionality
 */
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        // Check if theme preference is stored
        const isDarkTheme = localStorage.getItem('theme') !== 'light';

        // Apply stored theme preference
        if (!isDarkTheme) {
            document.body.classList.add('light-theme');
            themeToggle.textContent = 'Disconnect';
        } else {
            themeToggle.textContent = 'Reconnect';
        }

        // Add click event listener
        themeToggle.addEventListener('click', function() {
            // Toggle between dark and light theme
            document.body.classList.toggle('light-theme');

            // Update button text
            if (document.body.classList.contains('light-theme')) {
                localStorage.setItem('theme', 'light');
                this.textContent = 'Disconnect';
            } else {
                localStorage.setItem('theme', 'dark');
                this.textContent = 'Reconnect';
            }

            // Toggle CRT effects
            const crtElements = document.querySelectorAll('.crt-scanlines, .crt-flicker, .digital-noise');
            crtElements.forEach(el => {
                el.style.opacity = document.body.classList.contains('light-theme') ? '0.3' : '1';
            });

            // Play sound effect
            playSound('click');
        });
    }
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

// Parallax scroll effect is now handled by the throttled scroll handler

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

    // Cache parallax elements and use requestAnimationFrame for smooth performance
    let parallaxElements = [];
    let ticking = false;
    let lastScrollTop = 0;

    // Get all parallax elements once and cache them
    const cacheParallaxElements = () => {
        parallaxElements = Array.from(document.querySelectorAll('.parallax')).map(el => ({
            element: el,
            speed: parseFloat(el.dataset.speed || 0.5)
        }));
    };

    // Optimized scroll handler using requestAnimationFrame
    const scrollHandler = () => {
        lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (!ticking) {
            window.requestAnimationFrame(() => {
                // Apply parallax effect to cached elements
                parallaxElements.forEach(item => {
                    const yPos = -(lastScrollTop * item.speed);
                    item.element.style.transform = `translateY(${yPos}px)`;
                });
                ticking = false;
            });

            ticking = true;
        }
    };

    // Initialize parallax elements
    cacheParallaxElements();

    // Use passive event listener to improve performance
    window.addEventListener('scroll', scrollHandler, { passive: true });

    // Recache elements if DOM changes
    const observer = new MutationObserver(cacheParallaxElements);
    observer.observe(document.body, { childList: true, subtree: true });

    // Initialize features with performance in mind
    const initializeFeatures = () => {
        setupWindows98Elements();
        setupMedievalEffects();

        // Defer non-critical features
        requestIdleCallback(() => {
            setupTerminalMode();
            setupConnectionTracking(); // Use connection tracking instead of streetpass
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
    if (!element) {
      return;
    }

    // Wrap callback to prevent memory leaks from closures
    const wrappedCallback = (...args) => {
      callback(...args);
    };

    element.addEventListener(event, wrappedCallback);

    if (!this.listeners.has(element)) {
      this.listeners.set(element, []);
    }

    this.listeners.get(element).push({ event, callback: wrappedCallback });

    // Return a removal function for easy cleanup
    return () => {
      element.removeEventListener(event, wrappedCallback);
      const listeners = this.listeners.get(element);
      const index = listeners.findIndex(l => l.callback === wrappedCallback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    };
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

/**
 * Setup accessibility controls
 */
document.addEventListener('DOMContentLoaded', function() {
  // Initialize accessibility controls
  const toggleAnimations = document.getElementById('toggle-animations');
  const toggleContrast = document.getElementById('toggle-contrast');
  const increaseFont = document.getElementById('increase-font');

  if (!toggleAnimations || !toggleContrast || !increaseFont) return;

  // Get stored preferences
  const animationsPaused = localStorage.getItem('animations-paused') === 'true';
  const highContrast = localStorage.getItem('high-contrast') === 'true';
  const fontSizeLevel = parseInt(localStorage.getItem('font-size-level') || '0');

  // Apply stored preferences
  if (animationsPaused) {
    document.body.classList.add('reduced-motion');
    toggleAnimations.setAttribute('aria-pressed', 'true');
  }

  if (highContrast) {
    document.body.classList.add('high-contrast');
    toggleContrast.setAttribute('aria-pressed', 'true');
  }

  if (fontSizeLevel > 0) {
    document.body.classList.add(`font-size-${['large', 'larger', 'largest'][fontSizeLevel - 1]}`);
  }

  // Toggle animations
  toggleAnimations.addEventListener('click', function() {
    const isPaused = this.getAttribute('aria-pressed') === 'true';
    const newState = !isPaused;

    this.setAttribute('aria-pressed', newState.toString());
    document.body.classList.toggle('reduced-motion', newState);
    localStorage.setItem('animations-paused', newState.toString());
  });

  // Toggle high contrast
  toggleContrast.addEventListener('click', function() {
    const isHighContrast = this.getAttribute('aria-pressed') === 'true';
    const newState = !isHighContrast;

    this.setAttribute('aria-pressed', newState.toString());
    document.body.classList.toggle('high-contrast', newState);
    localStorage.setItem('high-contrast', newState.toString());
  });

  // Increase font size (cycles through levels)
  increaseFont.addEventListener('click', function() {
    const currentLevel = parseInt(localStorage.getItem('font-size-level') || '0');
    const newLevel = (currentLevel + 1) % 4; // 0, 1, 2, 3 (0 = default)

    // Remove all font size classes
    document.body.classList.remove('font-size-large', 'font-size-larger', 'font-size-largest');

    // Add new class if not default
    if (newLevel > 0) {
      const sizes = ['large', 'larger', 'largest'];
      document.body.classList.add(`font-size-${sizes[newLevel - 1]}`);
    }

    localStorage.setItem('font-size-level', newLevel.toString());
  });
});

// Theme toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            // Toggle between cyberschizo and classic theme
            document.body.classList.toggle('classic-theme');

            // Toggle all theme stylesheets
            const themeStylesheets = [
                document.querySelector('link[href="css/laincore.css"]'),
                document.querySelector('link[href="css/interface.css"]'),
                document.querySelector('link[href="css/scanlines.css"]')
            ];

            themeStylesheets.forEach(stylesheet => {
                if (stylesheet) {
                    stylesheet.disabled = !stylesheet.disabled;
                }
            });

            // Toggle CRT effects
            const crtElements = document.querySelectorAll('.crt-scanlines, .crt-flicker, .digital-noise');
            crtElements.forEach(el => {
                el.style.display = el.style.display === 'none' ? 'block' : 'none';
            });
        });
    }
});

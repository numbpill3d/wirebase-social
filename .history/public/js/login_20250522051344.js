document.addEventListener('DOMContentLoaded', function() {
    // Terminal text animation
    const terminalContent = document.querySelector('.terminal-content pre');
    const cursor = document.querySelector('.cursor');
    
    if (terminalContent) {
        // Simulate occasional terminal updates
        setInterval(function() {
            if (Math.random() > 0.7) {
                const messages = [
                    "Scanning network for authorized nodes...",
                    "Verifying authentication protocols...",
                    "Preparing secure connection...",
                    "Checking system integrity...",
                    "Analyzing network traffic...",
                    "Initializing encryption layers..."
                ];
                
                const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                const cursorPosition = terminalContent.innerHTML.indexOf('<span class="cursor">');
                
                if (cursorPosition !== -1) {
                    const textBeforeCursor = terminalContent.innerHTML.substring(0, cursorPosition);
                    terminalContent.innerHTML = textBeforeCursor + "\n" + randomMessage + "\n<span class=\"cursor\">_</span>";
                }
            }
        }, 5000);
    }
    
    // Cursor blinking
    if (cursor) {
        setInterval(function() {
            cursor.style.visibility = cursor.style.visibility === 'hidden' ? 'visible' : 'hidden';
        }, 500);
    }
    
    // Add digital particles to the background
    const container = document.querySelector('.cyber-login-container');
    if (container) {
        for (let i = 0; i < 30; i++) {
            createDigitalParticle(container);
        }
    }
    
    function createDigitalParticle(container) {
        const particle = document.createElement('div');
        
        // Random properties
        const size = Math.random() * 3 + 1;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const opacity = Math.random() * 0.3 + 0.1;
        const duration = Math.random() * 30 + 15;
        const delay = Math.random() * 10;
        
        // Style the particle
        particle.className = 'digital-particle';
        particle.style.position = 'absolute';
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.backgroundColor = 'var(--cyber-green)';
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        particle.style.opacity = opacity;
        particle.style.boxShadow = '0 0 3px var(--cyber-glow)';
        particle.style.animation = `float-digital ${duration}s linear ${delay}s infinite`;
        particle.style.zIndex = '2';
        
        container.appendChild(particle);
    }
    
    // Random CRT flicker effect
    setInterval(function() {
        const flicker = document.querySelector('.crt-flicker');
        if (flicker && Math.random() > 0.95) {
            flicker.style.opacity = (Math.random() * 0.3).toString();
            setTimeout(function() {
                flicker.style.opacity = '0';
            }, 50);
        }
    }, 200);
    
    // Glitch effect on logo text
    const glitchText = document.querySelector('.glitch-text');
    if (glitchText) {
        setInterval(function() {
            if (Math.random() > 0.95) {
                glitchText.style.letterSpacing = `${Math.random() * 10}px`;
                setTimeout(function() {
                    glitchText.style.letterSpacing = '';
                }, 100);
            }
        }, 3000);
    }
    
    // Theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('light-theme');
            themeToggle.textContent = document.body.classList.contains('light-theme') ? 'Dark Mode' : 'Disconnect';
        });
    }
    
    // Simulate network activity on the status indicator
    const statusIcon = document.querySelector('.status-icon');
    const statusText = document.querySelector('.status-text');
    
    if (statusIcon && statusText) {
        setInterval(function() {
            if (Math.random() > 0.8) {
                statusIcon.style.backgroundColor = 'var(--cyber-red)';
                statusText.textContent = 'Connection Fluctuating...';
                
                setTimeout(function() {
                    statusIcon.style.backgroundColor = 'var(--cyber-green)';
                    statusText.textContent = 'Secure Connection Established';
                }, 800);
            }
        }, 5000);
    }
    
    // Add perspective tilt effect based on mouse movement
    const loginWindow = document.querySelector('.login-window');
    
    if (loginWindow) {
        document.addEventListener('mousemove', function(e) {
            const xAxis = (window.innerWidth / 2 - e.pageX) / 50;
            const yAxis = (window.innerHeight / 2 - e.pageY) / 50;
            
            loginWindow.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
        });
        
        // Reset perspective when mouse leaves
        document.addEventListener('mouseleave', function() {
            loginWindow.style.transform = 'rotateY(0deg) rotateX(0deg)';
        });
    }
    
    // Form field effects
    const inputs = document.querySelectorAll('.cyber-input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.classList.add('active');
            const formGroup = this.closest('.form-group');
            if (formGroup) {
                formGroup.style.borderLeft = '2px solid var(--cyber-purple)';
                formGroup.style.paddingLeft = '10px';
                formGroup.style.transition = 'all 0.3s ease';
            }
        });
        
        input.addEventListener('blur', function() {
            this.classList.remove('active');
            const formGroup = this.closest('.form-group');
            if (formGroup) {
                formGroup.style.borderLeft = '';
                formGroup.style.paddingLeft = '';
            }
        });
    });
    
    // Data chunk glitch animation
    function createGlitchChunk() {
        if (Math.random() > 0.99) {
            const chunk = document.createElement('div');
            chunk.className = 'data-chunk';
            chunk.style.width = `${Math.random() * 300 + 50}px`;
            chunk.style.height = `${Math.random() * 3 + 1}px`;
            chunk.style.backgroundColor = 'var(--cyber-purple)';
            chunk.style.opacity = `${Math.random() * 0.5 + 0.1}`;
            chunk.style.left = `${Math.random() * 100}%`;
            chunk.style.top = `${Math.random() * 100}%`;
            chunk.style.position = 'fixed';
            chunk.style.pointerEvents = 'none';
            chunk.style.zIndex = '999';
            chunk.style.boxShadow = '0 0 5px var(--cyber-glow)';
            document.body.appendChild(chunk);
            
            setTimeout(() => {
                chunk.remove();
            }, Math.random() * 500 + 100);
        }
        
        requestAnimationFrame(createGlitchChunk);
    }
    
    createGlitchChunk();
    
    // Form validation visual feedback
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            let isValid = true;
            const inputs = this.querySelectorAll('input[required]');
            
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.style.borderColor = 'var(--cyber-red)';
                    input.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.3)';
                    
                    // Add shake animation
                    input.style.animation = 'shake 0.5s';
                    setTimeout(() => {
                        input.style.animation = '';
                    }, 500);
                } else {
                    input.style.borderColor = 'var(--cyber-green)';
                    input.style.boxShadow = '0 0 10px var(--cyber-glow)';
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                
                // Add error message to terminal
                const terminalContent = document.querySelector('.terminal-content pre');
                if (terminalContent) {
                    const cursorPosition = terminalContent.innerHTML.indexOf('<span class="cursor">');
                    if (cursorPosition !== -1) {
                        const textBeforeCursor = terminalContent.innerHTML.substring(0, cursorPosition);
                        terminalContent.innerHTML = textBeforeCursor + "\n[ERROR] Authentication parameters required\n<span class=\"cursor\">_</span>";
                    }
                }
            }
        });
    }
});

// Add shake animation for form validation
const style = document.createElement('style');
style.textContent = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
}
`;
document.head.appendChild(style);
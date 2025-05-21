document.addEventListener('DOMContentLoaded', function() {
    // Glyph picker functionality
    const glyphOptions = document.querySelectorAll('.glyph-option');
    const glyphInput = document.getElementById('customGlyph');

    glyphOptions.forEach(option => {
        option.addEventListener('click', function() {
            const glyph = this.getAttribute('data-glyph');
            glyphInput.value = glyph;
        });
    });

    // Form validation
    const registerForm = document.querySelector('.register-form');
    const passwordInput = document.getElementById('password');
    const password2Input = document.getElementById('password2');
    const usernameInput = document.getElementById('username');

    registerForm.addEventListener('submit', function(e) {
        let valid = true;

        // Clear previous errors
        const errorContainer = document.querySelector('.register-errors');
        if (errorContainer) {
            errorContainer.remove();
        }

        // Create a new error container
        const errors = [];

        // Check username format
        const usernamePattern = /^[a-zA-Z0-9_-]{3,20}$/;
        if (!usernamePattern.test(usernameInput.value)) {
            errors.push('Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens');
            valid = false;
        }

        // Check password length
        if (passwordInput.value.length < 6) {
            errors.push('Password must be at least 6 characters');
            valid = false;
        }

        // Check if passwords match
        if (passwordInput.value !== password2Input.value) {
            errors.push('Passwords do not match');
            valid = false;
        }

        // Display errors if any
        if (!valid) {
            e.preventDefault();

            const errorDiv = document.createElement('div');
            errorDiv.className = 'register-errors';
            errorDiv.innerHTML = '<ul class="error-list"></ul>';

            const errorList = errorDiv.querySelector('.error-list');

            errors.forEach(error => {
                const li = document.createElement('li');
                li.innerHTML = `<span class="error-icon">⚠️</span> ${error}`;
                errorList.appendChild(li);
            });

            const formHeader = document.querySelector('.register-header');
            formHeader.insertAdjacentElement('afterend', errorDiv);

            // Scroll to errors
            errorDiv.scrollIntoView({ behavior: 'smooth' });
        }
    });

    // Add dust particles to the login background
    const container = document.querySelector('.cyber-register-container');

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
        particle.style.backgroundColor = '#00ff00';
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        particle.style.opacity = opacity;
        particle.style.boxShadow = '0 0 3px rgba(0, 255, 0, 0.5)';
        particle.style.animation = `float-digital ${duration}s linear ${delay}s infinite`;
        particle.style.zIndex = '2';

        container.appendChild(particle);
    }

    // Add a special hovering effect to the register button
    const registerButton = document.querySelector('.register-form .cyber-button');
    if (registerButton) {
        registerButton.addEventListener('mouseover', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3), 0 0 10px rgba(0, 255, 0, 0.3)';
        });

        registerButton.addEventListener('mouseout', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
        });
    }
});
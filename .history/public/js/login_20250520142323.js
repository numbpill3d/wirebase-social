document.addEventListener('DOMContentLoaded', function() {
    // Add digital particles to the login background
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
        particle.style.backgroundColor = '#00ff00';
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        particle.style.opacity = opacity;
        particle.style.boxShadow = '0 0 3px rgba(0, 255, 0, 0.5)';
        particle.style.animation = `float-digital ${duration}s linear ${delay}s infinite`;
        particle.style.zIndex = '2';

        container.appendChild(particle);
    }

    // Add a special hovering effect to the login button
    const loginButton = document.querySelector('.login-form .cyber-button');
    if (loginButton) {
        loginButton.addEventListener('mouseover', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3), 0 0 10px rgba(0, 255, 0, 0.3)';
        });

        loginButton.addEventListener('mouseout', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
        });
    }
});
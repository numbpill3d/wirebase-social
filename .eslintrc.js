module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es2021: true,
        node: true,
    },
    extends: [
        'eslint:recommended',
    ],
    parserOptions: {
        ecmaVersion: 12,
    },
    rules: {
        // Add custom rules here if needed
    },
    overrides: [
        {
            files: ['public/js/**/*.js', 'public/components/**/*.js'], // Client-side JS and components
            env: {
                browser: true, // Enable browser globals
                node: false, // Disable Node.js globals
            },
            globals: {
                // Explicitly define common browser globals if env.browser is not sufficient
                document: 'readonly',
                window: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                HTMLElement: 'readonly',
                customElements: 'readonly',
                prompt: 'readonly',
                Audio: 'readonly',
                MutationObserver: 'readonly',
                IntersectionObserver: 'readonly',
                requestAnimationFrame: 'readonly',
                requestIdleCallback: 'readonly',
            },
            parserOptions: {
                ecmaVersion: 12, // Ensure modern syntax is parsed
                sourceType: 'module', // Assuming modern JS modules
            },
            rules: {
                // Client-specific rules
                'no-unused-vars': 'warn', // Change unused vars to warning for now
            },
        },
        {
            files: ['server/**/*.js', 'scripts/**/*.js', '*.js'], // Server-side and build scripts
            env: {
                browser: false, // No browser globals
                node: true, // Enable Node.js globals
            },
            parserOptions: {
                ecmaVersion: 12, // Ensure modern syntax is parsed
            },
            rules: {
                // Server-specific rules
                'no-unused-vars': 'warn', // Change unused vars to warning for now
            },
        },
        // Add overrides for test files if needed
        {
            files: ['tests/**/*.js'],
            env: {
                jest: true, // Assuming Jest is used for testing
                node: true, // Enable Node.js globals for tests
            },
            parserOptions: {
                ecmaVersion: 12, // Ensure modern syntax is parsed
            },
            rules: {
                 'no-unused-vars': 'warn', // Change unused vars to warning for now
            }
        },
    ],
};
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
                browser: true,
                node: false, // Client-side, no Node.js globals
                // Explicitly add common browser globals
                document: true,
                window: true,
                localStorage: true,
                HTMLElement: true,
                customElements: true,
                prompt: true,
                Audio: true,
                MutationObserver: true,
                IntersectionObserver: true,
                requestIdleCallback: true,
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
                node: true,
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
                node: true,
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
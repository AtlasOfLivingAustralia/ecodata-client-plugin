import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['src/test/js/vitest.setup.js'],
        include: ['src/test/js/spec/**/*Spec.js'],
        testTimeout: 10000,
        // Mimic browser-like global scope for legacy scripts
        environmentOptions: {
            jsdom: {
                url: 'http://localhost',
            },
        },
    },
});


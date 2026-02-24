import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'turf-package-instructions.js'),
            name: 'turf',
            formats: ['iife'],
            fileName: () => 'turf-packaged.js',
        },
        outDir: resolve(__dirname, 'grails-app/assets/vendor/turf'),
        emptyOutDir: false,
        minify: false,
    },
});


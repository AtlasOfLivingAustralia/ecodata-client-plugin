import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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


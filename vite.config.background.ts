import { defineConfig } from 'vite';
import { resolve } from 'path';

// Separate build config for background script to prevent code splitting
export default defineConfig({
    build: {
        outDir: 'dist',
        emptyOutDir: false,
        rollupOptions: {
            input: resolve(__dirname, 'src/background.ts'),
            output: {
                entryFileNames: 'background.js',
                format: 'iife',
                inlineDynamicImports: true,
            },
        },
    },
});

import { defineConfig } from 'vite';
import { resolve } from 'path';

// Separate build config for page script to prevent code splitting
export default defineConfig({
    build: {
        outDir: 'dist',
        emptyOutDir: false,
        rollupOptions: {
            input: resolve(__dirname, 'src/page-script.ts'),
            output: {
                entryFileNames: 'page-script.js',
                format: 'iife',
                inlineDynamicImports: true,
            },
        },
    },
});

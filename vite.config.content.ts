import { defineConfig } from 'vite';
import { resolve } from 'path';

// Separate build config for content script to prevent code splitting
export default defineConfig({
    build: {
        outDir: 'dist',
        emptyOutDir: true, // First build cleans the directory
        cssCodeSplit: false,
        rollupOptions: {
            input: resolve(__dirname, 'src/content.ts'),
            output: {
                entryFileNames: 'content.js',
                format: 'iife',
                inlineDynamicImports: true,
                assetFileNames: assetInfo => {
                    // Output content.css without hash for Chrome extension manifest
                    if (assetInfo.name && assetInfo.name.endsWith('.css'))
                        return 'content.css';
                    return 'assets/[name]-[hash][extname]';
                },
            },
        },
    },
});

import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { rename, unlink, rm, readFile, writeFile } from 'fs/promises';

// Plugin to move HTML files to root after build and fix paths
function moveHtmlToRoot(): Plugin {
  return {
    name: 'move-html-to-root',
    closeBundle: async () => {
      const distDir = resolve(__dirname, 'dist');

      // Function to fix paths in HTML file
      const fixHtmlPaths = async (filePath: string) => {
        try {
          let content = await readFile(filePath, 'utf-8');
          // Replace ../../ with ./
          content = content.replace(/\.\.\//g, './');
          await writeFile(filePath, content, 'utf-8');
        } catch (e) {
          console.warn('Could not fix paths in HTML:', e);
        }
      };

      // Move popup HTML to root
      try {
        await rename(
          resolve(distDir, 'src/popup/index.html'),
          resolve(distDir, 'popup.html')
        );
        await fixHtmlPaths(resolve(distDir, 'popup.html'));
      } catch (e) {
        console.warn('Could not move popup HTML:', e);
      }

      // Move options HTML to root
      try {
        await rename(
          resolve(distDir, 'src/options/index.html'),
          resolve(distDir, 'options.html')
        );
        await fixHtmlPaths(resolve(distDir, 'options.html'));
      } catch (e) {
        console.warn('Could not move options HTML:', e);
      }

      // Move onboarding HTML to root
      try {
        await rename(
          resolve(distDir, 'src/onboarding/index.html'),
          resolve(distDir, 'onboarding.html')
        );
        await fixHtmlPaths(resolve(distDir, 'onboarding.html'));
      } catch (e) {
        console.warn('Could not move onboarding HTML:', e);
      }

      // Clean up empty src directory
      try {
        await rm(resolve(distDir, 'src'), { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), moveHtmlToRoot()],
  base: './', // Use relative paths for extension compatibility
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/types': resolve(__dirname, './src/types'),
      '@/store': resolve(__dirname, './src/store'),
      '@/services': resolve(__dirname, './src/services'),
      '@/features': resolve(__dirname, './src/features'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        options: resolve(__dirname, 'src/options/index.html'),
        onboarding: resolve(__dirname, 'src/onboarding/index.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        'content-youtube': resolve(__dirname, 'src/content/youtube.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Background and content scripts go to root
          if (chunkInfo.name === 'background') {
            return 'background.js';
          }
          if (chunkInfo.name === 'content-youtube') {
            return 'content-youtube.js';
          }
          // UI pages go to their own folders
          return '[name]/[name].js';
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    sourcemap: process.env.NODE_ENV === 'development',
    minify: process.env.NODE_ENV === 'production',
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
});

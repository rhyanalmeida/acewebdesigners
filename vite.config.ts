import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react'],
        },
      },
    },
    // Enable compression
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
    // Minification (use esbuild to avoid optional terser dependency in CI)
    minify: 'esbuild',
  },
  // Enable gzip compression in preview
  preview: {
    port: 3000,
    strictPort: true,
  },
  // Optimize dependencies
  esbuild: {
    drop: ['console', 'debugger'],
  },
});

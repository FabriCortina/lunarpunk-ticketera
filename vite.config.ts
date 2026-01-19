import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  build: {
    // Output frontend build to a specific folder in dist to avoid clashing with backend
    outDir: 'dist/frontend', 
    emptyOutDir: true
  }
});
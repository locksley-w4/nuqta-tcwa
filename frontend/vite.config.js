import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/analyze': 'http://localhost:5001',
      '/find-hotspots': 'http://localhost:5001',
      '/analyze-finance': 'http://localhost:5001',
    },
  },
});

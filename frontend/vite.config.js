import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // The backend serves every route under /api as well as bare, so the dev
    // proxy can forward the prefix untouched and match production exactly.
    proxy: {
      '/api': 'http://localhost:5001',
    },
  },
});

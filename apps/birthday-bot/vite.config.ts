import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served at gulshadansari.in/apps/birthday-bot/ — see docs/SETUP.md.
export default defineConfig({
  base: '/apps/birthday-bot/',
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
});

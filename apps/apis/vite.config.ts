import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  mode: 'mpa',
  define: {
    'process.env': {},
  },
  plugins: [react()],
});

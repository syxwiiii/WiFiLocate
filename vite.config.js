import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Указывает, что пути должны быть относительными
  server: {
    host: '0.0.0.0',
  },
});
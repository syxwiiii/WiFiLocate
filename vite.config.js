import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Позволяет доступ по локальному IP
  },
  build: {
    rollupOptions: {
      // Указываем файл как внешнюю зависимость
      external: ['/src/index.jsx']
    }
  }
});
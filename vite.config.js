import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import App from './src/App';

export default defineConfig({
  plugins: [react()],
  build: {
    cssCodeSplit: false, // Объединить CSS в один файл
    outDir: 'dist', // Укажите выходную директорию
  },
});
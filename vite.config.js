import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    cssCodeSplit: false, // Объединить CSS в один файл
    outDir: 'dist', // Укажите выходную директорию
  },
});
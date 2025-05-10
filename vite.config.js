import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import App from './src/index.html';
import './App.css';
import { defineConfig } from 'vite';
import WindiCSS from '@windicss/vite-plugin-windicss';
export default defineConfig({
  plugins: [react()],
  build: {
    cssCodeSplit: false, // Объединить CSS в один файл
    outDir: 'dist', // Укажите выходную директорию
  },
});
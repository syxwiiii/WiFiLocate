import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import App from './src/App';

export default defineConfig({
  plugins: [react()],
  base: './WiFiLocate/', // Указывает, что пути должны быть относительными
  server: {
    host: '0.0.0.0',
  },
});

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carga las variables de entorno
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Solo usa el proxy en desarrollo
      proxy: mode === 'development' ? {
        '/api': 'http://localhost:4000',
        '/uploads': 'http://localhost:4000'
      } : {}
    },
    preview: {
      allowedHosts: ['rickart13.up.railway.app'],
      port: 5173,
    }
  };
});
import { defineConfig, PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import app from './server/app.js';

function apiServerPlugin(): PluginOption {
  return {
    name: 'api-server-middleware',
    configureServer(server) {
      server.middlewares.use(app);
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), apiServerPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    cors: true,
    // @ts-ignore
    allowedHosts: true
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    // @ts-ignore
    allowedHosts: true
  }
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function prismaApiPlugin() {
  return {
    name: 'alchemist-prisma-api-middleware',
    async configureServer(server) {
      await import('dotenv/config');
      const { createApiMiddlewareApp } = await import('./server/app.js');
      const apiApp = createApiMiddlewareApp();

      server.middlewares.use((req, res, next) => {
        if (
          req.url &&
          (req.url.startsWith('/api/') ||
            req.url === '/api' ||
            req.url.startsWith('/Alchemist-Library/api/') ||
            req.url === '/Alchemist-Library/api')
        ) {
          return apiApp(req, res, next);
        }
        return next();
      });
    }
  };
}

export default defineConfig({
  base: '/Alchemist-Library/',
  plugins: [react(), prismaApiPlugin()],
  server: {
    port: 5173,
    host: '0.0.0.0'
  }
});

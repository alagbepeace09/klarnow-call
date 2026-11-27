import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In `npm run dev`, serve the /api functions locally so the full journey works offline.
// Set LOCAL_DEV=1 to use an in-memory database and print sign-in codes in the terminal.
function localApi() {
  const routes = {
    '/api/scan': './api/scan.js',
    '/api/auth/start': './api/auth/start.js',
    '/api/auth/verify': './api/auth/verify.js',
    '/api/me': './api/me.js',
    '/api/logout': './api/logout.js',
    '/api/workspace': './api/workspace.js',
    '/api/ops': './api/ops.js'
  };
  return {
    name: 'klaro-local-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url || '').split('?')[0];
        if (!routes[path]) return next();
        try {
          const mod = await server.ssrLoadModule(routes[path]);
          await mod.default(req, res);
        } catch (e) {
          console.error(e);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'server' }));
        }
      });
    }
  };
}

export default defineConfig({ plugins: [react(), localApi()] });

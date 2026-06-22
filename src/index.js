// src/index.js
import setupHandler from './setup.js';
import { handleSiteRoute } from './routes/site-router.js';

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // Attach env to request for all handlers
      request.env = env;

      // SETUP - MUST be first route checked
      if (path === '/setup') {
        return await setupHandler(request, env);
      }

      // All other routes go through site-router
      return await handleSiteRoute(request, env);
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

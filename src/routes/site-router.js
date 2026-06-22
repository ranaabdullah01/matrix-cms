// src/routes/site-router.js
import { resolveTenant, requireTenant } from '../middleware/tenant-resolver.js';
import { handleAuth } from './auth.js';
import { handleContentAPI } from './content-api.js';
import { handleLeadAPI } from './lead-api.js';
import { handleDomainAPI } from './domain-api.js';
import { renderTheme } from '../themes/theme-registry.js';

export async function handleSiteRoute(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  // /boss and /boss/dashboard - Boss admin
  if (path === '/boss' || path === '/boss/dashboard') {
    return await handleAuth(request, path === '/boss' ? 'login' : 'dashboard');
  }

  // /admin/[slug] - Client admin
  if (path.startsWith('/admin/')) {
    return await handleAuth(request, 'admin');
  }

  // /api/* - API endpoints
  if (path.startsWith('/api/')) {
    // Resolve tenant for API requests
    const { tenantInfo, session } = await resolveTenant(request, env);

    if (path.startsWith('/api/content/')) {
      return await handleContentAPI(request, env, tenantInfo, session);
    }

    if (path.startsWith('/api/leads/')) {
      return await handleLeadAPI(request, env, tenantInfo, session);
    }

    if (path.startsWith('/api/domains/')) {
      return await handleDomainAPI(request, env, tenantInfo, session);
    }

    return new Response(JSON.stringify({ error: 'API endpoint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // /site/[slug] - Public website
  if (path.startsWith('/site/')) {
    const { tenantInfo } = await resolveTenant(request, env);
    if (!tenantInfo) {
      return new Response('Tenant not found', { status: 404 });
    }
    return await renderTheme(request, env, tenantInfo);
  }

  // All other paths - 404
  return new Response('Not Found', { status: 404 });
}

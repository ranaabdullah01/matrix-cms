// src/middleware/tenant-resolver.js
import { getSessionFromCookie } from '../routes/auth.js';

export async function resolveTenant(request, env) {
  const db = env.DB;
  const url = new URL(request.url);
  const path = url.pathname;

  let tenantInfo = null;
  let session = null;

  try {
    // Try to get session first
    session = await getSessionFromCookie(request, env);

    // For admin routes, resolve from session
    if (path.startsWith('/boss') || path.startsWith('/admin') || path.startsWith('/api/')) {
      if (session && session.tenantId) {
        const tenant = await db.prepare(
          "SELECT * FROM tenants WHERE id = ?"
        ).bind(session.tenantId).first();

        if (tenant) {
          tenantInfo = {
            id: tenant.id,
            slug: tenant.slug,
            name: tenant.name,
            theme: tenant.theme,
            settings: JSON.parse(tenant.settings || '{}')
          };
        }
      }
    }

    // For public routes, resolve from URL path
    if (path.startsWith('/site/')) {
      const slug = path.split('/')[2];
      if (slug) {
        const tenant = await db.prepare(
          "SELECT * FROM tenants WHERE slug = ?"
        ).bind(slug).first();

        if (tenant) {
          tenantInfo = {
            id: tenant.id,
            slug: tenant.slug,
            name: tenant.name,
            theme: tenant.theme,
            settings: JSON.parse(tenant.settings || '{}')
          };
        }
      }
    }

    return { tenantInfo, session };
  } catch (error) {
    console.error('Tenant resolution error:', error);
    return { tenantInfo: null, session: null };
  }
}

export function requireTenant(request, tenantInfo) {
  if (!tenantInfo) {
    throw new Error('Tenant not found');
  }
  return tenantInfo;
}

export function requireBoss(request, session) {
  if (!session || session.role !== 'boss') {
    throw new Error('Unauthorized - Boss access required');
  }
  return session;
}

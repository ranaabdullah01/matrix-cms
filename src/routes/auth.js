// src/routes/auth.js
import { verifyPassword, hashPassword } from '../utils/validation.js';
import { renderLoginForm, renderDashboard } from '../utils/html-templates.js';

export async function handleAuth(request, type) {
  const env = request.env;
  const db = env.DB;

  // Handle login
  if (type === 'login' || type === 'admin') {
    // For admin routes, check session first
    if (type === 'admin') {
      const session = await getSessionFromCookie(request, env);
      if (session && session.role === 'client') {
        const tenant = await db.prepare(
          "SELECT * FROM tenants WHERE id = ?"
        ).bind(session.tenantId).first();
        if (tenant) {
          return new Response(renderDashboard(session, tenant, 'client'), {
            headers: { 'Content-Type': 'text/html' }
          });
        }
      }
      return new Response(renderLoginForm('admin'), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Boss login page
    return new Response(renderLoginForm('boss'), {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  // Dashboard
  if (type === 'dashboard') {
    const session = await getSessionFromCookie(request, env);
    if (!session || session.role !== 'boss') {
      return new Response(renderLoginForm('boss', 'Please login first'), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const tenant = await db.prepare(
      "SELECT * FROM tenants WHERE id = ?"
    ).bind(session.tenantId).first();

    if (!tenant) {
      return new Response('Tenant not found', { status: 404 });
    }

    return new Response(renderDashboard(session, tenant, 'boss'), {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  return new Response('Not found', { status: 404 });
}

export async function handleLogin(request) {
  const env = request.env;
  const db = env.DB;

  try {
    const { email, password, role } = await request.json();

    if (!email || !password || !role) {
      return new Response(JSON.stringify({ error: 'Email, password, and role are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user by email
    const user = await db.prepare(
      "SELECT * FROM users WHERE email = ? AND role = ?"
    ).bind(email, role).first();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash, user.salt);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get tenant info
    const tenant = await db.prepare(
      "SELECT * FROM tenants WHERE id = ?"
    ).bind(user.tenant_id).first();

    // Create session
    const session = await createSession(user, tenant, env);

    return new Response(JSON.stringify({
      success: true,
      redirect: role === 'boss' ? '/boss/dashboard' : `/admin/${tenant.slug}`,
      session: session
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `session=${encodeURIComponent(JSON.stringify(session))}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax`
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ error: 'Login failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function createSession(user, tenant, env) {
  const sessionData = {
    userId: user.id,
    email: user.email,
    role: user.role,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    expires: Date.now() + 86400000 // 24 hours
  };

  const encoder = new TextEncoder();
  const dataString = JSON.stringify(sessionData);
  const signature = await signData(dataString, env.SESSION_SECRET);

  return {
    ...sessionData,
    signature
  };
}

export async function getSessionFromCookie(request, env) {
  try {
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader) return null;

    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => c.trim().split('='))
    );

    const sessionCookie = cookies.session;
    if (!sessionCookie) return null;

    const decoded = decodeURIComponent(sessionCookie);
    const data = JSON.parse(decoded);

    // Verify signature
    const { signature, ...sessionData } = data;
    const expectedSignature = await signData(JSON.stringify(sessionData), env.SESSION_SECRET);

    if (signature !== expectedSignature) {
      return null;
    }

    // Check expiration
    if (sessionData.expires && Date.now() > sessionData.expires) {
      return null;
    }

    return sessionData;
  } catch (error) {
    console.error('Session extraction error:', error);
    return null;
  }
}

async function signData(data, secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

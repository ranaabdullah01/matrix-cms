// src/setup.js
import { hashPassword, generateSalt } from './utils/validation.js';
import { renderSetupForm, renderSetupSuccess } from './utils/html-templates.js';

export default async function setupHandler(request, env) {
  const db = env.DB;

  try {
    // Check if users table exists
    const tableCheck = await db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
    ).first();

    if (!tableCheck) {
      // Create tables individually using prepare().run()
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS tenants (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          slug TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          domain TEXT,
          theme TEXT DEFAULT 'modern-business',
          settings TEXT DEFAULT '{}',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      await db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id INTEGER,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          salt TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('boss', 'client')),
          name TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
        )
      `).run();

      await db.prepare(`
        CREATE TABLE IF NOT EXISTS listings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          price INTEGER,
          bedrooms INTEGER,
          bathrooms INTEGER,
          area INTEGER,
          address TEXT,
          images TEXT DEFAULT '[]',
          status TEXT DEFAULT 'active' CHECK(status IN ('active', 'sold', 'pending')),
          featured BOOLEAN DEFAULT 0,
          agent_name TEXT,
          agent_phone TEXT,
          agent_email TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
        )
      `).run();

      await db.prepare(`
        CREATE TABLE IF NOT EXISTS leads (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          message TEXT,
          type TEXT DEFAULT 'contact' CHECK(type IN ('contact', 'valuation')),
          property_address TEXT,
          property_value INTEGER,
          status TEXT DEFAULT 'new' CHECK(status IN ('new', 'contacted', 'qualified', 'converted')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
        )
      `).run();

      // Create indexes
      await db.prepare(`CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id)`).run();
      await db.prepare(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`).run();
      await db.prepare(`CREATE INDEX IF NOT EXISTS idx_listings_tenant_id ON listings(tenant_id)`).run();
      await db.prepare(`CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status)`).run();
      await db.prepare(`CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON leads(tenant_id)`).run();
      await db.prepare(`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`).run();
      await db.prepare(`CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug)`).run();
    }

    // Check if any boss user exists
    const bossCheck = await db.prepare(
      "SELECT id FROM users WHERE role = 'boss' LIMIT 1"
    ).first();

    // If POST request, handle user creation
    if (request.method === 'POST') {
      const formData = await request.formData();
      const email = formData.get('email');
      const password = formData.get('password');
      const name = formData.get('name');

      // Validate input
      if (!email || !password || !name) {
        return new Response(renderSetupForm('All fields are required'), {
          headers: { 'Content-Type': 'text/html' }
        });
      }

      // Check if user already exists
      const existingUser = await db.prepare(
        "SELECT id FROM users WHERE email = ?"
      ).bind(email).first();

      if (existingUser) {
        return new Response(renderSetupForm('Email already registered'), {
          headers: { 'Content-Type': 'text/html' }
        });
      }

      // Create tenant first
      const tenantSlug = email.split('@')[0] + '-main';
      const tenantResult = await db.prepare(
        "INSERT INTO tenants (slug, name, theme) VALUES (?, ?, ?)"
      ).bind(tenantSlug, name + "'s Real Estate", 'modern-business').run();

      const tenantId = tenantResult.meta.last_row_id;

      // Hash password with salt
      const salt = generateSalt();
      const passwordHash = await hashPassword(password, salt);

      // Create boss user
      await db.prepare(
        "INSERT INTO users (tenant_id, email, password_hash, salt, role, name) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(tenantId, email, passwordHash, salt, 'boss', name).run();

      return new Response(renderSetupSuccess('/boss'), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // GET - show setup form
    if (bossCheck) {
      return new Response(renderSetupForm('System already configured. Please login.', true), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    return new Response(renderSetupForm(), {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('Setup error:', error);
    return new Response(renderSetupForm('Error during setup: ' + error.message), {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

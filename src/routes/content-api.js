// src/routes/content-api.js
export async function handleContentAPI(request, env, tenantInfo, session) {
  const db = env.DB;
  const url = new URL(request.url);
  const method = request.method;
  const pathParts = url.pathname.split('/').filter(p => p);

  try {
    // GET /api/content/listings
    if (pathParts[2] === 'listings' && method === 'GET' && !pathParts[3]) {
      const { results } = await db.prepare(
        "SELECT * FROM listings WHERE tenant_id = ? ORDER BY created_at DESC"
      ).bind(tenantInfo.id).all();
      return new Response(JSON.stringify(results), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // GET /api/content/listings/:id
    if (pathParts[2] === 'listings' && method === 'GET' && pathParts[3]) {
      const listing = await db.prepare(
        "SELECT * FROM listings WHERE id = ? AND tenant_id = ?"
      ).bind(pathParts[3], tenantInfo.id).first();
      if (!listing) {
        return new Response(JSON.stringify({ error: 'Listing not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify(listing), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // POST /api/content/listings
    if (pathParts[2] === 'listings' && method === 'POST') {
      const data = await request.json();
      const result = await db.prepare(`
        INSERT INTO listings (
          tenant_id, title, description, price, bedrooms, bathrooms,
          area, address, images, status, featured, agent_name, agent_phone, agent_email
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        tenantInfo.id,
        data.title,
        data.description,
        data.price,
        data.bedrooms,
        data.bathrooms,
        data.area,
        data.address,
        JSON.stringify(data.images || []),
        data.status || 'active',
        data.featured || 0,
        data.agent_name,
        data.agent_phone,
        data.agent_email
      ).run();

      return new Response(JSON.stringify({
        id: result.meta.last_row_id,
        message: 'Listing created successfully'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // PUT /api/content/listings/:id
    if (pathParts[2] === 'listings' && method === 'PUT' && pathParts[3]) {
      // Verify ownership
      const existing = await db.prepare(
        "SELECT id FROM listings WHERE id = ? AND tenant_id = ?"
      ).bind(pathParts[3], tenantInfo.id).first();

      if (!existing) {
        return new Response(JSON.stringify({ error: 'Listing not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const data = await request.json();
      await db.prepare(`
        UPDATE listings SET
          title = ?, description = ?, price = ?, bedrooms = ?, bathrooms = ?,
          area = ?, address = ?, images = ?, status = ?, featured = ?,
          agent_name = ?, agent_phone = ?, agent_email = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND tenant_id = ?
      `).bind(
        data.title,
        data.description,
        data.price,
        data.bedrooms,
        data.bathrooms,
        data.area,
        data.address,
        JSON.stringify(data.images || []),
        data.status || 'active',
        data.featured || 0,
        data.agent_name,
        data.agent_phone,
        data.agent_email,
        pathParts[3],
        tenantInfo.id
      ).run();

      return new Response(JSON.stringify({ message: 'Listing updated successfully' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // DELETE /api/content/listings/:id
    if (pathParts[2] === 'listings' && method === 'DELETE' && pathParts[3]) {
      const result = await db.prepare(
        "DELETE FROM listings WHERE id = ? AND tenant_id = ?"
      ).bind(pathParts[3], tenantInfo.id).run();

      if (result.meta.changes === 0) {
        return new Response(JSON.stringify({ error: 'Listing not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ message: 'Listing deleted successfully' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // GET /api/content/settings
    if (pathParts[2] === 'settings' && method === 'GET') {
      const tenant = await db.prepare(
        "SELECT settings FROM tenants WHERE id = ?"
      ).bind(tenantInfo.id).first();
      return new Response(JSON.stringify(JSON.parse(tenant.settings || '{}')), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // PUT /api/content/settings
    if (pathParts[2] === 'settings' && method === 'PUT') {
      const data = await request.json();
      await db.prepare(
        "UPDATE tenants SET settings = ? WHERE id = ?"
      ).bind(JSON.stringify(data), tenantInfo.id).run();
      return new Response(JSON.stringify({ message: 'Settings updated successfully' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Content API endpoint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Content API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

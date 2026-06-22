// src/routes/lead-api.js
export async function handleLeadAPI(request, env, tenantInfo, session) {
  const db = env.DB;
  const url = new URL(request.url);
  const method = request.method;
  const pathParts = url.pathname.split('/').filter(p => p);

  try {
    // POST /api/leads - Submit lead (public)
    if (method === 'POST' && pathParts[2] === 'leads' && !pathParts[3]) {
      const data = await request.json();

      // Validate required fields
      if (!data.name || !data.email) {
        return new Response(JSON.stringify({ error: 'Name and email are required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const result = await db.prepare(`
        INSERT INTO leads (
          tenant_id, name, email, phone, message, type, property_address, property_value
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        tenantInfo.id,
        data.name,
        data.email,
        data.phone,
        data.message,
        data.type || 'contact',
        data.property_address,
        data.property_value
      ).run();

      return new Response(JSON.stringify({
        id: result.meta.last_row_id,
        message: 'Lead submitted successfully'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // GET /api/leads - Fetch leads (admin only)
    if (method === 'GET' && pathParts[2] === 'leads' && !pathParts[3]) {
      // Check if user is authenticated
      if (!session) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const { results } = await db.prepare(
        "SELECT * FROM leads WHERE tenant_id = ? ORDER BY created_at DESC"
      ).bind(tenantInfo.id).all();

      return new Response(JSON.stringify(results), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // GET /api/leads/:id - Get single lead
    if (method === 'GET' && pathParts[2] === 'leads' && pathParts[3]) {
      if (!session) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const lead = await db.prepare(
        "SELECT * FROM leads WHERE id = ? AND tenant_id = ?"
      ).bind(pathParts[3], tenantInfo.id).first();

      if (!lead) {
        return new Response(JSON.stringify({ error: 'Lead not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(lead), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // PUT /api/leads/:id/status - Update lead status
    if (method === 'PUT' && pathParts[2] === 'leads' && pathParts[3] && pathParts[4] === 'status') {
      if (!session) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const data = await request.json();
      if (!data.status) {
        return new Response(JSON.stringify({ error: 'Status is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const result = await db.prepare(
        "UPDATE leads SET status = ? WHERE id = ? AND tenant_id = ?"
      ).bind(data.status, pathParts[3], tenantInfo.id).run();

      if (result.meta.changes === 0) {
        return new Response(JSON.stringify({ error: 'Lead not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ message: 'Lead status updated successfully' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Lead API endpoint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Lead API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

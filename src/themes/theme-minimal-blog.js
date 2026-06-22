// src/themes/theme-minimal-blog.js
export async function renderMinimalBlogTheme(data, view, request) {
  // Minimal, clean design with focus on typography
  // Whitespace, simple colors, elegant
  // Include all required elements
  // This is a simplified version - would be fully implemented
  const { tenant, listings, listing, similarListings } = data;
  
  const header = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${tenant.name}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Georgia', serif; color: #2d2d2d; line-height: 1.8; }
        .container { max-width: 900px; margin: 0 auto; padding: 0 20px; }
        header { padding: 3rem 0; border-bottom: 1px solid #eee; }
        header h1 { font-size: 2.5rem; font-weight: normal; }
        nav { margin-top: 1rem; }
        nav a { color: #555; text-decoration: none; margin-right: 2rem; }
        nav a:hover { color: #000; }
        .hero { text-align: center; padding: 4rem 0; }
        .hero h2 { font-size: 3rem; font-weight: normal; }
        .listing-grid { display: grid; grid-template-columns: 1fr; gap: 2rem; padding: 2rem 0; }
        .listing-card { padding: 2rem; border-bottom: 1px solid #eee; }
        .listing-card h3 { font-size: 1.5rem; font-weight: normal; }
        .listing-card .price { color: #666; }
        footer { text-align: center; padding: 2rem 0; border-top: 1px solid #eee; color: #666; }
        .contact-form, .valuation-form { max-width: 600px; margin: 2rem auto; padding: 2rem; background: #f9f9f9; }
        .form-group { margin: 1rem 0; }
        .form-group input, .form-group textarea { width: 100%; padding: 0.5rem; border: 1px solid #ddd; font-family: inherit; }
        .btn { padding: 0.5rem 2rem; background: #2d2d2d; color: white; border: none; cursor: pointer; }
        .whatsapp-btn { display: inline-block; padding: 0.5rem 1rem; background: #25D366; color: white; text-decoration: none; border-radius: 4px; }
        .agent-bio { display: flex; gap: 2rem; padding: 2rem; background: #f9f9f9; margin: 2rem 0; }
        @media (max-width: 768px) { .hero h2 { font-size: 2rem; } }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>${tenant.name}</h1>
          <nav>
            <a href="/site/${tenant.slug}">Home</a>
            <a href="/site/${tenant.slug}/listings">Listings</a>
            <a href="#contact">Contact</a>
          </nav>
        </header>
  `;

  let content = '';
  if (view === 'home') {
    content = `
      <section class="hero">
        <h2>Find Your Space</h2>
        <p style="color: #666;">${tenant.settings.tagline || 'Properties for every lifestyle'}</p>
      </section>
      ${listings && listings.length > 0 ? listings.map(l => `
        <div class="listing-card">
          <h3>${l.title}</h3>
          <p class="price">$${l.price.toLocaleString()}</p>
          <p>${l.address || ''}</p>
          <a href="/site/${tenant.slug}/listing/${l.id}">View details →</a>
        </div>
      `).join('') : '<p>No listings available.</p>'}
      ${renderContactForm(tenant.slug)}
      ${renderValuationForm(tenant.slug)}
    `;
  } else if (view === 'listings') {
    content = `
      <h2 style="margin: 2rem 0;">All Properties</h2>
      ${listings && listings.length > 0 ? listings.map(l => `
        <div class="listing-card">
          <h3>${l.title}</h3>
          <p class="price">$${l.price.toLocaleString()}</p>
          <p>${l.address || ''}</p>
          <a href="/site/${tenant.slug}/listing/${l.id}">View details →</a>
        </div>
      `).join('') : '<p>No listings available.</p>'}
    `;
  }

  const footer = `
      <footer>
        <p>&copy; ${new Date().getFullYear()} ${tenant.name}</p>
        <a href="https://wa.me/1234567890" class="whatsapp-btn">Chat on WhatsApp</a>
      </footer>
      </div>
    </body>
    </html>
  `;

  return header + content + footer;
}

function renderContactForm(slug) {
  return `
    <div id="contact" class="contact-form">
      <h3>Contact</h3>
      <form onsubmit="submitLead(event, 'contact')">
        <div class="form-group"><input type="text" name="name" placeholder="Name" required></div>
        <div class="form-group"><input type="email" name="email" placeholder="Email" required></div>
        <div class="form-group"><textarea name="message" placeholder="Message"></textarea></div>
        <button type="submit" class="btn">Send</button>
      </form>
    </div>
  `;
}

function renderValuationForm(slug) {
  return `
    <div id="valuation" class="valuation-form">
      <h3>Valuation</h3>
      <form onsubmit="submitLead(event, 'valuation')">
        <div class="form-group"><input type="text" name="name" placeholder="Name" required></div>
        <div class="form-group"><input type="email" name="email" placeholder="Email" required></div>
        <div class="form-group"><input type="text" name="property_address" placeholder="Property Address"></div>
        <button type="submit" class="btn">Request Valuation</button>
      </form>
    </div>
  `;
}

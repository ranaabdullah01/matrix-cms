// src/themes/theme-modern-business.js
export async function renderModernBusinessTheme(data, view, request) {
  const { tenant, listings, listing, similarListings } = data;

  // Shared header and footer
  const header = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${tenant.name}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .header { background: #2c3e50; color: white; padding: 1rem 0; }
        .header h1 { font-size: 2rem; }
        .nav { display: flex; gap: 2rem; margin-top: 0.5rem; }
        .nav a { color: white; text-decoration: none; }
        .nav a:hover { text-decoration: underline; }
        .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4rem 0; text-align: center; }
        .hero h2 { font-size: 3rem; margin-bottom: 1rem; }
        .btn { display: inline-block; padding: 0.75rem 2rem; background: #2c3e50; color: white; text-decoration: none; border-radius: 5px; border: none; cursor: pointer; }
        .btn-primary { background: #667eea; }
        .btn-primary:hover { background: #5a67d8; }
        .listing-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem; padding: 2rem 0; }
        .listing-card { background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .listing-card .content { padding: 1.5rem; }
        .listing-card h3 { margin-bottom: 0.5rem; }
        .listing-card .price { font-size: 1.5rem; color: #667eea; font-weight: bold; }
        .listing-card .details { display: flex; gap: 1rem; margin: 0.5rem 0; color: #666; }
        .footer { background: #2c3e50; color: white; padding: 2rem 0; margin-top: 2rem; text-align: center; }
        .whatsapp-btn { display: inline-flex; align-items: center; gap: 0.5rem; background: #25D366; color: white; padding: 0.75rem 1.5rem; border-radius: 50px; text-decoration: none; font-weight: bold; }
        .form-group { margin: 1rem 0; }
        .form-group label { display: block; margin-bottom: 0.25rem; font-weight: bold; }
        .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 5px; font-size: 1rem; }
        .contact-form { max-width: 600px; margin: 2rem auto; padding: 2rem; background: #f8f9fa; border-radius: 8px; }
        .contact-form h3 { margin-bottom: 1.5rem; text-align: center; }
        .valuation-form { max-width: 600px; margin: 2rem auto; padding: 2rem; background: #f8f9fa; border-radius: 8px; }
        .valuation-form h3 { margin-bottom: 1.5rem; text-align: center; }
        .agent-bio { display: flex; align-items: center; gap: 2rem; margin: 2rem 0; padding: 2rem; background: #f8f9fa; border-radius: 8px; }
        .agent-bio .avatar { width: 100px; height: 100px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem; }
        .listing-detail .image { width: 100%; height: 400px; background: #e0e0e0; border-radius: 8px; margin-bottom: 1rem; }
        .listing-detail .details-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin: 1rem 0; }
        @media (max-width: 768px) { .header h1 { font-size: 1.5rem; } .hero h2 { font-size: 2rem; } .listing-grid { grid-template-columns: 1fr; } }
      </style>
    </head>
    <body>
      <header class="header">
        <div class="container">
          <h1>${tenant.name}</h1>
          <nav class="nav">
            <a href="/site/${tenant.slug}">Home</a>
            <a href="/site/${tenant.slug}/listings">Listings</a>
            <a href="#contact">Contact</a>
            <a href="#valuation">Valuation</a>
          </nav>
        </div>
      </header>
  `;

  const footer = `
      <footer class="footer">
        <div class="container">
          <p>&copy; ${new Date().getFullYear()} ${tenant.name}. All rights reserved.</p>
          <a href="https://wa.me/1234567890" class="whatsapp-btn">Chat on WhatsApp</a>
        </div>
      </footer>
    </body>
    </html>
  `;

  // Render different views
  let content = '';
  if (view === 'home') {
    content = `
      <section class="hero">
        <div class="container">
          <h2>Find Your Dream Property</h2>
          <p>Discover our curated selection of premium properties</p>
          <a href="/site/${tenant.slug}/listings" class="btn btn-primary">View All Listings</a>
        </div>
      </section>
      <div class="container">
        <h2 style="text-align: center; margin: 2rem 0;">Featured Properties</h2>
        <div class="listing-grid">
          ${listings && listings.length > 0 ? listings.map(listing => `
            <div class="listing-card">
              <div class="content">
                <h3>${listing.title}</h3>
                <p class="price">$${listing.price.toLocaleString()}</p>
                <div class="details">
                  <span>${listing.bedrooms} beds</span>
                  <span>${listing.bathrooms} baths</span>
                  <span>${listing.area} sqft</span>
                </div>
                <p>${listing.address || ''}</p>
                <a href="/site/${tenant.slug}/listing/${listing.id}" class="btn" style="margin-top: 0.5rem;">View Details</a>
              </div>
            </div>
          `).join('') : '<p style="text-align: center;">No listings available yet.</p>'}
        </div>
        ${renderContactForm(tenant.slug)}
        ${renderValuationForm(tenant.slug)}
      </div>
    `;
  } else if (view === 'listings') {
    content = `
      <div class="container">
        <h2 style="text-align: center; margin: 2rem 0;">All Properties</h2>
        <div class="listing-grid">
          ${listings && listings.length > 0 ? listings.map(listing => `
            <div class="listing-card">
              <div class="content">
                <h3>${listing.title}</h3>
                <p class="price">$${listing.price.toLocaleString()}</p>
                <div class="details">
                  <span>${listing.bedrooms} beds</span>
                  <span>${listing.bathrooms} baths</span>
                  <span>${listing.area} sqft</span>
                </div>
                <p>${listing.address || ''}</p>
                <a href="/site/${tenant.slug}/listing/${listing.id}" class="btn" style="margin-top: 0.5rem;">View Details</a>
              </div>
            </div>
          `).join('') : '<p style="text-align: center;">No listings available yet.</p>'}
        </div>
      </div>
    `;
  } else if (view === 'detail' && listing) {
    content = `
      <div class="container listing-detail">
        <div style="margin: 2rem 0;">
          <a href="/site/${tenant.slug}/listings" style="color: #667eea; text-decoration: none;">← Back to listings</a>
        </div>
        <div class="image" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>
        <h2>${listing.title}</h2>
        <p class="price" style="font-size: 2rem; color: #667eea; font-weight: bold;">$${listing.price.toLocaleString()}</p>
        <div class="details-grid">
          <div><strong>Bedrooms:</strong> ${listing.bedrooms}</div>
          <div><strong>Bathrooms:</strong> ${listing.bathrooms}</div>
          <div><strong>Area:</strong> ${listing.area} sqft</div>
          <div><strong>Address:</strong> ${listing.address || 'Not specified'}</div>
          <div><strong>Status:</strong> ${listing.status}</div>
        </div>
        <p style="margin: 1rem 0;">${listing.description || ''}</p>
        
        ${renderAgentBio(listing)}
        
        <h3 style="margin-top: 2rem;">Similar Properties</h3>
        <div class="listing-grid">
          ${similarListings && similarListings.length > 0 ? similarListings.map(l => `
            <div class="listing-card">
              <div class="content">
                <h3>${l.title}</h3>
                <p class="price">$${l.price.toLocaleString()}</p>
                <a href="/site/${tenant.slug}/listing/${l.id}" class="btn" style="margin-top: 0.5rem;">View Details</a>
              </div>
            </div>
          `).join('') : '<p>No similar listings found.</p>'}
        </div>
        
        ${renderContactForm(tenant.slug)}
        ${renderValuationForm(tenant.slug)}
      </div>
    `;
  }

  return header + content + footer;
}

function renderAgentBio(listing) {
  if (!listing.agent_name) return '';
  return `
    <div class="agent-bio">
      <div class="avatar">${listing.agent_name.charAt(0)}</div>
      <div>
        <h3>${listing.agent_name}</h3>
        <p>${listing.agent_phone || ''}</p>
        <p>${listing.agent_email || ''}</p>
      </div>
    </div>
  `;
}

function renderContactForm(slug) {
  return `
    <div id="contact" class="contact-form">
      <h3>Contact Us</h3>
      <form id="contactForm" onsubmit="submitLead(event, 'contact')">
        <div class="form-group">
          <label>Name</label>
          <input type="text" name="name" required>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" name="email" required>
        </div>
        <div class="form-group">
          <label>Phone</label>
          <input type="tel" name="phone">
        </div>
        <div class="form-group">
          <label>Message</label>
          <textarea name="message" rows="4"></textarea>
        </div>
        <button type="submit" class="btn btn-primary">Send Message</button>
        <div id="contactResponse" style="margin-top: 1rem;"></div>
      </form>
    </div>
  `;
}

function renderValuationForm(slug) {
  return `
    <div id="valuation" class="valuation-form">
      <h3>Free Property Valuation</h3>
      <form id="valuationForm" onsubmit="submitLead(event, 'valuation')">
        <div class="form-group">
          <label>Name</label>
          <input type="text" name="name" required>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" name="email" required>
        </div>
        <div class="form-group">
          <label>Phone</label>
          <input type="tel" name="phone">
        </div>
        <div class="form-group">
          <label>Property Address</label>
          <input type="text" name="property_address">
        </div>
        <button type="submit" class="btn btn-primary">Request Valuation</button>
        <div id="valuationResponse" style="margin-top: 1rem;"></div>
      </form>
    </div>
  `;
}

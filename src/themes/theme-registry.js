// src/themes/theme-registry.js
import { renderModernBusinessTheme } from './theme-modern-business.js';
import { renderCreativeAgencyTheme } from './theme-creative-agency.js';
import { renderMinimalBlogTheme } from './theme-minimal-blog.js';
import { renderSaaSLandingTheme } from './theme-saas-landing.js';
import { renderCommunityForumTheme } from './theme-community-forum.js';

const themeRegistry = {
  'modern-business': renderModernBusinessTheme,
  'creative-agency': renderCreativeAgencyTheme,
  'minimal-blog': renderMinimalBlogTheme,
  'saas-landing': renderSaaSLandingTheme,
  'community-forum': renderCommunityForumTheme
};

export async function renderTheme(request, env, tenantInfo) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Extract the view type from path
  // /site/[slug]/ -> home
  // /site/[slug]/listings -> listings
  // /site/[slug]/listing/[id] -> detail
  const pathParts = path.split('/').filter(p => p);
  let view = 'home';
  let id = null;

  if (pathParts.length > 2) {
    if (pathParts[2] === 'listings') {
      view = 'listings';
      if (pathParts.length > 3 && pathParts[3] === 'listing' && pathParts.length > 4) {
        view = 'detail';
        id = pathParts[4];
      }
    }
  }

  // Get theme renderer
  const themeName = tenantInfo.theme || 'modern-business';
  const renderer = themeRegistry[themeName];

  if (!renderer) {
    return new Response(`Theme "${themeName}" not found`, { status: 404 });
  }

  try {
    // Fetch data for the view
    const db = env.DB;
    let data = {};

    if (view === 'home') {
      // Get featured listings
      const { results } = await db.prepare(
        "SELECT * FROM listings WHERE tenant_id = ? AND status = 'active' AND featured = 1 ORDER BY created_at DESC LIMIT 6"
      ).bind(tenantInfo.id).all();
      data.listings = results;
      data.tenant = tenantInfo;
    } else if (view === 'listings') {
      const { results } = await db.prepare(
        "SELECT * FROM listings WHERE tenant_id = ? AND status = 'active' ORDER BY created_at DESC"
      ).bind(tenantInfo.id).all();
      data.listings = results;
      data.tenant = tenantInfo;
    } else if (view === 'detail' && id) {
      const listing = await db.prepare(
        "SELECT * FROM listings WHERE id = ? AND tenant_id = ? AND status = 'active'"
      ).bind(id, tenantInfo.id).first();
      if (!listing) {
        return new Response('Listing not found', { status: 404 });
      }
      data.listing = listing;
      data.tenant = tenantInfo;

      // Get similar listings
      const { results } = await db.prepare(
        "SELECT * FROM listings WHERE tenant_id = ? AND status = 'active' AND id != ? ORDER BY created_at DESC LIMIT 4"
      ).bind(tenantInfo.id, id).all();
      data.similarListings = results;
    }

    // Render with appropriate theme
    const html = await renderer(data, view, request);
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    console.error('Theme rendering error:', error);
    return new Response('Error rendering theme', { status: 500 });
  }
}

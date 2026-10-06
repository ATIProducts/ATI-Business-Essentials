// lib/site.js
// The website's public address and name, used in new pages' and blog posts'
// search-engine tags and sitemap entries. Change them here (or set SITE_URL
// in Vercel) if the site ever moves to a different domain.
const SITE_URL = String(process.env.SITE_URL || 'https://ati-businessessentials.com').replace(/\/+$/, '');
const SITE_NAME = 'ATI Business Essentials';
const LEGAL_NAME = 'ATI Business Essentials, LLC';
const DEFAULT_IMAGE = 'images/leads-plus-dashboard.webp';
module.exports = { SITE_URL, SITE_NAME, LEGAL_NAME, DEFAULT_IMAGE };

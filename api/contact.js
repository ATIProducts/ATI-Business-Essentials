// api/contact.js
//
// Receives the website's contact forms and delivers each lead. There is no
// database: leads are delivered by email and/or forwarded to another system.
// Set at least ONE of these in Vercel (Settings → Environment Variables):
//
//   RESEND_API_KEY +       Email through Resend (resend.com, free up to 3,000
//   LEAD_NOTIFY_EMAIL      emails a month), sent to LEAD_NOTIFY_EMAIL
//                          (comma-separate several). Until you verify your
//                          domain in Resend, LEAD_NOTIFY_EMAIL must be the
//                          email you signed up to Resend with. After verifying,
//                          set LEAD_FROM_EMAIL (e.g. Website <web@your-domain>).
//   LEAD_WEBHOOK_URL       Also POSTs every lead as JSON to this address
//                          (Leads Plus intake, Zapier, Make, etc.).
//
// The form keeps working without JavaScript too: a plain form post gets a
// simple thank-you page back.

const clip = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function parseBody(req) {
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = Object.fromEntries(new URLSearchParams(body)); }
  }
  return body && typeof body === 'object' ? body : {};
}

function reply(req, res, status, payload) {
  const wantsJson = String(req.headers['content-type'] || '').includes('application/json');
  if (wantsJson) return res.status(status).json(payload);
  const ok = status < 300;
  res.status(status).setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${ok ? 'Thank you' : 'Message not sent'} | ATI Business Essentials</title><link rel="stylesheet" href="/assets/site.css"></head><body><main class="section"><div class="wrap" style="max-width:640px;text-align:center"><h1>${ok ? 'Thanks, we got it.' : 'Your message did not send'}</h1><p>${esc(ok ? 'A member of our team will reach out shortly, usually within one business day.' : payload.error)}</p><p><a class="btn btn-primary" href="/">Back to the home page</a></p></div></main></body></html>`);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const body = parseBody(req);

  // Hidden "company_website" field: people never see it, bots fill it in.
  if (clip(body.company_website, 200)) return reply(req, res, 200, { ok: true });

  const lead = {
    name: clip(body.name, 200),
    email: clip(body.email, 320),
    phone: clip(body.phone, 50),
    service: clip(body.service, 120),
    message: clip(body.message, 5000),
    page: clip(body.page, 500) || clip(req.headers.referer, 500),
    gclid: clip(body.gclid, 500) || clip(body.gbraid, 500) || clip(body.wbraid, 500),
    utm_source: clip(body.utm_source, 200), utm_medium: clip(body.utm_medium, 200), utm_campaign: clip(body.utm_campaign, 200),
    utm_term: clip(body.utm_term, 200), utm_content: clip(body.utm_content, 200),
    referrer: clip(body.referrer, 500), landing: clip(body.landing, 500),
  };
  if (!lead.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    return reply(req, res, 400, { error: 'Please enter your name and a valid email address.' });
  }

  const labels = { name: 'Name', email: 'Email', phone: 'Phone', service: 'Service', message: 'Message', page: 'Page', gclid: 'Google Ads click ID', utm_source: 'UTM source', utm_medium: 'UTM medium', utm_campaign: 'UTM campaign', utm_term: 'UTM term', utm_content: 'UTM content', referrer: 'Referrer', landing: 'Landing page' };
  const rows = Object.keys(labels).filter((k) => lead[k]);
  const subject = `New website lead: ${lead.name}${lead.service ? ` (${lead.service})` : ''}`;
  const tasks = [];

  if (process.env.RESEND_API_KEY && process.env.LEAD_NOTIFY_EMAIL) {
    tasks.push(fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.LEAD_FROM_EMAIL || 'ATI Website <onboarding@resend.dev>',
        to: process.env.LEAD_NOTIFY_EMAIL.split(',').map((s) => s.trim()).filter(Boolean),
        reply_to: lead.email,
        subject,
        html: rows.map((k) => `<p><strong>${labels[k]}:</strong> ${esc(lead[k]).replace(/\n/g, '<br>')}</p>`).join(''),
      }),
    }));
  }
  if (process.env.LEAD_WEBHOOK_URL) {
    tasks.push(fetch(process.env.LEAD_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...lead, source: 'ati-businessessentials.com', submitted_at: new Date().toISOString() }) }));
  }

  if (!tasks.length) {
    console.error('Contact form: no delivery method set (RESEND_API_KEY + LEAD_NOTIFY_EMAIL, or LEAD_WEBHOOK_URL).');
    return reply(req, res, 503, { error: 'We could not send your message right now. Please call (800) 360-6115.' });
  }
  const results = await Promise.allSettled(tasks);
  const delivered = results.some((r) => r.status === 'fulfilled' && r.value.ok);
  results.forEach((r) => { if (r.status === 'rejected' || !r.value.ok) console.error('Lead delivery failed', r.status === 'rejected' ? r.reason : r.value.status); });
  if (!delivered) return reply(req, res, 502, { error: 'We could not send your message right now. Please call (800) 360-6115.' });
  return reply(req, res, 200, { ok: true });
};

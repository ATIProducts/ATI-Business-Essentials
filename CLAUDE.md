# Notes for Claude (and other AI coding agents)

- Static HTML site on Vercel (`cleanUrls`, no trailing slash). Each page is a root-level `.html` file; shared styles in `assets/site.css`, behavior in `assets/site.js`.
- Non-technical editing happens in `/admin` (a git-based CMS ported from the ATI Products site). It edits these HTML files in place and commits through the GitHub API. Keep pages parseable by `admin/editor-core.js`: visible text in normal elements, menus inside `<nav>`, footer in `<footer>`.
- Pages were normalized with the editor's own parse/serialize so saving with no edits changes nothing. After hand-editing HTML, keep that format (one tag per line, no React comments).
- New pages and posts come from `admin/templates/*.html` ({{PLACEHOLDER}} markers, see `lib/pageTemplate.js` and `lib/blogTemplate.js`). Blog cards are inserted after `<div class="blog-grid">` in `blog.html`. New page links go in the footer list with class `footer-col-explore`.
- The header, footer and cookie notice repeat on every page: change them everywhere at once.
- Structured data lives in each page's `<script type="application/ld+json">`. If prices or key facts change, update the matching JSON-LD, `llms.txt` and `llms-full.txt` too.
- Leads are delivered by `api/contact.js` (Resend email and/or webhook). Never store leads in this repo; it is public.
- Copy rules: no em dashes. Keep WCAG AA contrast: `--green` (#00B74F) only on dark backgrounds, `--green-ink` (#00843D) on light ones.

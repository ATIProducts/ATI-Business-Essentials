# ATI Business Essentials: Site and Admin Setup

This is the website for ati-businessessentials.com. It works exactly like the
ATI Products site: plain HTML pages in this GitHub repo, hosted on Vercel, with
a password-protected **/admin** where you click on any page and type to edit it.
There is no database and nothing extra to pay for.

## How it works

- Every page is a `.html` file in this repo (`index.html` is the home page,
  `leads-plus.html` is /leads-plus, and so on). Vercel serves them without the
  `.html` on the end.
- Logging in at **/admin** and clicking **Publish** saves your change straight
  into this GitHub repo. Vercel sees the new commit and updates the live site,
  usually within about a minute.
- The contact forms send each lead to `/api/contact`, which emails it to you
  (and can also forward it to another system). Leads are never stored in this
  repo, because the repo is visible to anyone who has its address.

## One-time setup (about 20 minutes)

### Step 1: Import the repo into Vercel

1. In Vercel, click **Add New → Project** and import this repo.
2. Framework preset: **Other**. Leave the build and output settings empty.
3. Click **Deploy**. The site is now live on a `*.vercel.app` address.

### Step 2: Create a GitHub access token for the admin

1. GitHub → **Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token**.
2. Name it `ati-be-site-admin`. Resource owner: **ATIProducts**.
3. **Repository access → Only select repositories** → pick this repo.
4. **Permissions → Repository permissions → Contents: Read and write.**
   Leave everything else as No access.
5. Generate it and copy it. GitHub shows it only once.

### Step 3: Pick a password and a session secret

Make two different long random strings (a password manager can generate them,
or run `openssl rand -base64 32` twice). One is the main admin password, the
other is the session secret that nobody ever types.

### Step 4: Set up lead emails

The contact forms need somewhere to send leads. Set up at least one:

- **Email through Resend (recommended).** Sign up free at resend.com with the
  inbox that should receive leads, then create an API key. Until you verify
  your domain in Resend, leads can only be sent to that same sign-up email.
  After you verify ati-businessessentials.com there, you can send to any inbox
  and set `LEAD_FROM_EMAIL`.
- **Forward to another system.** Set `LEAD_WEBHOOK_URL` to any address that
  accepts JSON (your Leads Plus intake, Zapier, Make). You can use this
  together with email.

### Step 5: Add the settings in Vercel

Vercel → your project → **Settings → Environment Variables**:

| Variable | Value |
|---|---|
| `GITHUB_TOKEN` | the token from Step 2 |
| `GITHUB_OWNER` | `ATIProducts` |
| `GITHUB_REPO` | this repo's name |
| `GITHUB_BRANCH` | `main` |
| `ADMIN_USERNAME` | the main login name, e.g. `admin` |
| `ADMIN_PASSWORD` | the password from Step 3 |
| `SESSION_SECRET` | the second string from Step 3 |
| `RESEND_API_KEY` | from Step 4 (if using Resend) |
| `LEAD_NOTIFY_EMAIL` | where leads go, e.g. `info@ati-businessessentials.com` |
| `LEAD_FROM_EMAIL` | optional, after verifying your domain in Resend |
| `LEAD_WEBHOOK_URL` | optional |
| `SITE_URL` | optional, defaults to `https://ati-businessessentials.com` |

Then go to **Deployments** and click **Redeploy** so the settings take effect.

### Step 6: Log in

Go to `https://<your-site>/admin/login.html` and log in with `ADMIN_USERNAME`
and `ADMIN_PASSWORD`. Add other people on the **People & logins** screen.

### Step 7: Switch the domain (when you are ready to leave WordPress)

1. Vercel → **Settings → Domains** → add `ati-businessessentials.com` and
   `www.ati-businessessentials.com`.
2. At your domain registrar, change the DNS records to what Vercel shows you.
3. In Google Search Console, submit `https://ati-businessessentials.com/sitemap.xml`.
4. In Bing Webmaster Tools, import the site from Search Console.

All images already live in this repo, so nothing depends on the old WordPress
server once DNS points to Vercel. Old WordPress addresses (like `/pricing-2/`,
WooCommerce product pages, the cart and `/wp-admin`) redirect to the right new
pages through `vercel.json`. Addresses that used a trailing slash
(`/leads-plus/`) redirect to the same page without it (`/leads-plus`).

## Day to day

- **Change words:** open the page from the list on the left, click the words,
  type, then click **Publish**.
- **Change a photo:** click it, paste a new one (Ctrl+V), add a short
  description for Google, then **Publish**.
- **Google listing:** open **Google search listing** above the page to change
  its title and description.
- **New page:** **+ New Page** builds a simple page in the site's style, or
  copies an existing page for you to change.
- **New blog post:** **+ New Blog Post** creates the article page, adds it to
  the Blog page (`/blog`) and to the sitemap. The Blog page is not linked in
  the menu yet. After the first few posts, ask Claude to add it to the menu
  and footer.
- **Activity log:** shows who changed what, and links to each change on GitHub.

## What the editor can't change

The top menu, the footer, and the layout of sections are the same on every
page, so they can't be changed from the page editor. Ask Claude for those, or
use **Advanced: edit code** on a page if you are comfortable with HTML.

## Search, AI and accessibility features already built in

- Every main page opens with a short "Quick answer" box that search engines
  and AI assistants (ChatGPT, Claude, Perplexity, Google AI) can quote.
- 35 FAQs across the site, collected on `/faq`, all marked up so Google can
  show them.
- Structured data on every page: Organization, WebSite, WebPage,
  Breadcrumbs, FAQ, Service or SoftwareApplication with prices, and the
  founders as Person entries.
- `sitemap.xml`, `robots.txt` (AI crawlers explicitly allowed), and
  `llms.txt` / `llms-full.txt`, a plain summary of the whole site written for
  AI assistants. If you change prices or major facts in the admin, also ask
  Claude to refresh `llms.txt` and `llms-full.txt`.
- Google Tag Manager (`GTM-WPFWLV7C`) with Consent Mode v2 and a cookie
  banner. Every form submission sends a `generate_lead` event to Tag Manager
  for Google Ads conversion tracking, and the email includes the Google Ads
  click ID (gclid) and UTM tags when present.
- WCAG AA color contrast, a skip link, keyboard-friendly menus, labeled form
  fields, and one main heading per page.

## Security

The admin's password check runs on the server, sessions expire after 7 days,
and every person gets their own login. The list of people is stored encrypted
in `admin/users.enc.json` (created the first time you add someone). Don't change
`SESSION_SECRET` after people have been added, or their logins stop working.

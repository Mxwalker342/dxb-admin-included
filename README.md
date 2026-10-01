# DXB Cafe

A responsive static website with a zero-dependency Node.js preview server, Supabase-backed preorders and table requests, and a protected staff dashboard.

## Orders and reservations

Open `/order.html` for pickup/dine-in food preorders and table reservation requests. `/admin.html` is the staff dashboard for bookings, payment status, menu prices, and availability. Checkout uses payment at the cafe; WhatsApp opens a prepared message for the customer to send to +91 96561 10056.

**Database connection and deployment instructions: [SETUP.md](SETUP.md).** Online submission is disabled until Supabase is configured. Vercel configuration is included, but its free Hobby plan does not permit commercial cafe hosting.

## Run locally

From this directory run `npm start`, then open http://127.0.0.1:4173.

## Edit

- `dist/index.html`: sections, business information, photos and external links.
- `dist/style.css`: visual theme, responsive layout and animations.
- `dist/app.js`: all 47 menu entries, categories, prices and interactions.
- `dist/assets/`: locally hosted imagery.

Serve the `dist` directory on a static host. `npm run build` writes public configuration from environment variables. The Node server is intended for local preview. Runtime code has no package dependencies; `npm install` installs the test-only embedded PostgreSQL dependency.

## Business details

Verified against the user-provided Google Maps listing on 30 September 2026:
Nalanchira, Thiruvananthapuram, Kerala 695015; phone +91 96561 10056; daily noon–1 am. Holiday hours may vary.
Instagram: https://www.instagram.com/__d___x___b__/
Maps: https://maps.app.goo.gl/ucX2HAV7JxYeBDLz7
WhatsApp now uses +91 96561 10056, supplied by the owner for orders on 1 October 2026. Telephone links retain the listed cafe phone. WhatsApp availability was not independently confirmed.

## Photography

The hero, two beef-burger cards, French toast, pasta and shakes use licensed Pexels stock photography. Actual DXB photos from the supplied Google Maps listing appear in the about, gaming, dessert and gallery sections. Specific menu dishes may differ from photographs. See ASSET-SOURCES.json and DXB-PHOTO-SOURCES.json for provenance. The gaming photo depicts console play, so the page uses 'Gaming setups' rather than unverified PC specifications.

## Validation

`npm run check` checks JavaScript syntax. `npm test` covers India-time scheduling, WhatsApp content, HTML escaping, and embedded PostgreSQL integration for order creation, retries, invalid orders, table guest counts, rate limits, and staff/guest RLS permissions. Hosted Supabase Auth and deployment still require the setup and smoke tests in SETUP.md.

JavaScript syntax checked. Browser checks covered all 47 entries and prices across seven top-level categories, expanded categories, mobile navigation, lightbox open/Escape close, and desktop/mobile layouts. Reduced-motion preferences disable decorative animations and parallax. Images below the hero load lazily.
"# dxb-finalz" 

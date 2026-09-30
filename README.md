# DXB Cafe

A responsive static website with a zero-dependency Node.js preview server.

## Run locally

From this directory run `npm start`, then open http://127.0.0.1:4173.

## Edit

- `dist/index.html`: sections, business information, photos and external links.
- `dist/style.css`: visual theme, responsive layout and animations.
- `dist/app.js`: all 47 menu entries, categories, prices and interactions.
- `dist/assets/`: locally hosted imagery.

No build step or dependencies are needed. Serve the `dist` directory on any static host. The Node server is intended for local preview.

## Business details

Verified against the user-provided Google Maps listing on 30 September 2026:
Nalanchira, Thiruvananthapuram, Kerala 695015; phone +91 96561 10056; daily noon–1 am. Holiday hours may vary.
Instagram: https://www.instagram.com/__d___x___b__/
Maps: https://maps.app.goo.gl/ucX2HAV7JxYeBDLz7
WhatsApp uses the listed telephone number; WhatsApp availability was not independently confirmed.

## Photography

The hero, two beef-burger cards, French toast, pasta and shakes use licensed Pexels stock photography. Actual DXB photos from the supplied Google Maps listing appear in the about, gaming, dessert and gallery sections. Specific menu dishes may differ from photographs. See ASSET-SOURCES.json and DXB-PHOTO-SOURCES.json for provenance. The gaming photo depicts console play, so the page uses 'Gaming setups' rather than unverified PC specifications.

## Validation

JavaScript syntax checked. Browser checks covered all 47 entries and prices across seven top-level categories, expanded categories, mobile navigation, lightbox open/Escape close, and desktop/mobile layouts. Reduced-motion preferences disable decorative animations and parallax. Images below the hero load lazily.

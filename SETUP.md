# DXB ordering and staff setup

The website now supports food preorders for pickup/dine-in, table requests, a cart, checkout (pay at the café), WhatsApp handoff and a staff dashboard. All requests start pending. Staff must contact the customer to confirm. Table inventory is not allocated automatically. No online payment processor is included.

## 1. Create the database

1. Create a Supabase Free project at https://supabase.com/dashboard. Save its database password securely; it does not belong in this website.
2. In SQL Editor, run `supabase/schema.sql` once, then `supabase/seed.sql`.
3. In Authentication settings, disable new user signups. Customers do not need accounts.
4. In Authentication → Users, create a staff user with an email and strong password. Use an email you control. Confirm the account through the dashboard if needed.
5. Grant that user the staff role using SQL (replace the email):

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || '{"cafe_role":"admin"}'::jsonb
where email = 'owner@example.com';
```

Sign out and back in after changing roles. Staff role comes from protected app metadata, never user-editable metadata. For removal, remove the role and revoke their sessions; already-issued access tokens can remain valid until expiry. Password resets are handled through Supabase, not public signup.

## 2. Connect the website

From Supabase Project Settings / API, copy the project URL and **publishable key** (or legacy **anon** key). Never use a secret or service-role key in this static site.

Either edit `dist/config.js`, or set these build environment variables:

```text
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
WHATSAPP_NUMBER=919656110056
```

Then run `npm run build`. These values are intentionally public; database row-level security protects orders. The build refuses known privileged keys. There are no paid WhatsApp APIs. The destination uses the supplied number 9656110056 with India's +91 country code; verify that this account has WhatsApp enabled.

## 3. Preview and deploy

Run `npm start` and visit http://127.0.0.1:4173. Order page: `/order.html`. Staff dashboard: `/admin.html`. Without Supabase configuration, the menu can be previewed but submission and staff login are disabled.

For Vercel, import this project, select Other as the framework, use `npm run build` and output directory `dist`. `vercel.json` contains these settings. Add the environment variables above and redeploy. No Node server needs to run in production. The existing Node server is for local preview only.

**Hosting cost:** Vercel Hobby is limited to personal/non-commercial projects. A real café ordering site requires a qualifying paid Vercel plan or another static host whose free terms permit your commercial use. This repository works on static hosts that serve `dist`; it does not depend on Vercel functions. See https://vercel.com/docs/plans/hobby.

Supabase Free includes 500 MB database storage and can pause after a period of inactivity. Check current limits before launch: https://supabase.com/pricing and https://supabase.com/docs/guides/platform/free-project-pausing. Export/back up important order records and monitor usage. Free does not mean unlimited or guaranteed availability.

## Staff operation

- Sign in at `/admin.html`. Sessions remain in memory only; reload requires sign-in. Access tokens refresh during use.
- Filter requests by status and arrival date (India time); Refresh fetches new requests, Load more paginates older ones.
- Check capacity before confirming a table. Save the status and contact the customer separately. Status changes do not send automatic messages.
- Mark payment paid only after collecting it at the café.
- Manage prices and sold-out items under Menu management. Saved orders retain price snapshots. Homepage prices sync from the live catalogue when connected.
- Initial fries price variants use “option 1/2/3” because the original website did not identify portion names. Verify these names and all prices in Supabase before launch. Hours are noon–1 am IST, booking window 30 minutes–30 days, party sizes 1–20.

## Security and launch checks

Anonymous clients cannot select or update orders, or change menu prices. The database function validates each item, current price, quantity, booking date and business hours, and computes totals in the database. UUID request IDs make identical retries idempotent. A per-phone throttle limits requests to five per 15 minutes; this is basic abuse protection, not proof of phone ownership. For high-traffic exposure, add server-verified CAPTCHA and stronger edge rate limits.

Run `npm run check` and `npm test`. Before accepting real customers, connect a test Supabase project and verify:

1. Create a pickup order, dine-in preorder, and table request; check the dashboard records and WhatsApp destination/content.
2. Retry the identical request UUID/payload: one row, same reference. Edited payload with an already-used UUID is rejected.
3. Try a changed price, unavailable item, invalid date, and out-of-hours request: each rejected.
4. With the public key only, orders must be unreadable; a signed-in non-staff user must not see any orders or update the menu.
5. Change status and payment, change a price, mark an item sold out, then reload the ordering page.

The local test suite checks scheduling/WhatsApp/escaping and runs the actual schema in embedded PostgreSQL (PGlite) with mocked auth claims to exercise checkout, retries, invalid requests, rate limits and RLS permissions. It does not replace live Supabase authentication and deployment tests. The schema has not been applied to a hosted database until you complete step 1.

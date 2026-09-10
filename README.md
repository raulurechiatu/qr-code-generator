# QR Code Generator

A QR code generator with three tiers:

- **Static generator** (`/`) — free, no account needed. Enter text or a URL,
  get a QR code, download the PNG.
- **Dynamic QR codes** (`/dashboard`, behind sign-in) — QR codes that redirect
  through a short link you control, so the destination can be edited after
  the code is printed, with scan analytics (count, device, browser, over
  time). Free accounts get up to 3 dynamic QR codes.
- **Pro** — a one-time $19 purchase (Stripe Checkout) unlocks unlimited
  dynamic QR codes and the [developer API](API.md).

## Stack

Vite + React + TypeScript on the frontend, [Supabase](https://supabase.com)
(Postgres, Auth, Edge Functions) for the backend.

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project at [supabase.com](https://supabase.com), then
   copy `.env.example` to `.env.local` and fill in your project's URL and
   anon key (Project Settings → API):

   ```bash
   cp .env.example .env.local
   ```

3. Apply the database schema. With the [Supabase CLI](https://supabase.com/docs/guides/cli):

   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```

4. Deploy the Edge Functions. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
   are auto-injected into every function by Supabase — don't set them
   yourself (`supabase secrets set` rejects any name starting with
   `SUPABASE_`). The public-facing functions (`redirect`, `api`,
   `stripe-webhook`) need JWT verification disabled since their callers never
   carry a Supabase session:

   ```bash
   npx supabase functions deploy redirect --no-verify-jwt
   npx supabase functions deploy api --no-verify-jwt
   npx supabase functions deploy stripe-webhook --no-verify-jwt
   npx supabase functions deploy create-checkout-session
   ```

5. In Supabase Auth settings, make sure email OTP / magic link sign-in is
   enabled (it is by default), and add your local dev URL
   (`http://localhost:5173`) to the redirect URL allow-list.

6. Set up billing (only needed for the Pro upgrade flow — the app works
   without it, just without a way to upgrade). Get your Stripe **secret key**
   from Developers → API keys, then:

   ```bash
   npx supabase secrets set STRIPE_SECRET_KEY=<your-stripe-secret-key>
   ```

   Register the webhook endpoint (returns a signing secret, shown only once):

   ```bash
   curl -X POST https://api.stripe.com/v1/webhook_endpoints \
     -u "<your-stripe-secret-key>:" \
     -d "url=https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook" \
     -d "enabled_events[]=checkout.session.completed"
   ```

   ```bash
   npx supabase secrets set STRIPE_WEBHOOK_SECRET=<the-secret-from-the-response>
   ```

7. Run the app:

   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check and build for production
- `npm run lint` — run oxlint
- `npm run preview` — preview a production build locally

## API

See [API.md](API.md) for the developer API reference (create/update dynamic
QR codes, fetch analytics, authenticate with an API key).

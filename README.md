# QR Code Generator

A QR code generator with two tiers:

- **Static generator** (`/`) — free, no account needed. Enter text or a URL,
  get a QR code, download the PNG.
- **Dynamic QR codes** (`/dashboard`, behind sign-in) — QR codes that redirect
  through a short link you control, so the destination can be edited after
  the code is printed, with scan analytics (count, device, browser, over
  time). Also exposed as a [developer API](API.md) with API keys.

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

4. Deploy the Edge Functions (the public redirect handler and the developer
   API), and set the service-role secret they need:

   ```bash
   npx supabase functions deploy redirect
   npx supabase functions deploy api
   npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   ```

   The service-role key is found in Project Settings → API. Never put it in
   `.env.local` or any frontend code — it belongs only to the Edge Functions.

5. In Supabase Auth settings, make sure email OTP / magic link sign-in is
   enabled (it is by default), and add your local dev URL
   (`http://localhost:5173`) to the redirect URL allow-list.

6. Run the app:

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

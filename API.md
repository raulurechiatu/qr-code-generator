# Developer API

Create and manage dynamic QR codes programmatically. Generate an API key from
`/dashboard/api-keys` after signing in, then send it as a bearer token.

Base URL: `https://<your-project-ref>.supabase.co/functions/v1/api`

All requests must include:

```
Authorization: Bearer <your-api-key>
```

Each key is rate-limited (default 60 requests/minute). Exceeding the limit
returns `429`.

## Create a dynamic QR code

```
POST /
Content-Type: application/json

{
  "destination_url": "https://example.com",
  "label": "Storefront flyer"   // optional
}
```

Response `201`:

```json
{
  "id": "…",
  "short_id": "aB3xY9kL",
  "redirect_url": "https://<project-ref>.supabase.co/functions/v1/redirect/aB3xY9kL"
}
```

Encode `redirect_url` as the QR code image. Scanning it redirects to
`destination_url` and logs a scan.

## List your QR codes

```
GET /
```

Response `200`: `{ "data": [ { "id", "short_id", "destination_url", "label", "is_active", "created_at" }, ... ] }`

## Update a QR code's destination

```
PATCH /<id>
Content-Type: application/json

{ "destination_url": "https://new-destination.com" }
```

Any of `destination_url`, `label`, `is_active` may be included.

## Get scan analytics

```
GET /<id>/analytics
```

Response `200`:

```json
{
  "total_scans": 42,
  "by_device": { "mobile": 30, "desktop": 12 },
  "by_browser": { "Chrome": 25, "Safari": 17 }
}
```

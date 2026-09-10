import { getServiceClient } from '../_shared/supabaseAdmin.ts'
import { hashApiKey } from '../_shared/apiKey.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function randomShortId(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  for (const b of bytes) id += alphabet[b % alphabet.length]
  return id
}

async function authenticate(req: Request, supabase: ReturnType<typeof getServiceClient>) {
  const authHeader = req.headers.get('authorization') ?? ''
  const rawKey = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!rawKey) return { error: json({ error: 'Missing API key' }, 401) }

  const keyHash = await hashApiKey(rawKey)
  const { data: apiKey } = await supabase
    .from('api_keys')
    .select('id, owner_id, is_active, rate_limit_per_minute')
    .eq('key_hash', keyHash)
    .maybeSingle()

  if (!apiKey || !apiKey.is_active) {
    return { error: json({ error: 'Invalid API key' }, 401) }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_tier')
    .eq('id', apiKey.owner_id)
    .maybeSingle()

  if (profile?.plan_tier !== 'pro') {
    return { error: json({ error: 'The developer API requires a Pro plan. Upgrade at /dashboard.' }, 403) }
  }

  return { apiKey }
}

async function checkRateLimit(
  supabase: ReturnType<typeof getServiceClient>,
  apiKeyId: string,
  limitPerMinute: number,
) {
  const since = new Date(Date.now() - 60_000).toISOString()
  const { count } = await supabase
    .from('api_usage')
    .select('id', { count: 'exact', head: true })
    .eq('api_key_id', apiKeyId)
    .gte('occurred_at', since)

  return (count ?? 0) >= limitPerMinute
}

async function logUsage(
  supabase: ReturnType<typeof getServiceClient>,
  apiKeyId: string,
  endpoint: string,
  statusCode: number,
) {
  await supabase.from('api_usage').insert({ api_key_id: apiKeyId, endpoint, status_code: statusCode })
  await supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', apiKeyId)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = getServiceClient()
  const { apiKey, error } = await authenticate(req, supabase)
  if (error) return error

  const url = new URL(req.url)
  // Path segments after /functions/v1/api/
  const segments = url.pathname.split('/').filter(Boolean)
  const apiIndex = segments.indexOf('api')
  const rest = segments.slice(apiIndex + 1) // e.g. [] or [':id'] or [':id', 'analytics']
  const endpointLabel = `${req.method} /api${rest.length ? '/' + rest.join('/') : ''}`

  const overLimit = await checkRateLimit(supabase, apiKey.id, apiKey.rate_limit_per_minute)
  if (overLimit) {
    await logUsage(supabase, apiKey.id, endpointLabel, 429)
    return json({ error: 'Rate limit exceeded' }, 429)
  }

  let response: Response

  try {
    if (req.method === 'POST' && rest.length === 0) {
      const body = await req.json().catch(() => ({}))
      if (!body.destination_url) {
        response = json({ error: 'destination_url is required' }, 400)
      } else {
        const shortId = randomShortId()
        const { data, error: insertError } = await supabase
          .from('qr_codes')
          .insert({
            owner_id: apiKey.owner_id,
            short_id: shortId,
            destination_url: body.destination_url,
            label: body.label ?? null,
          })
          .select('id, short_id')
          .single()

        if (insertError || !data) {
          response = json({ error: 'Failed to create QR code' }, 500)
        } else {
          const functionsBase = Deno.env.get('SUPABASE_URL')!.replace('.supabase.co', '.supabase.co/functions/v1')
          response = json(
            {
              id: data.id,
              short_id: data.short_id,
              redirect_url: `${functionsBase}/redirect/${data.short_id}`,
            },
            201,
          )
        }
      }
    } else if (req.method === 'GET' && rest.length === 0) {
      const { data } = await supabase
        .from('qr_codes')
        .select('id, short_id, destination_url, label, is_active, created_at')
        .eq('owner_id', apiKey.owner_id)
        .order('created_at', { ascending: false })
      response = json({ data: data ?? [] })
    } else if (req.method === 'PATCH' && rest.length === 1) {
      const id = rest[0]
      const body = await req.json().catch(() => ({}))
      const updates: Record<string, unknown> = {}
      if ('destination_url' in body) updates.destination_url = body.destination_url
      if ('label' in body) updates.label = body.label
      if ('is_active' in body) updates.is_active = body.is_active
      updates.updated_at = new Date().toISOString()

      const { data, error: updateError } = await supabase
        .from('qr_codes')
        .update(updates)
        .eq('id', id)
        .eq('owner_id', apiKey.owner_id)
        .select('id, short_id, destination_url, label, is_active')
        .maybeSingle()

      response = updateError || !data ? json({ error: 'QR code not found' }, 404) : json({ data })
    } else if (req.method === 'GET' && rest.length === 2 && rest[1] === 'analytics') {
      const id = rest[0]
      const { data: owned } = await supabase
        .from('qr_codes')
        .select('id')
        .eq('id', id)
        .eq('owner_id', apiKey.owner_id)
        .maybeSingle()

      if (!owned) {
        response = json({ error: 'QR code not found' }, 404)
      } else {
        const { data: scans } = await supabase
          .from('scans')
          .select('scanned_at, device_type, browser')
          .eq('qr_code_id', id)
          .order('scanned_at', { ascending: false })
          .limit(1000)

        const total = scans?.length ?? 0
        const byDevice: Record<string, number> = {}
        const byBrowser: Record<string, number> = {}
        for (const scan of scans ?? []) {
          byDevice[scan.device_type ?? 'unknown'] = (byDevice[scan.device_type ?? 'unknown'] ?? 0) + 1
          byBrowser[scan.browser ?? 'unknown'] = (byBrowser[scan.browser ?? 'unknown'] ?? 0) + 1
        }

        response = json({ total_scans: total, by_device: byDevice, by_browser: byBrowser })
      }
    } else {
      response = json({ error: 'Not found' }, 404)
    }
  } catch {
    response = json({ error: 'Internal error' }, 500)
  }

  await logUsage(supabase, apiKey.id, endpointLabel, response.status)
  return response
})

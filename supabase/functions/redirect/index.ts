import { getServiceClient } from '../_shared/supabaseAdmin.ts'
import { parseUserAgent } from '../_shared/ua.ts'

Deno.serve(async (req) => {
  const url = new URL(req.url)
  // Path is /functions/v1/redirect/<short_id>
  const shortId = url.pathname.split('/').filter(Boolean).pop()

  if (!shortId) {
    return new Response('Not found', { status: 404 })
  }

  const supabase = getServiceClient()

  const { data: qrCode, error } = await supabase
    .from('qr_codes')
    .select('id, destination_url, is_active')
    .eq('short_id', shortId)
    .maybeSingle()

  if (error || !qrCode || !qrCode.is_active) {
    return new Response('QR code not found or disabled', { status: 404 })
  }

  const { deviceType, browser } = parseUserAgent(req.headers.get('user-agent'))

  await supabase.from('scans').insert({
    qr_code_id: qrCode.id,
    user_agent: req.headers.get('user-agent'),
    device_type: deviceType,
    browser,
    referrer: req.headers.get('referer'),
  })

  return Response.redirect(qrCode.destination_url, 302)
})

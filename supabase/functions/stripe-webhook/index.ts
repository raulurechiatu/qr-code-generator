import { getServiceClient } from '../_shared/supabaseAdmin.ts'
import { verifyStripeSignature } from '../_shared/stripeSignature.ts'

Deno.serve(async (req) => {
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!webhookSecret) {
    return new Response('Webhook not configured', { status: 500 })
  }

  const rawBody = await req.text()
  const signatureHeader = req.headers.get('stripe-signature')

  const isValid = await verifyStripeSignature(rawBody, signatureHeader, webhookSecret)
  if (!isValid) {
    return new Response('Invalid signature', { status: 400 })
  }

  const event = JSON.parse(rawBody)
  const supabase = getServiceClient()

  // Idempotency: Stripe retries webhook deliveries, so skip events we've already applied.
  const { data: existing } = await supabase
    .from('stripe_events')
    .select('id')
    .eq('id', event.id)
    .maybeSingle()

  if (existing) {
    return new Response('Already processed', { status: 200 })
  }

  if (event.type === 'checkout.session.completed') {
    const userId = event.data?.object?.client_reference_id
    if (userId) {
      await supabase
        .from('profiles')
        .update({ plan_tier: 'pro', upgraded_at: new Date().toISOString() })
        .eq('id', userId)
    }
  }

  await supabase.from('stripe_events').insert({ id: event.id })

  return new Response('ok', { status: 200 })
})

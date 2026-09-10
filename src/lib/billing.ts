import { supabase } from './supabaseClient'

export async function startCheckout(): Promise<{ error: string | null }> {
  const { data, error } = await supabase.functions.invoke('create-checkout-session')

  if (error || !data?.url) {
    return { error: error?.message ?? 'Could not start checkout' }
  }

  window.location.href = data.url
  return { error: null }
}

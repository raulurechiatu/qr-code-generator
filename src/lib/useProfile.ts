import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useSession } from './useSession'

interface Profile {
  id: string
  plan_tier: string
}

export function useProfile() {
  const { session } = useSession()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      setProfile(null)
      setLoading(false)
      return
    }

    supabase
      .from('profiles')
      .select('id, plan_tier')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        setProfile(data)
        setLoading(false)
      })
  }, [session])

  return { profile, loading, isPro: profile?.plan_tier === 'pro' }
}

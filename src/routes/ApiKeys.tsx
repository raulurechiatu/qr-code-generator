import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { supabase } from '../lib/supabaseClient'
import { generateApiKey, hashApiKey } from '../lib/apiKey'
import { useSession } from '../lib/useSession'
import { useProfile } from '../lib/useProfile'
import UpgradeCard from '../components/UpgradeCard'

interface ApiKeyRow {
  id: string
  name: string | null
  key_prefix: string
  is_active: boolean
  created_at: string
  last_used_at: string | null
}

function ApiKeys() {
  const { session } = useSession()
  const { isPro, loading: profileLoading } = useProfile()
  const [keys, setKeys] = useState<ApiKeyRow[]>([])
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [newRawKey, setNewRawKey] = useState<string | null>(null)

  const loadKeys = async () => {
    const { data } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, is_active, created_at, last_used_at')
      .order('created_at', { ascending: false })
    setKeys(data ?? [])
  }

  useEffect(() => {
    loadKeys()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return
    setCreating(true)
    const { raw, prefix } = generateApiKey()
    const keyHash = await hashApiKey(raw)

    const { error } = await supabase.from('api_keys').insert({
      owner_id: session.user.id,
      name: name || null,
      key_hash: keyHash,
      key_prefix: prefix,
    })

    if (!error) {
      setNewRawKey(raw)
      setName('')
      await loadKeys()
    }
    setCreating(false)
  }

  const handleRevoke = async (id: string) => {
    await supabase.from('api_keys').update({ is_active: false }).eq('id', id)
    await loadKeys()
  }

  return (
    <div className="app">
      <div className="card wide">
        <Link to="/dashboard" className="back-link">
          &larr; Back
        </Link>

        <div className="card-header">
          <h1>API keys</h1>
          <p className="subtitle">Use these to create and manage QR codes programmatically</p>
        </div>

        {newRawKey && (
          <div className="key-reveal">
            <p>Copy your new key now — it won't be shown again:</p>
            <code>{newRawKey}</code>
            <button type="button" onClick={() => setNewRawKey(null)}>
              Done
            </button>
          </div>
        )}

        {!profileLoading && !isPro ? (
          <UpgradeCard reason="The developer API is a Pro feature." />
        ) : (
          <form onSubmit={handleCreate} className="form row">
            <input
              type="text"
              placeholder="Key name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create API key'}
            </button>
          </form>
        )}

        {keys.length === 0 ? (
          <p className="subtitle">No API keys yet.</p>
        ) : (
          <ul className="qr-list">
            {keys.map((key) => (
              <li key={key.id}>
                <div>
                  <strong>{key.name || 'Unnamed key'}</strong>
                  <span className={`status ${key.is_active ? 'active' : 'inactive'}`}>
                    {key.is_active ? 'Active' : 'Revoked'}
                  </span>
                </div>
                <span className="destination">{key.key_prefix}...</span>
                {key.is_active && (
                  <button type="button" className="secondary" onClick={() => handleRevoke(key.id)}>
                    Revoke
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default ApiKeys

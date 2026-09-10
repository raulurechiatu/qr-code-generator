import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { supabase } from '../lib/supabaseClient'
import { generateApiKey, hashApiKey } from '../lib/apiKey'
import { useSession } from '../lib/useSession'
import { useProfile } from '../lib/useProfile'
import UpgradeCard from '../components/UpgradeCard'
import { useDocumentMeta } from '../lib/useDocumentMeta'

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

  useDocumentMeta('API keys — QR Generator')

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
    <div className="app with-content">
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

      <div className="content-sections">
        <section>
          <h2>How it works</h2>
          <p>
            An API key lets your own code create and manage dynamic QR codes without using
            this dashboard. Each key is tied to your account, so any QR code it creates
            belongs to you and shows up here and on your{' '}
            <Link to="/dashboard">dashboard</Link>. Keys are stored as a one-way hash — we
            never keep the raw key after it's shown to you once at creation, so if you lose
            it, revoke it and create a new one rather than trying to recover it.
          </p>
          <p>
            The API is a <strong>Pro feature</strong>: it requires the one-time upgrade, since
            it's meant for people building something on top of dynamic QR codes rather than
            creating one or two by hand.
          </p>
        </section>

        <section>
          <h2>Walkthrough</h2>
          <p>
            <strong>1. Create a key.</strong> Use the form above — give it a name if you're
            planning to have more than one (e.g. one per app or environment), then copy the
            key immediately. It won't be shown again.
          </p>
          <p>
            <strong>2. Create a dynamic QR code from your own code.</strong>
          </p>
          <pre className="code-block">
{`curl -X POST https://<project-ref>.supabase.co/functions/v1/api \\
  -H "Authorization: Bearer <your-api-key>" \\
  -H "Content-Type: application/json" \\
  -d '{"destination_url": "https://example.com", "label": "My QR"}'`}
          </pre>
          <p>
            The response includes a <code>redirect_url</code> — encode that as a QR code
            image (any QR library works, since it's just a URL) and it will redirect to
            <code>destination_url</code> when scanned.
          </p>
          <p>
            <strong>3. Update the destination later, or pull analytics</strong> using the same
            key — see <code>API.md</code> in the project repository for the full endpoint
            list.
          </p>
        </section>

        <section>
          <h2>Frequently asked questions</h2>

          <details>
            <summary>What happens if I lose my key?</summary>
            <p>
              We can't show it to you again — we only store a hash of it, the same way a
              password would be stored. Revoke the lost key here and create a new one; any QR
              codes it already created are unaffected and stay under your account.
            </p>
          </details>

          <details>
            <summary>What do the error responses mean?</summary>
            <p>
              <code>401</code> means the key is missing, wrong, or has been revoked.{' '}
              <code>403</code> means the key is valid but the account isn't on Pro.{' '}
              <code>429</code> means you've exceeded the rate limit (60 requests/minute by
              default) — wait a minute and retry.
            </p>
          </details>

          <details>
            <summary>Can I have more than one key?</summary>
            <p>
              Yes — create as many as you like, for example separate keys per app or
              environment, so you can revoke one without affecting the others.
            </p>
          </details>

          <details>
            <summary>Do I need a key for every dynamic QR code?</summary>
            <p>
              No. One key can create and manage any number of QR codes under your account —
              you only need multiple keys if you want to isolate access between different
              tools or environments.
            </p>
          </details>
        </section>
      </div>
    </div>
  )
}

export default ApiKeys

import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { supabase } from '../lib/supabaseClient'
import { randomShortId } from '../lib/shortId'
import { useSession } from '../lib/useSession'
import { useProfile } from '../lib/useProfile'
import UpgradeCard from '../components/UpgradeCard'
import { useDocumentMeta } from '../lib/useDocumentMeta'

const FREE_QR_LIMIT = 3

interface QrCode {
  id: string
  short_id: string
  destination_url: string
  label: string | null
  is_active: boolean
  created_at: string
}

function Dashboard() {
  const { session } = useSession()
  const { isPro, loading: profileLoading } = useProfile()
  const [searchParams] = useSearchParams()
  const [codes, setCodes] = useState<QrCode[]>([])
  const [loading, setLoading] = useState(true)
  const [destinationUrl, setDestinationUrl] = useState('')
  const [label, setLabel] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useDocumentMeta('Your QR codes — QR Generator')

  const loadCodes = async () => {
    const { data } = await supabase
      .from('qr_codes')
      .select('id, short_id, destination_url, label, is_active, created_at')
      .order('created_at', { ascending: false })
    setCodes(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadCodes()
  }, [])

  const atLimit = !isPro && codes.length >= FREE_QR_LIMIT

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session || atLimit) return
    setCreating(true)
    setError(null)

    let attempt = 0
    while (attempt < 5) {
      const shortId = randomShortId()
      const { error: insertError } = await supabase.from('qr_codes').insert({
        owner_id: session.user.id,
        short_id: shortId,
        destination_url: destinationUrl,
        label: label || null,
      })

      if (!insertError) {
        setDestinationUrl('')
        setLabel('')
        await loadCodes()
        setCreating(false)
        return
      }

      // unique_violation on short_id: retry with a new one
      if (insertError.code !== '23505') {
        setError(insertError.message)
        setCreating(false)
        return
      }
      attempt += 1
    }

    setError('Could not generate a unique code, please try again')
    setCreating(false)
  }

  return (
    <div className="app">
      <div className="card wide">
        <div className="card-header">
          <h1>Your QR codes</h1>
          <p className="subtitle">{session?.user.email}</p>
        </div>

        {searchParams.get('upgraded') === '1' && (
          <p className="success">You're on Pro! Unlimited QR codes and API access are unlocked.</p>
        )}

        {!profileLoading && atLimit ? (
          <UpgradeCard reason={`You've used all ${FREE_QR_LIMIT} free dynamic QR codes.`} />
        ) : (
          <form onSubmit={handleCreate} className="form row">
            <input
              type="url"
              required
              placeholder="https://your-destination.com"
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
            />
            <input
              type="text"
              placeholder="Label (optional)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <button type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create dynamic QR'}
            </button>
          </form>
        )}
        {error && <p className="error">{error}</p>}

        {!isPro && !profileLoading && (
          <p className="subtitle">
            {codes.length} / {FREE_QR_LIMIT} free QR codes used
          </p>
        )}

        {loading ? (
          <p>Loading...</p>
        ) : codes.length === 0 ? (
          <p className="subtitle">No dynamic QR codes yet. Create one above.</p>
        ) : (
          <ul className="qr-list">
            {codes.map((code) => (
              <li key={code.id}>
                <Link to={`/dashboard/qr/${code.id}`}>
                  <strong>{code.label || code.short_id}</strong>
                  <span className={`status ${code.is_active ? 'active' : 'inactive'}`}>
                    {code.is_active ? 'Active' : 'Disabled'}
                  </span>
                </Link>
                <span className="destination">{code.destination_url}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default Dashboard

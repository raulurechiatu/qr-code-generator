import { useState } from 'react'
import { startCheckout } from '../lib/billing'

function UpgradeCard({ reason }: { reason: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async () => {
    setLoading(true)
    setError(null)
    const { error: checkoutError } = await startCheckout()
    if (checkoutError) {
      setError(checkoutError)
      setLoading(false)
    }
  }

  return (
    <div className="upgrade-card">
      <p className="upgrade-reason">{reason}</p>
      <h3>Upgrade to Pro</h3>
      <p className="subtitle">Unlimited dynamic QR codes and full developer API access, for a one-time $19.</p>
      {error && <p className="error">{error}</p>}
      <button type="button" onClick={handleUpgrade} disabled={loading}>
        {loading ? 'Redirecting...' : 'Upgrade for $19'}
      </button>
    </div>
  )
}

export default UpgradeCard

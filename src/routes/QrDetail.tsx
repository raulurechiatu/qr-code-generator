import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router'
import QRCode from 'qrcode'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { supabase, functionsBaseUrl } from '../lib/supabaseClient'

interface QrCode {
  id: string
  short_id: string
  destination_url: string
  label: string | null
  is_active: boolean
}

interface Scan {
  scanned_at: string
  device_type: string | null
  browser: string | null
}

function dayKey(iso: string) {
  return iso.slice(0, 10)
}

function QrDetail() {
  const { id } = useParams<{ id: string }>()
  const [qrCode, setQrCode] = useState<QrCode | null>(null)
  const [scans, setScans] = useState<Scan[]>([])
  const [destinationUrl, setDestinationUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const redirectUrl = qrCode ? `${functionsBaseUrl}/redirect/${qrCode.short_id}` : ''

  const load = async () => {
    const { data: code } = await supabase
      .from('qr_codes')
      .select('id, short_id, destination_url, label, is_active')
      .eq('id', id)
      .maybeSingle()

    if (!code) {
      setNotFound(true)
      return
    }
    setQrCode(code)
    setDestinationUrl(code.destination_url)

    const { data: scanRows } = await supabase
      .from('scans')
      .select('scanned_at, device_type, browser')
      .eq('qr_code_id', id)
      .order('scanned_at', { ascending: false })
      .limit(1000)
    setScans(scanRows ?? [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (!redirectUrl || !canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, redirectUrl, {
      width: 220,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
    })
  }, [redirectUrl])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qrCode) return
    setSaving(true)
    await supabase
      .from('qr_codes')
      .update({ destination_url: destinationUrl, updated_at: new Date().toISOString() })
      .eq('id', qrCode.id)
    await load()
    setSaving(false)
  }

  const handleToggleActive = async () => {
    if (!qrCode) return
    await supabase.from('qr_codes').update({ is_active: !qrCode.is_active }).eq('id', qrCode.id)
    await load()
  }

  if (notFound) {
    return (
      <div className="app">
        <div className="card">
          <p>QR code not found.</p>
          <Link to="/dashboard">Back to dashboard</Link>
        </div>
      </div>
    )
  }

  if (!qrCode) {
    return (
      <div className="app">
        <div className="card">Loading...</div>
      </div>
    )
  }

  const byDay: Record<string, number> = {}
  for (const scan of scans) {
    const key = dayKey(scan.scanned_at)
    byDay[key] = (byDay[key] ?? 0) + 1
  }
  const chartData = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))

  return (
    <div className="app">
      <div className="card wide">
        <Link to="/dashboard" className="back-link">
          &larr; Back
        </Link>

        <div className="card-header row">
          <div>
            <h1>{qrCode.label || qrCode.short_id}</h1>
            <p className="subtitle">{scans.length} total scans</p>
          </div>
          <canvas ref={canvasRef} width={220} height={220} className="qr-thumb" />
        </div>

        <form onSubmit={handleSave} className="form row">
          <input
            type="url"
            required
            value={destinationUrl}
            onChange={(e) => setDestinationUrl(e.target.value)}
          />
          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Update destination'}
          </button>
          <button type="button" onClick={handleToggleActive} className="secondary">
            {qrCode.is_active ? 'Disable' : 'Enable'}
          </button>
        </form>

        {chartData.length > 0 && (
          <div className="chart">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {scans.length === 0 ? (
          <p className="subtitle">No scans yet. Share the QR code to see activity here.</p>
        ) : (
          <ul className="scan-list">
            {scans.slice(0, 20).map((scan, i) => (
              <li key={i}>
                {new Date(scan.scanned_at).toLocaleString()} &middot; {scan.device_type ?? 'unknown'} &middot;{' '}
                {scan.browser ?? 'unknown'}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default QrDetail

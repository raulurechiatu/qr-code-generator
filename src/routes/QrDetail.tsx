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
import { useProfile } from '../lib/useProfile'
import UpgradeCard from '../components/UpgradeCard'
import { useDocumentMeta } from '../lib/useDocumentMeta'

const FREE_RANGE_DAYS = 7
const RANGE_OPTIONS: { label: string; days: number | null }[] = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: 'All time', days: null },
]

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
  referrer: string | null
}

function dayKey(iso: string) {
  return iso.slice(0, 10)
}

function referrerLabel(referrer: string | null): string {
  if (!referrer) return 'Direct'
  try {
    return new URL(referrer).hostname
  } catch {
    return referrer
  }
}

function daysAgoISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function topEntries(counts: Record<string, number>, limit = 5) {
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
}

function QrDetail() {
  const { id } = useParams<{ id: string }>()
  const { isPro, loading: profileLoading } = useProfile()
  const [qrCode, setQrCode] = useState<QrCode | null>(null)
  const [scans, setScans] = useState<Scan[]>([])
  const [rangeDays, setRangeDays] = useState<number | null>(FREE_RANGE_DAYS)
  const [destinationUrl, setDestinationUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const redirectUrl = qrCode ? `${functionsBaseUrl}/redirect/${qrCode.short_id}` : ''
  const effectiveRangeDays = isPro ? rangeDays : FREE_RANGE_DAYS

  useDocumentMeta(qrCode ? `${qrCode.label || qrCode.short_id} — QR Generator` : 'QR code — QR Generator')

  const loadScans = async () => {
    let query = supabase
      .from('scans')
      .select('scanned_at, device_type, browser, referrer')
      .eq('qr_code_id', id)
      .order('scanned_at', { ascending: false })
      .limit(1000)

    if (effectiveRangeDays !== null) {
      query = query.gte('scanned_at', daysAgoISO(effectiveRangeDays))
    }

    const { data: scanRows } = await query
    setScans(scanRows ?? [])
  }

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
    await loadScans()
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (qrCode) loadScans()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveRangeDays])

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
  const byDevice: Record<string, number> = {}
  const byBrowser: Record<string, number> = {}
  const byReferrer: Record<string, number> = {}

  for (const scan of scans) {
    byDay[dayKey(scan.scanned_at)] = (byDay[dayKey(scan.scanned_at)] ?? 0) + 1
    const device = scan.device_type ?? 'unknown'
    byDevice[device] = (byDevice[device] ?? 0) + 1
    const browser = scan.browser ?? 'unknown'
    byBrowser[browser] = (byBrowser[browser] ?? 0) + 1
    const referrer = referrerLabel(scan.referrer)
    byReferrer[referrer] = (byReferrer[referrer] ?? 0) + 1
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
            <p className="subtitle">{scans.length} scans in this range</p>
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

        <div className="range-picker">
          {RANGE_OPTIONS.map((option) => {
            const locked = !isPro && option.days !== FREE_RANGE_DAYS
            const active = rangeDays === option.days
            return (
              <button
                key={option.label}
                type="button"
                className={`range-option ${active ? 'active' : ''} ${locked ? 'locked' : ''}`}
                onClick={() => !locked && setRangeDays(option.days)}
                disabled={locked}
                title={locked ? 'Upgrade to Pro to see more than 7 days of history' : undefined}
              >
                {option.label}
                {locked && ' 🔒'}
              </button>
            )
          })}
        </div>

        {!profileLoading && !isPro && (
          <UpgradeCard reason="Free accounts see the last 7 days of scan history." />
        )}

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

        {scans.length > 0 && (
          <div className="stats-grid">
            <div className="stat-block">
              <h4>Devices</h4>
              <ul className="breakdown-list">
                {topEntries(byDevice).map(([label, count]) => (
                  <li key={label}>
                    <span>{label}</span>
                    <span>{count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="stat-block">
              <h4>Browsers</h4>
              <ul className="breakdown-list">
                {topEntries(byBrowser).map(([label, count]) => (
                  <li key={label}>
                    <span>{label}</span>
                    <span>{count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="stat-block">
              <h4>Referrers</h4>
              <ul className="breakdown-list">
                {topEntries(byReferrer).map(([label, count]) => (
                  <li key={label}>
                    <span>{label}</span>
                    <span>{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {scans.length === 0 ? (
          <p className="subtitle">No scans yet in this range. Share the QR code to see activity here.</p>
        ) : (
          <ul className="scan-list">
            {scans.slice(0, 20).map((scan, i) => (
              <li key={i}>
                {new Date(scan.scanned_at).toLocaleString()} &middot; {scan.device_type ?? 'unknown'} &middot;{' '}
                {scan.browser ?? 'unknown'} &middot; {referrerLabel(scan.referrer)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default QrDetail

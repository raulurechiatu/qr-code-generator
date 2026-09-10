import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Link } from 'react-router'

function StaticGenerator() {
  const [text, setText] = useState('https://example.com')
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (!text.trim()) {
      const ctx = canvas.getContext('2d')
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
      setError(null)
      return
    }

    QRCode.toCanvas(
      canvas,
      text,
      { width: 260, margin: 2, color: { dark: '#1a1a2e', light: '#ffffff' } },
      (err) => {
        setError(err ? err.message : null)
      },
    )
  }, [text])

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'qrcode.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const hasContent = !!text.trim()

  return (
    <div className="app">
      <div className="card">
        <div className="card-header">
          <h1>QR Code Generator</h1>
          <p className="subtitle">Turn any text or link into a scannable code</p>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text or URL"
          rows={3}
        />
        {error && <p className="error">{error}</p>}

        <div className={`qr-frame ${!hasContent || error ? 'empty' : ''}`}>
          <canvas ref={canvasRef} width={260} height={260} />
          {!hasContent && <span className="qr-placeholder">Your QR code appears here</span>}
        </div>

        <button type="button" onClick={handleDownload} disabled={!hasContent || !!error}>
          Download PNG
        </button>

        <p className="upsell">
          Want to edit the destination later and see scan analytics?{' '}
          <Link to="/login">Sign in for dynamic QR codes</Link>
        </p>
      </div>
    </div>
  )
}

export default StaticGenerator

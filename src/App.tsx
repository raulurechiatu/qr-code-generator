import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import './App.css'

function App() {
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

    QRCode.toCanvas(canvas, text, { width: 280, margin: 2 }, (err) => {
      setError(err ? err.message : null)
    })
  }, [text])

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'qrcode.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="app">
      <h1>QR Code Generator</h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text or URL"
        rows={3}
      />
      {error && <p className="error">{error}</p>}
      <canvas ref={canvasRef} width={280} height={280} />
      <button type="button" onClick={handleDownload} disabled={!text.trim() || !!error}>
        Download PNG
      </button>
    </div>
  )
}

export default App

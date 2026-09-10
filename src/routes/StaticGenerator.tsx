import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Link } from 'react-router'
import { useDocumentMeta } from '../lib/useDocumentMeta'

const FAQ = [
  {
    question: 'Is this free to use?',
    answer:
      'Yes. The generator above is free, with no account, no watermark, and no scan limit — the QR code is generated entirely in your browser.',
  },
  {
    question: 'Do QR codes expire?',
    answer:
      'A static QR code (the one above) never expires — it directly encodes your text or link, so it works for as long as that content stays valid. A dynamic QR code (sign in to create one) points to a short link we host, which lets you change the destination later, even after the code is printed.',
  },
  {
    question: "What's the difference between a static and dynamic QR code?",
    answer:
      "A static code bakes your text or URL directly into the pattern — simple and permanent. A dynamic code encodes a short redirect link instead, so you can edit where it points and see scan analytics (count, device, time) after it's already printed and in circulation.",
  },
  {
    question: 'What image size and format can I download?',
    answer:
      'The generator downloads a 260×260 PNG, suitable for most print and digital uses. For very large prints, scale it up in an image editor — QR codes remain scannable at larger sizes since they are simple black-and-white patterns.',
  },
]

function StaticGenerator() {
  const [text, setText] = useState('https://example.com')
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useDocumentMeta(
    'Free QR Code Generator — Create, Customize & Track QR Codes',
    'Generate a QR code for free in seconds — no account needed. Turn any link or text into a scannable code and download it as a PNG.',
  )

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

  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    })
    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
    }
  }, [])

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
    <div className="app with-content">
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

      <div className="content-sections">
        <section>
          <h2>How it works</h2>
          <p>
            Type or paste any text, link, Wi-Fi detail, or contact info into the box above.
            As you type, a QR code is generated instantly, right in your browser — nothing is
            uploaded or stored anywhere. When you're happy with it, download it as a PNG to
            print or share.
          </p>
          <p>
            Scanning the code with any phone camera decodes the text back out and, for links,
            offers to open them directly. Because the QR code simply encodes what you typed,
            it will always point to the same content — if you need to change the destination
            later without reprinting, see{' '}
            <Link to="/login">dynamic QR codes</Link> below.
          </p>
        </section>

        <section>
          <h2>Common use cases</h2>
          <ul>
            <li>
              <strong>Restaurant menus</strong> — link to a digital menu instead of a printed one
            </li>
            <li>
              <strong>Business cards and flyers</strong> — send people straight to a website, portfolio, or contact card
            </li>
            <li>
              <strong>Event tickets and check-ins</strong> — encode a confirmation link or ID
            </li>
            <li>
              <strong>Packaging and posters</strong> — link shoppers to product info, reviews, or a sign-up page
            </li>
            <li>
              <strong>Wi-Fi sharing</strong> — encode network credentials so guests can join without typing a password
            </li>
          </ul>
        </section>

        <section>
          <h2>Frequently asked questions</h2>
          {FAQ.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </section>
      </div>
    </div>
  )
}

export default StaticGenerator

import { Link } from 'react-router'

function Terms() {
  return (
    <div className="app">
      <article className="card wide article">
        <Link to="/" className="back-link">
          &larr; Back
        </Link>
        <h1>Terms of Service</h1>
        <p className="subtitle">Last updated September 2026</p>

        <section>
          <h2>Using the service</h2>
          <p>
            The static QR generator is free to use, with no account required. Dynamic QR
            codes, scan analytics, and the developer API require signing in and are provided
            on an as-available basis.
          </p>
        </section>

        <section>
          <h2>Acceptable use</h2>
          <p>You agree not to use this service to create QR codes or API access that:</p>
          <ul>
            <li>Point to illegal content, malware, or phishing pages</li>
            <li>Are used for spam, harassment, or fraud</li>
            <li>Attempt to abuse, overload, or circumvent rate limits on the redirect service or API</li>
          </ul>
          <p>We may disable QR codes, revoke API keys, or suspend accounts that violate this.</p>
        </section>

        <section>
          <h2>Your content</h2>
          <p>
            You're responsible for the destination URLs and labels you create. We don't
            review destinations before they go live, but we may remove or disable a QR code
            if it violates these terms or the law.
          </p>
        </section>

        <section>
          <h2>API usage</h2>
          <p>
            API keys are rate-limited (default 60 requests/minute) and are for your own use.
            Don't share a key publicly or use it to circumvent rate limits with multiple keys.
            See the <Link to="/">API documentation</Link> for details.
          </p>
        </section>

        <section>
          <h2>Service availability</h2>
          <p>
            The service is provided "as is," without warranty of any kind. We aim for
            reliable uptime but don't guarantee it, and dynamic QR codes depend on the
            destination URL remaining valid — we don't control what you point them at.
          </p>
        </section>

        <section>
          <h2>Limitation of liability</h2>
          <p>
            To the extent permitted by law, we're not liable for indirect, incidental, or
            consequential damages arising from your use of the service, including lost
            revenue from a QR code that stops working or a destination that goes offline.
          </p>
        </section>

        <section>
          <h2>Changes</h2>
          <p>We may update these terms as the service evolves; the date above reflects the latest revision.</p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Questions about these terms: <a href="mailto:raul@icarusit.ro">raul@icarusit.ro</a>
          </p>
        </section>
      </article>
    </div>
  )
}

export default Terms

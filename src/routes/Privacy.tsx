import { Link } from 'react-router'

function Privacy() {
  return (
    <div className="app">
      <article className="card wide article">
        <Link to="/" className="back-link">
          &larr; Back
        </Link>
        <h1>Privacy Policy</h1>
        <p className="subtitle">Last updated September 2026</p>

        <section>
          <h2>What we collect</h2>
          <ul>
            <li>
              <strong>Static QR generation (no account):</strong> nothing is sent to our
              servers. The QR code is rendered entirely in your browser.
            </li>
            <li>
              <strong>Account &amp; sign-in:</strong> your email address, used only to send
              you a magic sign-in link and identify your account.
            </li>
            <li>
              <strong>Dynamic QR codes:</strong> the destination URL and optional label you
              enter when creating a dynamic QR code.
            </li>
            <li>
              <strong>Scan analytics:</strong> when someone scans one of your dynamic QR
              codes, we log the time, a coarse device type and browser (parsed from the
              User-Agent header), and the referrer if present. We store a salted hash of the
              scanner's IP address, never the raw IP.
            </li>
            <li>
              <strong>API keys:</strong> we store a cryptographic hash of each API key you
              generate, never the key itself. The raw key is shown to you once, at creation.
            </li>
          </ul>
        </section>

        <section>
          <h2>How we use it</h2>
          <p>
            Solely to operate the service: authenticating you, storing and redirecting your
            dynamic QR codes, and showing you scan analytics for codes you own. We do not
            sell your data or share it with third parties for their own marketing purposes.
          </p>
        </section>

        <section>
          <h2>Where it's stored</h2>
          <p>
            Data is stored with Supabase, our database and authentication provider, which
            acts as our data processor. Scan-triggered redirects are handled by serverless
            functions that read only what's needed to perform the redirect and log the scan.
          </p>
        </section>

        <section>
          <h2>Cookies and advertising</h2>
          <p>
            Signing in sets a session token in your browser's local storage so you stay
            logged in; this is not a third-party tracking cookie. If this site displays ads
            (e.g. via Google AdSense), Google and its partners may use cookies to serve and
            measure ads, including personalized ads based on your visits to this and other
            sites. You can opt out of personalized advertising through{' '}
            <a href="https://adssettings.google.com" target="_blank" rel="noreferrer">
              Google's Ad Settings
            </a>
            .
          </p>
        </section>

        <section>
          <h2>Your rights</h2>
          <p>
            You can edit or delete any dynamic QR code, and revoke any API key, directly from
            your dashboard. To request a full export or deletion of your account data,
            contact us at the address below.
          </p>
        </section>

        <section>
          <h2>Children's privacy</h2>
          <p>This service is not directed at children under 13, and we do not knowingly collect data from them.</p>
        </section>

        <section>
          <h2>Changes to this policy</h2>
          <p>
            If this policy changes materially, we'll update the date at the top of this page.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Questions about this policy or your data: <a href="mailto:raul@icarusit.ro">raul@icarusit.ro</a>
          </p>
        </section>
      </article>
    </div>
  )
}

export default Privacy

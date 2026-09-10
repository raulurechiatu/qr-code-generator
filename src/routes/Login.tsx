import { useState } from 'react'
import { Navigate } from 'react-router'
import { supabase } from '../lib/supabaseClient'
import { useSession } from '../lib/useSession'

function Login() {
  const { session, loading } = useSession()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!loading && session) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setErrorMessage(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/dashboard' },
    })

    if (error) {
      setStatus('error')
      setErrorMessage(error.message)
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="app">
      <div className="card">
        <div className="card-header">
          <h1>Sign in</h1>
          <p className="subtitle">We'll email you a magic link, no password needed</p>
        </div>

        {status === 'sent' ? (
          <p>Check your email for a sign-in link.</p>
        ) : (
          <form onSubmit={handleSubmit} className="form">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {status === 'error' && errorMessage && <p className="error">{errorMessage}</p>}
            <button type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending...' : 'Send magic link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default Login

import { Link, useNavigate } from 'react-router'
import { supabase } from '../lib/supabaseClient'
import { useSession } from '../lib/useSession'

function NavBar() {
  const { session, loading } = useSession()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <header className="nav">
      <Link to="/" className="nav-brand">
        QR Generator
      </Link>

      <nav className="nav-links">
        {loading ? null : session ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/dashboard/api-keys">API keys</Link>
            <span className="nav-email">{session.user.email}</span>
            <button type="button" className="secondary nav-signout" onClick={handleSignOut}>
              Sign out
            </button>
          </>
        ) : (
          <Link to="/login" className="nav-cta">
            Sign in
          </Link>
        )}
      </nav>
    </header>
  )
}

export default NavBar

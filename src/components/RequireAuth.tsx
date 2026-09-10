import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useSession } from '../lib/useSession'

function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useSession()

  if (loading) return <div className="app">Loading...</div>
  if (!session) return <Navigate to="/login" replace />

  return <>{children}</>
}

export default RequireAuth

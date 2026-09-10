import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router'
import StaticGenerator from './routes/StaticGenerator'
import RequireAuth from './components/RequireAuth'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import './App.css'

const Login = lazy(() => import('./routes/Login'))
const Dashboard = lazy(() => import('./routes/Dashboard'))
const QrDetail = lazy(() => import('./routes/QrDetail'))
const ApiKeys = lazy(() => import('./routes/ApiKeys'))
const Privacy = lazy(() => import('./routes/Privacy'))
const Terms = lazy(() => import('./routes/Terms'))

function App() {
  return (
    <>
      <NavBar />
      <Suspense fallback={<div className="app">Loading...</div>}>
        <Routes>
          <Route path="/" element={<StaticGenerator />} />
          <Route path="/login" element={<Login />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard/qr/:id"
            element={
              <RequireAuth>
                <QrDetail />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard/api-keys"
            element={
              <RequireAuth>
                <ApiKeys />
              </RequireAuth>
            }
          />
        </Routes>
      </Suspense>
      <Footer />
    </>
  )
}

export default App

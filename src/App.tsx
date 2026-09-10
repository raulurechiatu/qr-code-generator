import { Route, Routes } from 'react-router'
import StaticGenerator from './routes/StaticGenerator'
import Login from './routes/Login'
import Dashboard from './routes/Dashboard'
import QrDetail from './routes/QrDetail'
import ApiKeys from './routes/ApiKeys'
import Privacy from './routes/Privacy'
import Terms from './routes/Terms'
import RequireAuth from './components/RequireAuth'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import './App.css'

function App() {
  return (
    <>
      <NavBar />
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
      <Footer />
    </>
  )
}

export default App

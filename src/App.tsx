import { Route, Routes } from 'react-router'
import StaticGenerator from './routes/StaticGenerator'
import Login from './routes/Login'
import Dashboard from './routes/Dashboard'
import QrDetail from './routes/QrDetail'
import ApiKeys from './routes/ApiKeys'
import RequireAuth from './components/RequireAuth'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<StaticGenerator />} />
      <Route path="/login" element={<Login />} />
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
  )
}

export default App

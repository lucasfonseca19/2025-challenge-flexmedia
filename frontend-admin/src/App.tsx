import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import HotelsPage from './pages/HotelsPage'
import ReservationsPage from './pages/ReservationsPage'
import UsersPage from './pages/UsersPage'
import TotemPage from './pages/TotemPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/hoteis" element={<HotelsPage />} />
              <Route path="/reservas" element={<ReservationsPage />} />
              <Route path="/usuarios" element={<UsersPage />} />
              <Route path="/totem" element={<TotemPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

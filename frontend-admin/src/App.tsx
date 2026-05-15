import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { InterfaceKit } from 'interface-kit/react'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import HotelsPage from './pages/HotelsPage'
import ReservationsPage from './pages/ReservationsPage'
import UsersPage from './pages/UsersPage'
import TotemPage from './pages/TotemPage'
import ContentPage from './pages/ContentPage'

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
              <Route path="/conteudo" element={<ContentPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      {import.meta.env.DEV && <InterfaceKit />}
    </AuthProvider>
  )
}

export default App

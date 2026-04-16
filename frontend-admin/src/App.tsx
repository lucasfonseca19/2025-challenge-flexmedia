import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import HotelsPage from './pages/HotelsPage'
import ReservationsPage from './pages/ReservationsPage'
import ContentPage from './pages/ContentPage'
import UsersPage from './pages/UsersPage'
import TotemsPage from './pages/TotemsPage'
import ConfigPage from './pages/ConfigPage'

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
              <Route path="/conteudo" element={<ContentPage />} />
              <Route path="/usuarios" element={<UsersPage />} />
              <Route path="/totens" element={<TotemsPage />} />
              <Route path="/configuracao" element={<ConfigPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

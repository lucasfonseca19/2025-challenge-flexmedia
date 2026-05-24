import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PrivateRoute() {
  const { isAutenticado, usuario } = useAuth()
  return isAutenticado && usuario ? <Outlet /> : <Navigate to="/login" replace />
}

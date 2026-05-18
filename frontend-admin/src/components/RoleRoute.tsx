import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Usuario } from '../types'

interface RoleRouteProps {
  allowed: Usuario['role'][]
}

export default function RoleRoute({ allowed }: RoleRouteProps) {
  const { usuario } = useAuth()

  if (!usuario || !allowed.includes(usuario.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

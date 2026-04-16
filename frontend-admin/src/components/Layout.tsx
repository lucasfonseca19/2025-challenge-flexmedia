import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ADMIN_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/hoteis', label: 'Hotéis', icon: '🏨' },
  { to: '/usuarios', label: 'Usuários', icon: '👥' },
]

const OPERADOR_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/reservas', label: 'Reservas', icon: '📋' },
  { to: '/totem', label: 'Totem', icon: '🖥️' },
]

export default function Layout() {
  const { usuario, logout } = useAuth()
  const navItems = usuario?.role === 'ADMIN' ? ADMIN_ITEMS : OPERADOR_ITEMS
  const navigate = useNavigate()
  const [sidebarAberta, setSidebarAberta] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const sidebarContent = (
    <aside className="w-64 flex flex-col bg-slate-800 border-r border-slate-700 h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-700 flex-shrink-0">
        <span className="text-xl font-bold text-blue-400">CheckIn Hub</span>
        <span className="ml-2 text-xs text-slate-500 font-medium">Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setSidebarAberta(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
            {usuario?.nome?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{usuario?.nome ?? 'Admin'}</p>
            <p className="text-xs text-slate-500 truncate">{usuario?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-left"
        >
          Sair
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
      {/* Sidebar — desktop */}
      <div className="hidden md:flex flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Sidebar overlay — mobile */}
      {sidebarAberta && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="flex-shrink-0">{sidebarContent}</div>
          <div
            className="flex-1 bg-black/50"
            onClick={() => setSidebarAberta(false)}
          />
        </div>
      )}

      {/* Área principal */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar — mobile */}
        <header className="md:hidden h-14 flex items-center px-4 bg-slate-800 border-b border-slate-700 flex-shrink-0">
          <button
            onClick={() => setSidebarAberta(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            aria-label="Abrir menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="ml-3 text-lg font-bold text-blue-400">CheckIn Hub</span>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

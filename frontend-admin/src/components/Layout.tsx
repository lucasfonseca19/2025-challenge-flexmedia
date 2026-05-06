import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Buildings, ChartBar, DoorOpen, ImageSquare, List, SignOut, Users } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'

const ADMIN_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: ChartBar },
  { to: '/hoteis', label: 'Hotéis', icon: Buildings },
  { to: '/reservas', label: 'Reservas', icon: DoorOpen },
  { to: '/conteudo', label: 'Totem Studio', icon: ImageSquare },
  { to: '/usuarios', label: 'Usuários', icon: Users },
]

const OPERADOR_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: ChartBar },
  { to: '/reservas', label: 'Reservas', icon: DoorOpen },
  { to: '/totem', label: 'Totens', icon: ImageSquare },
  { to: '/conteudo', label: 'Totem Studio', icon: ImageSquare },
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
    <aside className="w-64 flex flex-col bg-[#111815] border-r border-white/10 h-full">
      <div className="h-16 flex items-center px-6 border-b border-white/10 flex-shrink-0">
        <span className="text-xl font-semibold text-[#d8fff4]">CheckIn Hub</span>
        <span className="ml-2 text-xs text-[#789189] font-medium">Admin</span>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarAberta(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#d7fbe8] text-[#10201d]'
                    : 'text-[#9eb2aa] hover:bg-white/8 hover:text-white'
                }`
              }
            >
              <Icon size={19} weight="duotone" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#d7fbe8] text-[#10201d] flex items-center justify-center text-sm font-bold">
            {usuario?.nome?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{usuario?.nome ?? 'Admin'}</p>
            <p className="text-xs text-slate-500 truncate">{usuario?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full px-3 py-2 text-sm text-[#9eb2aa] hover:text-white hover:bg-white/8 rounded-lg transition-colors text-left flex items-center gap-2"
        >
          <SignOut size={17} />
          Sair
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-[#101513] text-slate-100 overflow-hidden">
      <div className="hidden md:flex flex-shrink-0">
        {sidebarContent}
      </div>

      {sidebarAberta && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="flex-shrink-0">{sidebarContent}</div>
          <div
            className="flex-1 bg-black/50"
            onClick={() => setSidebarAberta(false)}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="md:hidden h-14 flex items-center px-4 bg-[#111815] border-b border-white/10 flex-shrink-0">
          <button
            onClick={() => setSidebarAberta(true)}
            className="p-2 rounded-lg text-[#9eb2aa] hover:text-white hover:bg-white/8 transition-colors"
            aria-label="Abrir menu"
          >
            <List size={24} />
          </button>
          <span className="ml-3 text-lg font-semibold text-[#d8fff4]">CheckIn Hub</span>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

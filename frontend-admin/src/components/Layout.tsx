import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Buildings, ChartBar, DoorOpen, ImageSquare, List, SignOut, Users } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'

const ADMIN_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: ChartBar },
  { to: '/hoteis', label: 'Hotéis', icon: Buildings },
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
  const [sidebarMinimizada, setSidebarMinimizada] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function renderSidebar(colapsada: boolean, mobile = false) {
    return (
      <aside className={`${colapsada ? 'w-20' : 'w-64'} flex flex-col bg-[#111815] border-r border-white/10 h-full overflow-hidden transition-[width] duration-200`}>
        <div className={`h-16 flex items-center border-b border-white/10 flex-shrink-0 ${colapsada ? 'justify-center px-2' : 'justify-between px-4'}`}>
          {colapsada ? (
            <button
              onClick={() => setSidebarMinimizada(false)}
              className="flex items-center justify-center w-full px-3 py-3 rounded-lg text-[#9eb2aa] hover:text-white hover:bg-white/8 transition-colors"
              aria-label="Expandir menu lateral"
              title="Expandir menu lateral"
            >
              <List size={20} />
            </button>
          ) : (
            <div className="min-w-0 overflow-hidden">
              <span className="text-xl font-semibold text-[#d8fff4]">CheckIn Hub</span>
              <span className="ml-2 text-xs text-[#789189] font-medium">Admin</span>
            </div>
          )}
          {!mobile && !colapsada && (
            <button
              onClick={() => setSidebarMinimizada(actual => !actual)}
              className="p-2 rounded-lg text-[#9eb2aa] hover:text-white hover:bg-white/8 transition-colors"
              aria-label={colapsada ? 'Expandir menu lateral' : 'Minimizar menu lateral'}
              title={colapsada ? 'Expandir menu lateral' : 'Minimizar menu lateral'}
            >
              <List size={20} />
            </button>
          )}
        </div>

        <nav className={`flex-1 py-4 overflow-y-auto space-y-1 ${colapsada ? 'px-2' : 'px-3'}`}>
          {navItems.map(item => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarAberta(false)}
                aria-label={colapsada ? item.label : undefined}
                title={colapsada ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center rounded-lg text-sm font-medium transition-colors ${
                    colapsada ? 'justify-center px-3 py-3' : 'gap-3 px-4 py-3'
                  } ${
                    isActive
                      ? 'bg-[#d7fbe8] text-[#10201d]'
                      : 'text-[#9eb2aa] hover:bg-white/8 hover:text-white'
                  }`
                }
            >
              <Icon size={19} weight="duotone" />
              {!colapsada && item.label}
            </NavLink>
          )
          })}
        </nav>

        <div className={`p-4 border-t border-white/10 flex-shrink-0 ${colapsada ? 'px-2' : ''}`}>
          <div className={`mb-3 ${colapsada ? 'flex justify-center' : 'flex items-center gap-3'}`}>
            <div className="w-8 h-8 rounded-lg bg-[#d7fbe8] text-[#10201d] flex items-center justify-center text-sm font-bold">
              {usuario?.nome?.[0]?.toUpperCase() ?? 'A'}
            </div>
            {!colapsada && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{usuario?.nome ?? 'Admin'}</p>
                <p className="text-xs text-slate-500 truncate">{usuario?.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            aria-label="Sair"
            title={colapsada ? 'Sair' : undefined}
            className={`text-sm text-[#9eb2aa] hover:text-white hover:bg-white/8 rounded-lg transition-colors flex items-center ${
              colapsada ? 'w-full justify-center px-3 py-3' : 'w-full gap-2 px-3 py-2 text-left'
            }`}
          >
            <SignOut size={17} />
            {!colapsada && 'Sair'}
          </button>
        </div>
      </aside>
    )
  }

  return (
    <div className="flex h-screen bg-[#101513] text-slate-100 overflow-hidden">
      <div className="hidden md:flex flex-shrink-0">
        {renderSidebar(sidebarMinimizada)}
      </div>

      {sidebarAberta && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="flex-shrink-0">{renderSidebar(false, true)}</div>
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

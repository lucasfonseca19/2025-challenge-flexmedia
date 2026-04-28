import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { TotemProvider, useTotem } from './context/TotemContext'
import { totemConfigService } from './services/api'
import IdlePage from './pages/IdlePage'
import SetupPage from './pages/SetupPage'
import LanguagePage from './pages/LanguagePage'
import SearchReservationPage from './pages/SearchReservationPage'
import ConfirmDataPage from './pages/ConfirmDataPage'
import FacialRecognitionPage from './pages/FacialRecognitionPage'
import DoorPage from './pages/DoorPage'
import IssueKeyPage from './pages/IssueKeyPage'
import CheckoutPage from './pages/CheckoutPage'
import ThankYouPage from './pages/ThankYouPage'

function AppContent() {
  const { totemConfig } = useTotem()
  const navigate = useNavigate()

  useEffect(() => {
    const path = window.location.pathname
    if (!totemConfig && path !== '/setup' && !path.startsWith('/porta/')) {
      navigate('/setup')
    }
  }, [navigate, totemConfig])

  useEffect(() => {
    if (!totemConfig?.id) return

    const interval = setInterval(() => {
      totemConfigService.heartbeat(totemConfig.id).catch(() => {})
    }, 60000)

    totemConfigService.heartbeat(totemConfig.id).catch(() => {})

    return () => clearInterval(interval)
  }, [totemConfig?.id])

  useEffect(() => {
    if (totemConfig?.config?.corPrimaria) {
      document.documentElement.style.setProperty('--color-primary', totemConfig.config.corPrimaria)
    }
  }, [totemConfig?.config?.corPrimaria])

  return (
    <Routes>
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/" element={<IdlePage />} />
      <Route path="/selecionar-idioma" element={<LanguagePage />} />
      <Route path="/buscar-reserva" element={<SearchReservationPage />} />
      <Route path="/confirmar-dados" element={<ConfirmDataPage />} />
      <Route path="/facial" element={<FacialRecognitionPage />} />
      <Route path="/porta/:quarto" element={<DoorPage />} />
      <Route path="/emitir-chave" element={<IssueKeyPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/obrigado" element={<ThankYouPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <TotemProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TotemProvider>
  )
}

export default App

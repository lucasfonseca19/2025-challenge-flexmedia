import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { TotemProvider, useTotem } from './context/TotemContext'
import { totemConfigService } from './services/api'
import IdlePage from './pages/IdlePage'
import SetupPage from './pages/SetupPage'
import SearchReservationPage from './pages/SearchReservationPage'
import ConfirmDataPage from './pages/ConfirmDataPage'
import FacialRecognitionPage from './pages/FacialRecognitionPage'
import DoorPage from './pages/DoorPage'
import IssueKeyPage from './pages/IssueKeyPage'
import CheckoutPage from './pages/CheckoutPage'
import ThankYouPage from './pages/ThankYouPage'

function AppContent() {
  const { totemConfig, setTotemConfig, sincronizarConfig } = useTotem()
  const navigate = useNavigate()

  useEffect(() => {
    const path = window.location.pathname
    if (!totemConfig && path !== '/setup' && !path.startsWith('/porta/')) {
      navigate('/setup')
    }
  }, [navigate, totemConfig])

  useEffect(() => {
    if (!totemConfig?.codigo) return
    sincronizarConfig()
  }, [])

  useEffect(() => {
    if (!totemConfig?.id) return

    async function sendHeartbeat() {
      try {
        await totemConfigService.heartbeat(totemConfig.id)
      } catch {
        setTotemConfig(null)
      }
    }

    const interval = setInterval(sendHeartbeat, 60000)
    sendHeartbeat()

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

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTotem } from '../context/TotemContext'
import { checkinService } from '../services/api'
import { faceRecognitionService } from '../services/faceRecognitionService'
import type { Idioma } from '../types'

type Modo = 'camera' | 'dataNascimento'
type StatusCamera = 'carregando' | 'aguardando' | 'processando' | 'sucesso' | 'erro'

function mascaraData(valor: string): string {
  const digits = valor.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function parsearParaIso(valor: string, idioma: Idioma): string | null {
  const parts = valor.split('/')
  if (parts.length !== 3 || parts[2].length !== 4) return null
  const [a, b, ano] = parts
  const dia = idioma === 'en' ? b : a
  const mes = idioma === 'en' ? a : b
  const d = Number(dia), m = Number(mes), y = Number(ano)
  if (isNaN(d) || isNaN(m) || isNaN(y) || m < 1 || m > 12 || d < 1 || d > 31) return null
  return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
}

export default function FacialRecognitionPage() {
  const navigate = useNavigate()
  const { t, idioma, fluxo, reserva } = useTotem()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const temDataNascimento = !!reserva?.hospedeDataNascimento
  const [modo, setModo] = useState<Modo>('camera')
  const [statusCamera, setStatusCamera] = useState<StatusCamera>('carregando')
  const [cameraAtiva, setCameraAtiva] = useState(false)
  const [erroCapturaMsg, setErroCapturaMsg] = useState<string | null>(null)

  const [dataNascimento, setDataNascimento] = useState('')
  const [erroData, setErroData] = useState<string | null>(null)
  const [erroIdentidade, setErroIdentidade] = useState<string | null>(null)
  const [confirmandoDob, setConfirmandoDob] = useState(false)

  useEffect(() => {
    if (modo !== 'camera') {
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
      setCameraAtiva(false)
      setStatusCamera('aguardando')
      return
    }

    let cancelled = false

    async function iniciarCamera() {
      try {
        setStatusCamera('carregando')
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setCameraAtiva(true)
        setStatusCamera('aguardando')
        void faceRecognitionService.init().catch(() => {
          if (!cancelled) {
            setStatusCamera('erro')
            setErroCapturaMsg('Não foi possível carregar a biometria facial.')
          }
        })

        if (fluxo === 'checkout') {
          setTimeout(() => {
            if (!cancelled) navigate('/checkout')
          }, 1500)
        }
      } catch (error) {
        setCameraAtiva(false)
        setStatusCamera('erro')
        setErroCapturaMsg(error instanceof Error ? error.message : 'Não foi possível inicializar a biometria.')
      }
    }

    iniciarCamera()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [fluxo, modo, navigate])

  async function capturarEValidar() {
    if (!videoRef.current || !cameraAtiva) return
    setErroCapturaMsg(null)
    setStatusCamera('processando')

    try {
      const descriptor = await faceRecognitionService.captureDescriptor(videoRef.current)
      if (!reserva?.id) {
        throw new Error('Reserva não carregada. Volte e busque a reserva novamente.')
      }
      await checkinService.confirmar(reserva.id, {
        faceDescriptor: faceRecognitionService.serializeDescriptor(descriptor),
        idioma,
      })
      setStatusCamera('sucesso')
      setTimeout(() => navigate('/emitir-chave'), 1500)
    } catch (err: unknown) {
      setStatusCamera('erro')
      const msg = err instanceof Error ? err.message : 'Erro ao validar rosto.'
      setErroCapturaMsg(msg)
      setTimeout(() => setStatusCamera('aguardando'), 2500)
    }
  }

  async function confirmarDataNascimento() {
    if (!dataNascimento) {
      setErroData(t.verificacaoIdentidade.erroDataObrigatoria)
      return
    }
    const isoDate = parsearParaIso(dataNascimento, idioma)
    if (!isoDate) {
      setErroData(t.verificacaoIdentidade.erroFormatoInvalido)
      return
    }
    if (isoDate !== reserva?.hospedeDataNascimento) {
      setErroData(t.verificacaoIdentidade.erroDataInvalida)
      return
    }
    setErroData(null)
    setConfirmandoDob(true)
    try {
      await checkinService.confirmar(reserva!.id, { dataNascimento: isoDate, idioma })
      navigate(fluxo === 'checkout' ? '/checkout' : '/emitir-chave')
    } catch {
      setErroData(t.verificacaoIdentidade.erroDataInvalida)
    } finally {
      setConfirmandoDob(false)
    }
  }

  function validarManualmente() {
    if (temDataNascimento) {
      trocarModo('dataNascimento')
      return
    }
    setErroIdentidade(t.verificacaoIdentidade.erroValidacaoObrigatoria)
  }

  function trocarModo(novoModo: Modo) {
    setErroData(null)
    setDataNascimento('')
    setErroCapturaMsg(null)
    setModo(novoModo)
  }

  const statusTexto: Record<StatusCamera, string> = {
    carregando: 'Carregando biometria facial...',
    aguardando: t.reconhecimentoFacial.instrucao,
    processando: t.reconhecimentoFacial.processando,
    sucesso: t.reconhecimentoFacial.sucesso,
    erro: erroCapturaMsg ?? 'Rosto não reconhecido. Tente novamente.',
  }
  const statusCor: Record<StatusCamera, string> = {
    carregando: 'border-white/20',
    aguardando: 'border-blue-400',
    processando: 'border-yellow-400',
    sucesso: 'border-green-400',
    erro: 'border-red-400',
  }
  const podeCadastrarFace = !!reserva?.id && fluxo !== 'checkout'

  return (
    <div className="flex min-h-[100dvh] w-screen flex-col items-center justify-center bg-[#0c0f0e] p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">

        {temDataNascimento && (
          <div className="inline-flex gap-1 rounded-2xl border border-white/8 bg-white/[0.04] p-1">
            <button
              onClick={() => trocarModo('camera')}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                modo === 'camera' ? 'bg-white/15 text-white' : 'text-white/45 hover:text-white/80'
              }`}
            >
              Camera
            </button>
            <button
              onClick={() => trocarModo('dataNascimento')}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                modo === 'dataNascimento' ? 'bg-white/15 text-white' : 'text-white/45 hover:text-white/80'
              }`}
            >
              Data nasc.
            </button>
          </div>
        )}

        {modo === 'camera' && (
          <div className="flex flex-col items-center gap-5">
            <h2 className="text-center text-xl font-semibold text-white/90">
              {t.reconhecimentoFacial.titulo}
            </h2>

            <div className={`relative aspect-square w-full max-w-72 overflow-hidden rounded-[2rem] border-2 ${statusCor[statusCamera]} bg-black/40 transition-colors duration-500`}>
              <video
                ref={videoRef}
                autoPlay muted playsInline
                className={`h-full w-full scale-x-[-1] object-cover ${cameraAtiva ? 'block' : 'hidden'}`}
              />
              {!cameraAtiva && (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="h-14 w-14 rounded-full border-2 border-white/15 bg-white/5" />
                </div>
              )}
              {statusCamera === 'sucesso' && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-500/25">
                  <span className="text-6xl text-white">&#10003;</span>
                </div>
              )}
              {statusCamera === 'erro' && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/25">
                  <span className="text-5xl font-bold text-white">!</span>
                </div>
              )}
            </div>

            <p className="text-center text-sm leading-relaxed text-white/55">{statusTexto[statusCamera]}</p>

            {erroIdentidade && (
              <p className="w-full rounded-xl border border-red-400/20 bg-red-500/8 px-4 py-3 text-sm text-red-200">{erroIdentidade}</p>
            )}

            {(statusCamera === 'aguardando' || statusCamera === 'erro') && cameraAtiva && podeCadastrarFace && (
              <div className="flex w-full max-w-72 flex-col gap-3">
                <button
                  onClick={capturarEValidar}
                  className="touch-press w-full rounded-2xl bg-[var(--kiosk-primary,#0f766e)] px-6 py-4 text-lg font-bold text-white"
                >
                  Validar rosto
                </button>
                <button
                  onClick={validarManualmente}
                  className="touch-press w-full rounded-2xl border border-white/12 bg-white/8 px-6 py-4 text-base font-semibold text-white/70"
                >
                  {t.reconhecimentoFacial.btnManual}
                </button>
              </div>
            )}

            {(statusCamera === 'aguardando' || statusCamera === 'erro') && cameraAtiva && !podeCadastrarFace && fluxo !== 'checkout' && (
              <p className="text-sm text-red-200/80">Reserva não carregada.</p>
            )}

            {(statusCamera === 'carregando' || statusCamera === 'processando') && (
              <p className="animate-pulse text-sm text-amber-100/70">Aguarde...</p>
            )}
          </div>
        )}

        {modo === 'dataNascimento' && (
          <div className="flex w-full flex-col gap-5">
            <h2 className="text-center text-xl font-semibold text-white/90">
              {t.verificacaoIdentidade.labelData}
            </h2>

            <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-5">
              <input
                type="text"
                inputMode="numeric"
                value={dataNascimento}
                onChange={e => {
                  const masked = mascaraData(e.target.value)
                  setDataNascimento(masked)
                  setErroData(null)
                }}
                placeholder={t.verificacaoIdentidade.formatoData}
                maxLength={10}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-center text-xl tracking-widest text-white outline-none placeholder:text-white/25"
              />
              {erroData && (
                <p className="mt-3 text-center text-sm text-red-200/80">{erroData}</p>
              )}
            </div>

            <div className="flex w-full flex-col gap-3">
              <button
                onClick={confirmarDataNascimento}
                disabled={confirmandoDob}
                className="touch-press w-full rounded-2xl bg-[var(--kiosk-primary,#0f766e)] px-6 py-4 text-lg font-bold text-white disabled:opacity-50"
              >
                {confirmandoDob ? t.geral.carregando : t.verificacaoIdentidade.btnConfirmar}
              </button>
              <button
                onClick={() => trocarModo('camera')}
                className="touch-press w-full rounded-2xl border border-white/12 bg-white/8 px-6 py-4 text-base font-semibold text-white/70"
              >
                {t.geral.btnVoltar}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

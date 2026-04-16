import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as faceapi from 'face-api.js'
import { useTotem } from '../context/TotemContext'
import { checkinService } from '../services/api'
import type { Idioma } from '../types'

type Modo = 'camera' | 'dataNascimento'

/** Auto-insere barras: DD/MM/YYYY ou MM/DD/YYYY (mesma máscara, 2/2/4 dígitos) */
function mascaraData(valor: string): string {
  const digits = valor.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

/** Converte entrada do usuário para ISO YYYY-MM-DD conforme idioma */
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
  const [statusCamera, setStatusCamera] = useState<'aguardando' | 'processando' | 'sucesso'>('aguardando')
  const [cameraAtiva, setCameraAtiva] = useState(false)
  const [modelosCarregados, setModelosCarregados] = useState(false)

  // DOB mode state
  const [dataNascimento, setDataNascimento] = useState('')
  const [erroData, setErroData] = useState<string | null>(null)
  const [confirmandoDob, setConfirmandoDob] = useState(false)

  // Carregar modelos face-api.js uma única vez
  useEffect(() => {
    async function carregarModelos() {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models')
      setModelosCarregados(true)
    }
    carregarModelos()
  }, [])

  // Capturar descriptor do vídeo ao vivo
  async function capturarDescriptor(): Promise<number[] | null> {
    if (!videoRef.current) return null
    const detection = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor()
    if (!detection) return null
    return Array.from(detection.descriptor) // Float32Array → number[]
  }

  async function prosseguir() {
    if (fluxo === 'checkin' && reserva?.id) {
      const descriptor = await capturarDescriptor()
      try {
        await checkinService.confirmar(reserva.id, {
          faceDescriptor: descriptor ? JSON.stringify(descriptor) : null,
          idioma
        })
      } catch { /* ignora */ }
    }
    navigate(fluxo === 'checkout' ? '/checkout' : '/emitir-chave')
  }

  // Camera: start/stop when modo changes
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
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) { videoRef.current.srcObject = stream }
        setCameraAtiva(true)

        // Aguarda modelos carregarem antes de detectar
        const aguardarModelos = () => new Promise<void>(resolve => {
          if (modelosCarregados) { resolve(); return }
          const id = setInterval(() => {
            if (modelosCarregados || cancelled) { clearInterval(id); resolve() }
          }, 200)
        })
        await aguardarModelos()
        if (cancelled) return

        setStatusCamera('processando')

        // Tenta capturar descriptor com face-api.js
        const detection = await faceapi
          .detectSingleFace(videoRef.current!, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor()

        if (cancelled) return

        if (detection) {
          setStatusCamera('sucesso')
          setTimeout(() => { if (!cancelled) prosseguir() }, 1500)
        } else {
          // Face não detectada — volta para aguardando para nova tentativa
          setStatusCamera('aguardando')
        }
      } catch {
        setCameraAtiva(false)
      }
    }

    iniciarCamera()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [modo, modelosCarregados])

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
    await prosseguir()
  }

  async function validarManualmente() {
    await prosseguir()
  }

  function trocarModo(novoModo: Modo) {
    setErroData(null)
    setDataNascimento('')
    setModo(novoModo)
  }

  const statusTexto = {
    aguardando: t.reconhecimentoFacial.instrucao,
    processando: t.reconhecimentoFacial.processando,
    sucesso: t.reconhecimentoFacial.sucesso,
  }
  const statusCor = {
    aguardando: 'border-blue-500',
    processando: 'border-yellow-400',
    sucesso: 'border-green-400',
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-slate-900 text-white gap-6 px-4 py-8">
      <h2 className="text-3xl md:text-5xl font-bold text-center">{t.reconhecimentoFacial.titulo}</h2>

      {/* Seletor de modo — só aparece se dataNascimento estiver cadastrada */}
      {temDataNascimento && (
        <div className="flex gap-2 bg-slate-800 rounded-2xl p-1">
          <button
            onClick={() => trocarModo('camera')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-base md:text-lg font-medium transition-colors ${
              modo === 'camera' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            📷 {t.verificacaoIdentidade.btnCamera}
          </button>
          <button
            onClick={() => trocarModo('dataNascimento')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-base md:text-lg font-medium transition-colors ${
              modo === 'dataNascimento' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            🎂 {t.verificacaoIdentidade.btnDataNascimento}
          </button>
        </div>
      )}

      {/* ── Modo Câmera ── */}
      {modo === 'camera' && (
        <>
          <div className={`relative w-56 h-56 md:w-80 md:h-80 rounded-full overflow-hidden border-4 ${statusCor[statusCamera]} transition-colors duration-500`}>
            {cameraAtiva ? (
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
            ) : (
              <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                <span className="text-6xl">📷</span>
              </div>
            )}
            {statusCamera === 'sucesso' && (
              <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                <span className="text-8xl">✓</span>
              </div>
            )}
          </div>

          <p className="text-lg md:text-2xl text-slate-300 text-center px-6 md:px-16">{statusTexto[statusCamera]}</p>

          {statusCamera === 'aguardando' && (
            <button
              onClick={validarManualmente}
              className="mt-2 px-6 py-3 md:px-10 md:py-4 bg-slate-700 hover:bg-slate-600 text-white text-base md:text-xl rounded-2xl transition-colors active:scale-95"
            >
              {t.reconhecimentoFacial.btnManual}
            </button>
          )}
        </>
      )}

      {/* ── Modo Data de Nascimento ── */}
      {modo === 'dataNascimento' && (
        <div className="flex flex-col items-center gap-5 w-full max-w-sm">
          <div className="bg-slate-800 rounded-3xl p-6 md:p-8 w-full shadow-xl flex flex-col gap-4">
            <label className="text-slate-400 text-sm md:text-base">{t.verificacaoIdentidade.labelData}</label>
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
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white text-lg md:text-xl text-center tracking-widest focus:outline-none focus:border-blue-500"
            />
            {erroData && (
              <p className="text-red-400 text-sm md:text-base text-center">{erroData}</p>
            )}
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 py-3 md:py-4 bg-slate-700 hover:bg-slate-600 text-white text-base md:text-xl rounded-2xl transition-colors active:scale-95"
            >
              {t.geral.btnVoltar}
            </button>
            <button
              onClick={confirmarDataNascimento}
              disabled={confirmandoDob}
              className="flex-1 py-3 md:py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-base md:text-xl font-semibold rounded-2xl transition-colors active:scale-95"
            >
              {confirmandoDob ? t.geral.carregando : t.verificacaoIdentidade.btnConfirmar}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


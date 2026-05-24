import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { quartoService, type ValidacaoFaceResponse } from '../services/api'
import { faceRecognitionService } from '../services/faceRecognitionService'
import { KioskShell } from '../components/KioskShell'

type Estado = 'camera' | 'processando' | 'resultado'

export default function DoorPage() {
  const { quarto } = useParams<{ quarto: string }>()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [estado, setEstado] = useState<Estado>('camera')
  const [cameraAtiva, setCameraAtiva] = useState(false)
  const [resultado, setResultado] = useState<ValidacaoFaceResponse | null>(null)
  const [similaridade, setSimilaridade] = useState<number | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          void videoRef.current.play().catch(() => undefined)
        }
        setCameraAtiva(true)
        void faceRecognitionService.init()
      })
      .catch(() => setCameraAtiva(false))

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  useEffect(() => {
    if (estado !== 'resultado') return
    const timer = setTimeout(() => {
      setEstado('camera')
      setResultado(null)
      setSimilaridade(null)
      setErro(null)
    }, 6000)
    return () => clearTimeout(timer)
  }, [estado])

  useEffect(() => {
    if (estado === 'resultado' || !cameraAtiva || !videoRef.current || !streamRef.current) return
    if (videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
    void videoRef.current.play().catch(() => undefined)
  }, [estado, cameraAtiva])

  async function capturarEValidar() {
    if (!videoRef.current || !cameraAtiva || !quarto) return
    setErro(null)
    setEstado('processando')

    try {
      const descriptorAtual = await faceRecognitionService.captureDescriptor(videoRef.current)
      const res = await quartoService.validarFace(quarto)

      if (!res.sucesso || !res.descriptorArmazenado) {
        setResultado(res)
        setEstado('resultado')
        return
      }

      const descriptorArmazenado = faceRecognitionService.parseDescriptor(res.descriptorArmazenado)
      const score = faceRecognitionService.compareDescriptors(descriptorArmazenado, descriptorAtual)
      const acessoPermitido = score >= faceRecognitionService.threshold

      setSimilaridade(score)
      setResultado({
        sucesso: acessoPermitido,
        mensagem: acessoPermitido ? 'Acesso liberado' : 'Rosto não reconhecido',
        descriptorArmazenado: null,
        hospedeNome: res.hospedeNome,
        quartoNumero: res.quartoNumero,
      })
      setEstado('resultado')
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao validar acesso.')
      setEstado('camera')
    }
  }

  const acessoPermitido = resultado?.mensagem === 'Acesso liberado'

  return (
    <KioskShell
      eyebrow="Acesso ao quarto"
      title={`Quarto ${quarto}`}
      subtitle={estado === 'processando' ? 'Validando identidade...' : 'Posicione o rosto para liberar o acesso'}
      maxWidth="max-w-sm"
    >
      <div className="flex w-full flex-col items-center gap-6">
        {estado === 'resultado' && resultado && (
          <div className={`flex w-full flex-col items-center gap-4 rounded-[2rem] border p-8 text-center ${acessoPermitido ? 'border-green-400/25 bg-green-500/10' : 'border-red-400/25 bg-red-500/10'}`}>
            <span className="text-7xl">{acessoPermitido ? '\u2713' : '\u2717'}</span>
            <p className="text-2xl font-bold text-[var(--kiosk-text)]">
              {acessoPermitido ? 'Acesso liberado' : 'Acesso negado'}
            </p>
            {resultado.hospedeNome && (
              <p className="text-lg text-[color-mix(in_srgb,var(--kiosk-text)_70%,transparent)]">{resultado.hospedeNome}</p>
            )}
            <p className="text-sm text-[color-mix(in_srgb,var(--kiosk-text)_48%,transparent)]">Quarto {quarto}</p>
            {similaridade && similaridade > 0 && (
              <p className="text-xs text-[color-mix(in_srgb,var(--kiosk-text)_38%,transparent)]">
                {(similaridade * 100).toFixed(0)}%
              </p>
            )}
            {!resultado.sucesso && (
              <p className="text-sm text-[color-mix(in_srgb,var(--kiosk-text)_62%,transparent)]">{resultado.mensagem}</p>
            )}
            <p className="mt-2 text-xs text-[color-mix(in_srgb,var(--kiosk-text)_34%,transparent)]">Voltando em 6s...</p>
          </div>
        )}

        {estado !== 'resultado' && (
          <div className="flex flex-col items-center gap-5">
            <div className={`relative aspect-square w-full max-w-72 overflow-hidden rounded-[2rem] border-2 transition-colors duration-300 ${estado === 'processando' ? 'border-yellow-400' : 'border-white/15'}`}>
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
              {estado === 'processando' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="h-12 w-12 animate-pulse rounded-full border-2 border-white/30 bg-white/8" />
                </div>
              )}
            </div>

            <p className="text-center text-sm text-[color-mix(in_srgb,var(--kiosk-text)_56%,transparent)]">
              {estado === 'processando' ? 'Validando identidade...' : 'Posicione o rosto para liberar o acesso'}
            </p>

            {erro && (
              <p className="w-full rounded-xl border border-red-400/20 bg-red-500/8 px-4 py-3 text-sm text-red-200">{erro}</p>
            )}

            {estado === 'camera' && cameraAtiva && (
              <button
                onClick={capturarEValidar}
                className="touch-press w-full max-w-72 rounded-2xl bg-[var(--kiosk-primary,#0f766e)] px-6 py-4 text-lg font-bold text-[var(--kiosk-on-primary,#fff)]"
              >
                Capturar
              </button>
            )}

            {estado === 'processando' && (
              <p className="animate-pulse text-sm text-amber-100/70">Aguarde...</p>
            )}
          </div>
        )}
      </div>
    </KioskShell>
  )
}

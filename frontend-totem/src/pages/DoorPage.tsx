import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { quartoService, type ValidacaoFaceResponse } from '../services/api'
import { faceRecognitionService } from '../services/faceRecognitionService'

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
        if (videoRef.current) videoRef.current.srcObject = stream
        setCameraAtiva(true)
        void faceRecognitionService.init()
      })
      .catch(() => setCameraAtiva(false))

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  // Após mostrar resultado, volta à câmera após 6 segundos
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

  async function capturarEValidar() {
    if (!videoRef.current || !cameraAtiva || !quarto) return
    setErro(null)
    setEstado('processando')

    try {
      const [descriptorAtual, res] = await Promise.all([
        faceRecognitionService.captureDescriptor(videoRef.current),
        quartoService.validarFace(quarto),
      ])

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
        sucesso: true,
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
    <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-slate-900 text-white gap-6 px-4 py-8">

      {/* Cabeçalho com número do quarto */}
      <div className="text-center">
        <p className="text-slate-400 text-lg">Acesso ao quarto</p>
        <h1 className="text-5xl md:text-7xl font-bold">{quarto ?? '—'}</h1>
      </div>

      {/* Tela de resultado */}
      {estado === 'resultado' && resultado && (
        <div className={`flex flex-col items-center gap-4 w-full max-w-sm rounded-3xl p-8 ${acessoPermitido ? 'bg-green-900/60' : 'bg-red-900/60'}`}>
          <span className="text-9xl">{acessoPermitido ? '✓' : '✗'}</span>
          <p className="text-3xl font-bold text-center">
            {acessoPermitido ? 'Acesso liberado' : 'Acesso negado'}
          </p>
          {resultado.hospedeNome && (
            <p className="text-xl text-slate-300 text-center">{resultado.hospedeNome}</p>
          )}
          {similaridade && similaridade > 0 && (
            <p className="text-slate-400 text-sm">
              Similaridade: {(similaridade * 100).toFixed(1)}%
            </p>
          )}
          {!resultado.sucesso && (
            <p className="text-slate-400 text-sm text-center">{resultado.mensagem}</p>
          )}
          <p className="text-slate-500 text-xs mt-2">Voltando em 6 segundos...</p>
        </div>
      )}

      {/* Câmera e botão de captura */}
      {estado !== 'resultado' && (
        <>
          <div className={`relative w-64 h-64 md:w-96 md:h-96 rounded-full overflow-hidden border-4 transition-colors duration-300 ${estado === 'processando' ? 'border-yellow-400' : 'border-blue-500'}`}>
            {/* Sempre no DOM para que videoRef.current esteja disponível antes de setCameraAtiva */}
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover scale-x-[-1] ${cameraAtiva ? 'block' : 'hidden'}`}
            />
            {!cameraAtiva && (
              <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                <span className="text-6xl">📷</span>
              </div>
            )}
            {estado === 'processando' && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-4xl animate-pulse">🔍</span>
              </div>
            )}
          </div>

          <p className="text-slate-300 text-lg md:text-xl text-center">
            {estado === 'processando' ? 'Validando...' : 'Posicione seu rosto e clique em Capturar'}
          </p>

          {erro && <p className="text-red-400 text-base text-center">{erro}</p>}

          {estado === 'camera' && cameraAtiva && (
            <button
              onClick={capturarEValidar}
              className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white text-xl font-semibold rounded-2xl transition-colors active:scale-95"
            >
              📸 Capturar
            </button>
          )}

          {estado === 'processando' && (
            <p className="text-yellow-400 text-base animate-pulse">Aguarde...</p>
          )}
        </>
      )}
    </div>
  )
}
